import * as vscode from 'vscode';

var secretSquirel:vscode.SecretStorage|undefined = undefined;
export function setSecretStorage(storage:vscode.SecretStorage) {
  secretSquirel = storage;
}
export function getServerUrl() : string|undefined {
  const settings = vscode.workspace.getConfiguration();
  var url:string|undefined = settings.get('teamcity.server.URL');
  if(url && url.charAt(url.length-1)==='/') {
    url = url.slice(0,url.length-1);
  }
  return url;
}
export async function setAccessToken() {
  if(secretSquirel) {
      const token = await vscode.window.showInputBox({
      title:"Enter your TeamCity personal access token",
      prompt:"A user access token is required to communicate with the server via the REST API. Create a token via your TeamCity server profile page."
    });
    if(token) {
      secretSquirel.store("teamcity.accessToken", token);
    }
  } else {
    vscode.window.showErrorMessage("Undefined secret storage context");
  }
}
export async function getAccessToken() : Promise<string|undefined> {
  if(secretSquirel) {
    const token = await secretSquirel.get("teamcity.accessToken");
    if(token) {
      await vscode.commands.executeCommand('setContext', 'teamcity.accessToken', true);
      return token;
    }
  } else {
    vscode.window.showErrorMessage("Undefined secret storage context");
  }
}


