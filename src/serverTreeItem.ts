import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from 'vscode';
import { BuildStatus } from './restApiInterface';
import { TeamCityItem, TeamCityItemType } from './teamCityItem';
import { outputChannel, serverTreeView, teamCityModel } from './extension';

export class ServerTreeItem extends vscode.TreeItem {
  constructor(
    public modelItem:TeamCityItem,
  ) {
    const collapsibleState = (modelItem.children.length >0)?  
        TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
    const uri:vscode.Uri=modelItem.getHref();
    super(uri, collapsibleState);
    this.modelItem.treeItem = this;
    this.id = this.modelItem.getId();
    this.label = this.modelItem.getLabel();
    this.setIcon();
    this.setContext();
  }
  
  private setIcon() {
    var iconColour = new vscode.ThemeColor('terminal.ansiWhite');
    const buildStatus = this.modelItem.getAggregateBuildStatus();
    if(buildStatus === BuildStatus.success) {
      iconColour = new vscode.ThemeColor('terminal.ansiBrightGreen');
    } else if(buildStatus === BuildStatus.failure) {
      iconColour = new vscode.ThemeColor('terminal.ansiRed');
    }
    if(this.modelItem.itemType === TeamCityItemType.project) {
      this.iconPath = new vscode.ThemeIcon('extensions', iconColour);
    } else  {
      switch(buildStatus) {
      case BuildStatus.success:
      case BuildStatus.unknown:
      case BuildStatus.failure:
        this.iconPath = new vscode.ThemeIcon('primitive-square', iconColour);
        break;
      case BuildStatus.inprogress:
        this.iconPath = new vscode.ThemeIcon('gear~spin', iconColour);
        this.watchBuildStatus();
        break;
      case BuildStatus.queued:
        this.iconPath = new vscode.ThemeIcon('sync~spin', iconColour);
        this.watchBuildStatus();
        break;
      }  
    }
  }
  private setContext() {
    switch(this.modelItem.itemType) {
    case TeamCityItemType.project: 
      this.contextValue = "Project";
      break;
    case TeamCityItemType.buildconfig:
      this.contextValue = "BuildConfig";
      break;
    case TeamCityItemType.build:
      this.contextValue = "Build";
      break;
    default:
      this.contextValue = "Unknown";
      break;
    }
  }
  private watchBuildStatus() {
    if(this.modelItem.itemType === TeamCityItemType.build) {
      setTimeout(async () => {
      console.log(`${new Date().getSeconds()} - watchBuildStatus: ${this.id}`);
        if(this.modelItem.parent) {
          await this.modelItem.parent.getChildren();
          const treeParent = this.modelItem.parent.treeItem;
          treeParent.setIcon();
          serverTreeView.refresh(treeParent);
        }
      }, 5000);
    }
  }

  public async getChildNodes():Promise<ServerTreeItem[]> {
    let nodes:ServerTreeItem[] = [];
    for (let i = 0; i < this.modelItem.children.length; i++) {
      const data = this.modelItem.children[i];
      nodes.push(new ServerTreeItem(data));
    }
    nodes = nodes.sort((n1,n2) => {
      /* sort by type */
      if(n1.modelItem.itemType !== TeamCityItemType.project && 
          n2.modelItem.itemType === TeamCityItemType.project) {
        return 1;
      } else 
      if(n1.modelItem.itemType === TeamCityItemType.project && 
          n2.modelItem.itemType !== TeamCityItemType.project) {
        return -1;
      } else
      if(n1.modelItem.itemType !== TeamCityItemType.buildconfig && 
          n2.modelItem.itemType === TeamCityItemType.buildconfig) {
        return 1;
      } else
      if(n1.modelItem.itemType === TeamCityItemType.buildconfig && 
          n2.modelItem.itemType !== TeamCityItemType.buildconfig) {
        return -1;
      } else 
      /* sort by name if type is the same */
      if(n1.modelItem.itemType === TeamCityItemType.build && n2.modelItem.itemType === TeamCityItemType.build) {
        if (n1.modelItem.getId() < n2.modelItem.getId()) {
          return 1;
        }
        return -1;
      } else {
        if (n1.modelItem.getId() > n2.modelItem.getId()) {
          return 1;
        }
        return -1;
      }
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
  public async runBuild() {
    if(this.modelItem.itemType === TeamCityItemType.buildconfig) {
      await this.modelItem.runBuild();
      //this.setIconAndContext();
      serverTreeView.refresh(this);
    }
  }
  public async viewBuild() {
    if(this.modelItem.itemType === TeamCityItemType.buildconfig || this.modelItem.itemType === TeamCityItemType.build) {
      const log = await this.modelItem.getBuildLog();
      outputChannel.replace(log);
      outputChannel.show(true);
    }
  }

}