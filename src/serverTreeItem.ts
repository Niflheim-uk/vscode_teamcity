import * as vscode from 'vscode';
import * as settings from './settings';
import { TreeItemCollapsibleState } from 'vscode';
import { BuildStatus, getTCBuildStatus, getTCBuildType, getTCProject, getTCRootProject } from './restApiInterface';
import { RestApiBuildType, RestApiProject } from './interfaces';

export class ServerTreeItem extends vscode.TreeItem {
  public readonly isProject:boolean;
  private readonly projectData: RestApiProject|undefined;
  private readonly buildTypeData: RestApiBuildType|undefined;
  
  constructor(public readonly xmlData:any, parentId?:string, buildStatus?:BuildStatus) {
    var hasChildren = false;
    if((xmlData.buildTypes && xmlData.buildTypes.count > 0) ||
      (xmlData.projects && xmlData.projects.count > 0)) {
        hasChildren = true;
    }
    const collapsibleState = hasChildren? 
        TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
    super(xmlData.name, collapsibleState);
    if(parentId) {
      this.id = parentId.concat(xmlData.name);
    } else {
      this.id = xmlData.name;
    }
    this.label = xmlData.name;

    this.isProject = ServerTreeItem.isProjectData(xmlData);
    if(this.isProject) {
      this.projectData = xmlData;
    } else {
      this.buildTypeData = xmlData;
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


  public async getChildNodes():Promise<ServerTreeItem[]> {
    let nodes:ServerTreeItem[] = [];
    if(this.isProject) {
      if(this.projectData!.projects && (this.projectData!.projects.count > 0)) {
        for (let index = 0; index < this.projectData!.projects.count; index++) {
          const proj:RestApiProject = this.projectData!.projects.project[index];
          const xmlData = await getTCProject(proj.id);
          nodes.push(new ServerTreeItem(xmlData, this.id));
        }
      }
      if(this.projectData!.buildTypes && (this.projectData!.buildTypes.count > 0)) {
        for (let index = 0; index < this.projectData!.buildTypes.count; index++) {
          const buildType:RestApiBuildType = this.projectData!.buildTypes.buildType[index];
          const xmlData = await getTCBuildType(buildType.id);
          const buildStatus = await getTCBuildStatus(buildType.id);
          nodes.push(new ServerTreeItem(xmlData, this.id, buildStatus));
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
    return nodes;
  }

  public static async getRootProject():Promise<ServerTreeItem[]> {
    const xml = await getTCRootProject();
    if(xml && ServerTreeItem.isProjectData(xml)) {
      const rootNode = new ServerTreeItem(xml);
      return [rootNode];
    }
    return [];
  }
}