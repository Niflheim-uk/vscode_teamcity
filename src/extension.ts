import * as vscode from 'vscode';
import { ServerTreeView } from './serverTreeView';

export function activate(context: vscode.ExtensionContext) {
	const disposables = [
		vscode.window.registerTreeDataProvider('teamcity.server', new ServerTreeView)
	];
	context.subscriptions.push(...disposables);
}


export function deactivate() {}
