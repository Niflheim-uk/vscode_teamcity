import * as vscode from 'vscode';
import { ServerTreeView } from './serverTreeView';
import { TeamCityModel } from './teamCityModel';

export const teamCityModel = new TeamCityModel();

export function activate(context: vscode.ExtensionContext) {
	const disposables = [
		vscode.window.registerTreeDataProvider('teamCity.server', new ServerTreeView),
		vscode.commands.registerCommand('teamCity.configServerURL', configServerURL),
		vscode.commands.registerCommand('teamCity.configAccessToken', configAccessToken),
		vscode.commands.registerCommand('teamCity.configTeamCity', configTeamCity),
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