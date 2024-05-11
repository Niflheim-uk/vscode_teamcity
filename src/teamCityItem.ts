import { Uri } from 'vscode';
import { BuildStatus, getTCRecentBuilds, getTCBuildType, getTCProject, setTCBuildQueue, getTCBuild } from './restApiInterface';
import { RestApiBuildState, RestApiBuildType, RestApiProject, RestApiBuild, RestApiBuildStatus } from './interfaces';

export enum TeamCityItemType {
  project,
  buildconfig,
  build,
  unknown,
}
export class TeamCityItem  {
  public readonly itemType:TeamCityItemType;
  public children:TeamCityItem[]=[];
  public treeItem:any = null;
  constructor(
    private xmlData:any, 
    public readonly parent:TeamCityItem|null, 
  ) {
    var type = TeamCityItemType.unknown;
    if(this.isProjectData(xmlData)) {
      type = TeamCityItemType.project;
    } else if(this.isBuildTypeData(xmlData)) {
      type = TeamCityItemType.buildconfig;
    } else if(this.isBuildData(xmlData)) {
      type = TeamCityItemType.build;
    }
    this.itemType = type;
  }
  private isProjectData(xmlData:any):boolean {
    if(xmlData.href && xmlData.href.match("/app/rest/projects/id:")) {
      return true;
    } 
    return false;
  }
  private isBuildTypeData(xmlData:any):boolean {
    if(xmlData.href && xmlData.href.match("/app/rest/buildTypes/id:")) {
      return true;
    } 
    return false;
  }
  private isBuildData(xmlData:any):boolean {
    if(xmlData.href) {
      if(xmlData.href.match("/app/rest/builds/id:")) {
        return true;
      }
      if(xmlData.href.match("/app/rest/buildQueue/id:")) {
        return true;
      }
    }
    return false;
  }
  private getBuildStatus():BuildStatus {
    if(this.itemType !== TeamCityItemType.build || this.xmlData === undefined) {
      return BuildStatus.unknown;
    }
    const buildData:RestApiBuild = this.xmlData;
    switch (buildData.state) {
    case RestApiBuildState.running: 
      return BuildStatus.inprogress;
    case RestApiBuildState.queued:
      return BuildStatus.queued;
    case RestApiBuildState.finished:
      switch(buildData.status) {
      case RestApiBuildStatus.success: 
        return BuildStatus.success;
      case RestApiBuildStatus.failure:
        return BuildStatus.failure;
      }
      return BuildStatus.unknown;
    default:
      return BuildStatus.unknown;
    }  
  }

  private async getSubProjects():Promise<TeamCityItem[]> {
    let nodes:TeamCityItem[] = [];
    const projectData:RestApiProject = this.xmlData;
    if(projectData.projects && (projectData.projects.count > 0)) {
      for (let index = 0; index < projectData.projects.count; index++) {
        const proj:RestApiProject = projectData.projects.project[index];
        const xmlData = await getTCProject(proj.id);
        var node = new TeamCityItem(xmlData, this);
        await node.getChildren();
        nodes.push(node);
      }
    }
    return nodes;
  }
  private async getBuildConfigurations():Promise<TeamCityItem[]> {
    let nodes:TeamCityItem[] = [];
    const projectData:RestApiProject = this.xmlData;
    if(projectData.buildTypes && (projectData.buildTypes.count > 0)) {
      for (let index = 0; index < projectData.buildTypes.count; index++) {
        const buildType:RestApiBuildType = projectData.buildTypes.buildType[index];
        const xmlData = await getTCBuildType(buildType.id);
        var node = new TeamCityItem(xmlData, this);
        await node.getChildren();
        nodes.push(node);
      }
    }    
    return nodes;
  }
  private async getBuilds():Promise<TeamCityItem[]> {
    let nodes:TeamCityItem[] = [];
    const buildTypeData:RestApiBuildType = this.xmlData;
    const builds = await getTCRecentBuilds(buildTypeData.id);
    for(let i=0; i<builds.length; i++) {
      var node = new TeamCityItem(builds[i], this);
      nodes.push(node);
    }    
    return nodes;
  }
  public async refreshBuild() {
    const buildData:RestApiBuild = this.xmlData;
    if(this.itemType === TeamCityItemType.build && buildData.id) {
      this.xmlData = await getTCBuild(buildData.id);
    }
  }
  public async getChildren():Promise<void> {
    const now = new Date().getTime();
    let nodes:TeamCityItem[] = [];
    if(this.itemType === TeamCityItemType.project) {
      const subprojects = await this.getSubProjects();
      const buildConfigs = await this.getBuildConfigurations();
      nodes.push(...subprojects, ...buildConfigs);
    } else if (this.itemType === TeamCityItemType.buildconfig) {
      const builds = await this.getBuilds();
      nodes.push(...builds);
    }
    this.children = nodes;
  }
  private getProjectBuildStatus():BuildStatus {
    var status = BuildStatus.success;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if(child.getAggregateBuildStatus() === BuildStatus.failure) {
        status = BuildStatus.failure;
      }
    }
    return status;
  }
  private getBuildConfigBuildStatus():BuildStatus {
    var status = BuildStatus.unknown;
    if(this.children.length > 0) {
      status = this.children[0].getBuildStatus();
    }
    return status;
  }
  public getAggregateBuildStatus():BuildStatus {
    var status = BuildStatus.unknown;
    switch(this.itemType) {
    case TeamCityItemType.project:
      status = this.getProjectBuildStatus();
      break;
    case TeamCityItemType.buildconfig:
      status = this.getBuildConfigBuildStatus();
      break;
    case TeamCityItemType.build:
      status = this.getBuildStatus();
      break;
    }
    return status;
  }
  
  public async runBuild() {
    if(this.itemType === TeamCityItemType.buildconfig) {
      const buildTypeData:RestApiBuildType = this.xmlData;
      await setTCBuildQueue(buildTypeData, this);
    }
  }
  public getHref():Uri {
    return this.xmlData.href;
  }
  public getId() {
    switch (this.itemType) {
    case TeamCityItemType.project:
    case TeamCityItemType.buildconfig:
      return this.xmlData.id;
    case TeamCityItemType.build:
      var number = this.xmlData.number;
      while(number && number.length < 10) {
        number = `0${number}`;
      }
      return `${this.xmlData.buildTypeId}-${number}`; 
    }
  }
  public getLabel() {
    switch (this.itemType) {
    case TeamCityItemType.project:
    case TeamCityItemType.buildconfig:
      return this.xmlData.name;
    case TeamCityItemType.build:
      var number:number|undefined|string = this.xmlData.number;
      if(number === undefined) {
        number = "??";
      }
      var status:string|undefined = this.xmlData.statusText;
      if(status === undefined) {
        status = "???";
      } 
      return `${number} - ${status}`; 
    }  
  }

}
