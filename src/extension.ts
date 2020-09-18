import * as vscode from 'vscode';
import { exec } from "child_process";

let defaultInputVal : string | undefined;
let home : vscode.QuickPickItem;
let current : vscode.QuickPickItem;
const projectRoot = vscode.workspace.rootPath ? vscode.workspace.rootPath : ".";
const config = vscode.workspace.getConfiguration('vgrep');

async function goto(item: vscode.QuickPickItem, preserveFocus = false, preview = true) {
	if (item.label === "Current" && item.detail === "") {
		return
	}

	const path = item.description;
	const [_, line] = item.label.split(":");

	try {
		const doc = await vscode.workspace.openTextDocument(projectRoot + "/" + path);
		const options: vscode.TextDocumentShowOptions = { preview: preview, preserveFocus: preserveFocus };
		await vscode.window.showTextDocument(doc, options);
	} catch (e) {
		return
	}

	const activeTextEditor = vscode.window.activeTextEditor;

	if (activeTextEditor) {
		const pos = new vscode.Position(Math.min(Number(line) - 1, 0), 0);
		const range = new vscode.Range(pos, pos);
		activeTextEditor.selection = new vscode.Selection(pos, pos);
		activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
	}
}

export async function showInputBox() {
	const search = await vscode.window.showInputBox({
		placeHolder: 'Search:',
		value: defaultInputVal !== "" ? defaultInputVal : undefined
	});
	defaultInputVal = search
	if (!search || search === "")
	{
		return
	}

	const command = config.command + " " + search;
	const options = { cwd: projectRoot, maxBuffer: 1024*10000 }
	let stdError = ""
	const res = await new Promise<string>((resolve, _) => {
		const process = exec(command, options, (error: any, stdout: any, stderr: any) => {
			if (error) {
				stdError = stderr
				return resolve("")
			}
			resolve(stdout)
		})
	})
	if (!res || res === "")
	{
		if (stdError !== "") {
			vscode.window.showErrorMessage(stdError);
		} else {
			vscode.window.showInformationMessage(`No results`);
		}
		return
	}
	const lines = res.split(/\n/).filter(l => l !== "");
	const choices = lines.map(l => {
		const [path, num, ...line] = l.split(":");
		const parts = path.split("/")
		return {
			label: `${parts[parts.length - 1]}:${num}`,
			detail: line.join(":".trim()),
			description: path
		}
	})
	const line = vscode.window.activeTextEditor ? 
						vscode.window.activeTextEditor?.selection.active.line :
						"";
	let file = vscode.window.activeTextEditor ?
					 `${vscode.window.activeTextEditor?.document.fileName}` :
					 ""
	if (file.startsWith(projectRoot)) {
		file = file.slice(projectRoot.length)
	}
	if (file.startsWith('/')) {
		file = file.slice(1)
	}
	choices.unshift({
		label: "Current",
		detail: `${file}:${line}`,
		description: file
	})
	home = choices[0];
	current = home
	const picked = await vscode.window.showQuickPick(choices, {
		onDidSelectItem: async (item: vscode.QuickPickItem) => {
			current = item
			goto(item, true, true);
		}
	});
	if (picked) {
		goto(current, false, false)
	} else {
		goto(home, false, false)
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('vgrep.vgrep', async () => {
		showInputBox()
	}));
}

export function deactivate() {}
