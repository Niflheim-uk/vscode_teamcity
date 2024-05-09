
import { BuildStatus, getTCRecentBuilds, getTCBuildType, getTCProject, getTCRootProject } from './restApiInterface';
import { RestApiBuildState, RestApiBuildStatus, RestApiBuildType, RestApiProject, RestApiTypeBuild } from './interfaces';

export class TeamCityItem  {
  public readonly isProject:boolean;
  private readonly projectData: RestApiProject|undefined;
  private readonly buildTypeData: RestApiBuildType|undefined;
  public children:TeamCityItem[]=[];
  public recentBuilds:RestApiTypeBuild[] = [];
  constructor(
    public readonly xmlData:any, 
    public readonly parent:TeamCityItem|null, 
    private buildStatus:BuildStatus=BuildStatus.unknown
  ) {
    this.isProject = TeamCityItem.isProjectData(xmlData);
    if(this.isProject) {
      this.projectData = xmlData;
    } else {
      if(TeamCityItem.isBuildTypeData(xmlData)) {
        this.buildTypeData = xmlData;
      }
    }
  }
  private static isProjectData(xmlData:any):boolean {
    if(xmlData.href && xmlData.href.match("/app/rest/projects/id:")) {
      return true;
    } 
    return false;
  }
  private static isBuildTypeData(xmlData:any):boolean {
    if(xmlData.href && xmlData.href.match("/app/rest/buildTypes/id:")) {
      return true;
    } 
    return false;
  }
  public getBuildStatus():BuildStatus {
    if(this.recentBuilds[0]===undefined || this.recentBuilds[0].state === undefined) {
      return BuildStatus.unknown;
    } else {
      switch (this.recentBuilds[0].state) {
      case RestApiBuildState.running: 
        return BuildStatus.inprogress;
      case RestApiBuildState.queued:
        return BuildStatus.queued;
      case RestApiBuildState.finished:
        if(this.recentBuilds[0].status === "SUCCESS") {
          return BuildStatus.success;
        } else {
          return BuildStatus.failure;
        }
      default:
        return BuildStatus.unknown;
      }
    }  
  }

  public async getChildren():Promise<void> {
    let nodes:TeamCityItem[] = [];
    if(this.isProject) {
      if(this.projectData!.projects && (this.projectData!.projects.count > 0)) {
        for (let index = 0; index < this.projectData!.projects.count; index++) {
          const proj:RestApiProject = this.projectData!.projects.project[index];
          const xmlData = await getTCProject(proj.id);
          var node = new TeamCityItem(xmlData, this);
          await node.getChildren();
          nodes.push(node);
        }
      }
      if(this.projectData!.buildTypes && (this.projectData!.buildTypes.count > 0)) {
        for (let index = 0; index < this.projectData!.buildTypes.count; index++) {
          const buildType:RestApiBuildType = this.projectData!.buildTypes.buildType[index];
          const xmlData = await getTCBuildType(buildType.id);
          this.recentBuilds = await getTCRecentBuilds(buildType.id);
          var node = new TeamCityItem(xmlData, this, this.getBuildStatus());
          await node.getChildren();
          nodes.push(node);
        }
      }
    
      nodes = nodes.sort((n1,n2) => {
        /* sort by type */
        if(n1.isProject && !n2.isProject) {
          return 1;
        }
        if(!n1.isProject && n2.isProject) {
          return -1;
        }
        /* sort by name if type is the same */
        if (n1.xmlData.name > n2.xmlData.name) {
          return 1;
        }
        if (n1.xmlData.name < n2.xmlData.name) {
          return -1;
        }
        /* type is the same, label is the same */
        return 0;
      });
    } 
    this.children = nodes;
  }

  public getAggregateBuildStatus():BuildStatus {
    var status = BuildStatus.success;
    if(this.isProject) {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        if(child.isProject) {
          if(child.getAggregateBuildStatus() === BuildStatus.failure) {
            status = BuildStatus.failure;
          }
        } else {
          if(child.buildStatus === BuildStatus.failure) {
            status = BuildStatus.failure;
          }
        }
      }
    } else {
      status = this.buildStatus;      
    }
    return status;
  }
}
