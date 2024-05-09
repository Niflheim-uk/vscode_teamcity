import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from 'vscode';
import { BuildStatus } from './restApiInterface';
import { RestApiBuildType, RestApiProject } from './interfaces';
import { TeamCityItem } from './teamCityItem';
import { teamCityModel } from './extension';

export class ServerTreeItem extends vscode.TreeItem {
  private readonly projectData: RestApiProject|undefined;
  private readonly buildTypeData: RestApiBuildType|undefined;
  constructor(
    private modelData:TeamCityItem,
  ) {
    const collapsibleState = (modelData.children.length >0)?  
        TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;

    super(modelData.xmlData.name, collapsibleState);
    this.label = modelData.xmlData.name;
    if(this.modelData.parent) {
      this.id = this.modelData.parent.xmlData.name.concat(modelData.xmlData.name);
    } else {
      this.id = modelData.xmlData.name;
    }

    this.setIconAndContext();
  }
  private setIconAndContext() {
    var iconColour = new vscode.ThemeColor('terminal.ansiWhite');
    if(this.modelData.getAggregateBuildStatus() === BuildStatus.success) {
      iconColour = new vscode.ThemeColor('terminal.ansiBrightGreen');
    } else if(this.modelData.getAggregateBuildStatus() === BuildStatus.failure) {
      iconColour = new vscode.ThemeColor('terminal.ansiRed');
    }
    if(this.modelData.isProject) {
      this.iconPath = new vscode.ThemeIcon('extensions', iconColour);
      this.contextValue = "Project";
    } else  {
      this.iconPath = new vscode.ThemeIcon('primitive-square', iconColour);
      this.contextValue = "BuildConfig";
    }
  }

  public async getChildNodes():Promise<ServerTreeItem[]> {
    let nodes:ServerTreeItem[] = [];
    for (let i = 0; i < this.modelData.children.length; i++) {
      const data = this.modelData.children[i];
      nodes.push(new ServerTreeItem(data));
    }
    nodes = nodes.sort((n1,n2) => {
      /* sort by type */
      if(n1.modelData.isProject && !n2.modelData.isProject) {
        return 1;
      }
      if(!n1.modelData.isProject && n2.modelData.isProject) {
        return -1;
      }
      /* sort by name if type is the same */
      if (n1.modelData.xmlData.name > n2.modelData.xmlData.name) {
        return 1;
      }
      if (n1.modelData.xmlData.name < n2.modelData.xmlData.name) {
        return -1;
      }
      /* type is the same, label is the same */
      return 0;
    });
    return nodes;
  }

  public static async getRootTreeItem():Promise<ServerTreeItem[]> {
    const root = await teamCityModel.getRootProject();
    if(root) {
      const rootTreeItem = new ServerTreeItem(root);
      return [rootTreeItem];
    }
    return [];
  }
}