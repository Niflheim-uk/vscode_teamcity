import * as vscode from 'vscode';
import { ServerTreeItem } from './serverTreeItem';

export class ServerTreeView implements vscode.TreeDataProvider<ServerTreeItem> {
  constructor() {
  }
  private _onDidChangeTreeData: vscode.EventEmitter<ServerTreeItem | undefined | null | void> = new vscode.EventEmitter<ServerTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ServerTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  
  refresh(item?:ServerTreeItem): void {
    this._onDidChangeTreeData.fire(item);
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