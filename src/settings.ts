import * as vscode from 'vscode';

export function getServerUrl() : string|undefined {
  const settings = vscode.workspace.getConfiguration();
  var url:string|undefined = settings.get('teamCity.server.URL');
  if(url && url.charAt(url.length-1)==='/') {
    url = url.slice(0,url.length-1);
  }
  return url;
}
export function getAccessToken() : string|undefined {
  const settings = vscode.workspace.getConfiguration();
  return settings.get('teamCity.credentials.accessToken');
}