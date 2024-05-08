import * as vscode from 'vscode';

export function getServerUrl() : string|undefined {
  const settings = vscode.workspace.getConfiguration();
  return settings.get('TeamCity.serverURL');
}
export function getAccessToken() : string|undefined {
  const settings = vscode.workspace.getConfiguration();
  return settings.get('TeamCity.accessToken');
}