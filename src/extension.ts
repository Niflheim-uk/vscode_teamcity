import * as vscode from 'vscode';
import { ServerTreeView } from './serverTreeView';
import { TeamCityModel } from './teamCityModel';
import { setAccessToken, setSecretStorage } from './settings';

export const teamCityModel = new TeamCityModel();
export var serverTreeView:ServerTreeView;
export var outputChannel:vscode.OutputChannel;
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("TeamCity");
	setSecretStorage(context.secrets);
	serverTreeView = new ServerTreeView();
	vscode.commands.executeCommand('setContext', 'teamcity.accessToken', false);
  const disposables = [
		outputChannel,
		//teamCityModel,
		//serverTreeView,
		vscode.window.registerTreeDataProvider('teamCity.server', serverTreeView),
		vscode.commands.registerCommand('teamCity.configServerURL', configServerURL),
		vscode.commands.registerCommand('teamCity.configAccessToken', setAccessToken),
		vscode.commands.registerCommand('teamCity.configTeamCity', configTeamCity),
		vscode.commands.registerCommand('teamCity.runBuild', async (node)=>{await node.runBuild();}),
		vscode.commands.registerCommand('teamCity.viewBuild', async (node)=>{await node.viewBuild();}),
		vscode.commands.registerCommand('teamCity.refresh', () => serverTreeView.refresh()),
	];
	context.subscriptions.push(...disposables);
}
export function deactivate() {}

async function configServerURL() {
	await vscode.commands.executeCommand("workbench.action.openSettings", 'teamCity.server.URL');
}
async function configTeamCity() {
	await vscode.commands.executeCommand("workbench.action.openSettings", 'teamCity.');
}
