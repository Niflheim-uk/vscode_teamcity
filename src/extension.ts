import * as vscode from 'vscode';
import { ServerTreeView } from './serverTreeView';
import { TeamCityModel } from './teamCityModel';

export const teamCityModel = new TeamCityModel();
export var serverTreeView:ServerTreeView;
export function activate(context: vscode.ExtensionContext) {
	serverTreeView = new ServerTreeView();
	const disposables = [
		vscode.window.registerTreeDataProvider('teamCity.server', serverTreeView),
		vscode.commands.registerCommand('teamCity.configServerURL', configServerURL),
		vscode.commands.registerCommand('teamCity.configAccessToken', configAccessToken),
		vscode.commands.registerCommand('teamCity.configTeamCity', configTeamCity),
		vscode.commands.registerCommand('teamCity.runBuild', async (node)=>{await node.runBuild();}),
		vscode.commands.registerCommand('teamCity.viewBuild', (node)=>{node.viewBuild();}),
];
	context.subscriptions.push(...disposables);
	
}
export function deactivate() {}

async function configServerURL() {
	await vscode.commands.executeCommand("workbench.action.openSettings", 'teamCity.server.URL');
}
async function configAccessToken() {
	await vscode.commands.executeCommand("workbench.action.openSettings", 'teamCity.credentials.accessToken');
}
async function configTeamCity() {
	await vscode.commands.executeCommand("workbench.action.openSettings", 'teamCity.');
}
