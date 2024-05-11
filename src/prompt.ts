import * as vscode from 'vscode';
import * as path from 'path';
import { PromptParameter, RestApiProperty } from './interfaces';
import { setTCBuildQueueWithParameters } from './restApiInterface';
import { TeamCityItem } from './teamCityItem';
import { serverTreeView } from './extension';

export class Prompt {
  private parameters:PromptParameter[]|undefined;
  private extensionPath:string;
  private panel:vscode.WebviewPanel|undefined;
  constructor(private buildItem:TeamCityItem) {
    const extension = vscode.extensions.getExtension("Niflheim.teamcity");
    if(extension) {
      this.extensionPath = extension.extensionPath;
    } else {
      vscode.window.showErrorMessage("Failed to find extension path");
      this.extensionPath = "";
    }
  }

  createPrompt(buildId:string, parameters:PromptParameter[]):void {
    this.parameters = parameters;
    const extensionUri = vscode.Uri.file(this.extensionPath);
    this.panel = vscode.window.createWebviewPanel(
      'teamcityPrompt',
      'Build Prompt',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots:[vscode.Uri.joinPath(extensionUri, 'resources')]
      }
    );
    // Assign event handlers
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if(message.command === "buildWithParameters") {
        await setTCBuildQueueWithParameters(buildId, message.propertyList, this.buildItem);
        serverTreeView.refresh(this.buildItem.treeItem);
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } else if(message.command === 'cancelBuild') {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    });
    
    this.panel.webview.html = this.getWebviewContent(this.panel.webview);    
  }
  private getWebviewContent(webview:vscode.Webview):string {
    const stylePath = path.join(this.extensionPath, 'resources', 'prompt.css');
    const scriptPath = path.join(this.extensionPath, 'resources', 'promptCallbacks.js');
    const styleUri = webview.asWebviewUri(vscode.Uri.file(stylePath)).toString();
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath)).toString();
    const innerHtml:string = this.getBodyHtml();
    const outerHtml:string = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet"/>
        <script src="${scriptUri}"></script>
        <title>Build Prompt</title>
      </head>
      <body>${innerHtml}</body>
    </html>`;
    return outerHtml;
  }
  private getBodyHtml():string {
    const epilogue:string = `
    <div>
      <button onclick='onRun()'>Run</button>
      <button onclick='onCancel()'>Cancel</button>
    </div>
    `;
    let html = "<br/>";
    if(this.parameters && this.parameters.length > 0) {
      for (let index = 0; index < this.parameters.length; index++) {
        const param = this.parameters[index];
        html = html.concat(this.getPromptHtml(param));
        html = html.concat("<br/>");
      }
      html = html.concat(epilogue);
    }
    return html;
  }
  private getPromptHtml(parameter:PromptParameter):string {
    var prompt:string="";
    var descriptionText:string="";
    if(parameter.description) {
      descriptionText = parameter.description.replace(/\|n/g,"\n");
    }
    switch(parameter.type) {
      case "text":
        prompt = this.getTextPromptHtml(parameter);
        break;
      case "password":
        prompt = this.getPasswordPromptHtml(parameter);
        break;
      case "select":
        prompt = this.getSelectPromptHtml(parameter);
        break;
    }
    return `
    <div id='prompt-${parameter.id}' class='promptContainer'>
      <div class='promptInputContainer'>
        <div class='promptLabel'>${parameter.label}</div>
        ${prompt}
      </div>
      <div class='promptDescription'>${descriptionText}</div>
    </div>`;
  }
  private getTextPromptHtml(parameter:PromptParameter):string {
    const dataFields = this.getElementData(parameter.property);
    return `<textarea id='${parameter.id}' ${dataFields} class='promptInput'></textarea>`;
  }
  private getPasswordPromptHtml(parameter:PromptParameter):string {
    const dataFields = this.getElementData(parameter.property);
    return `<input type='password' id='${parameter.id}' ${dataFields} class='promptInput'></input>`;
  }
  private getSelectPromptHtml(parameter:PromptParameter):string {
    var options:string = '<option value="">--Please choose an option--</option>';
    const dataFields = this.getElementData(parameter.property);
    if(parameter.selectData) {
      for (let index = 0; index < parameter.selectData.length; index++) {
        const option = parameter.selectData[index];
        options = options.concat(`<option value="${option}">${option}</option>`);
      }
    }
    return `<select id='${parameter.id}' ${dataFields} class='promptInput'>${options}</select>`;
  }
  private getElementData(property:RestApiProperty) {
    const nameData = `data-propertyName='${property.name}'`;
    return nameData;
  }
}

