import * as vscode from 'vscode';
import { ServerTreeItem } from './serverTreeItem';

export class ServerTreeView implements vscode.TreeDataProvider<ServerTreeItem> {
  constructor() {
  }

  getTreeItem(element:ServerTreeItem): vscode.TreeItem {
    return element;
  }
  getChildren(element?:ServerTreeItem): Thenable<ServerTreeItem[]> {
    if(element) {
      return Promise.resolve(element.getChildNodes());
    } else {
      return Promise.resolve(ServerTreeItem.getRootTreeItem());
    }
  }
  
}