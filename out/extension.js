"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.showInputBox = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
let defaultInputVal;
let home;
let current;
const projectRoot = vscode.workspace.rootPath ? vscode.workspace.rootPath : ".";
const config = vscode.workspace.getConfiguration('vgrep');
function goto(item, preserveFocus = false, preview = true) {
    return __awaiter(this, void 0, void 0, function* () {
        if (item.label === "Current" && item.detail === "") {
            return;
        }
        const path = item.description;
        const [_, line] = item.label.split(":");
        try {
            const doc = yield vscode.workspace.openTextDocument(projectRoot + "/" + path);
            const options = { preview: preview, preserveFocus: preserveFocus };
            yield vscode.window.showTextDocument(doc, options);
        }
        catch (e) {
            return;
        }
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor) {
            const pos = new vscode.Position(Math.min(Number(line) - 1, 0), 0);
            const range = new vscode.Range(pos, pos);
            activeTextEditor.selection = new vscode.Selection(pos, pos);
            activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
    });
}
function showInputBox() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const search = yield vscode.window.showInputBox({
            placeHolder: 'Search:',
            value: defaultInputVal !== "" ? defaultInputVal : undefined
        });
        defaultInputVal = search;
        if (!search || search === "") {
            return;
        }
        const command = config.command + " " + search;
        const options = { cwd: projectRoot, maxBuffer: 1024 * 10000 };
        let stdError = "";
        const res = yield new Promise((resolve, _) => {
            const process = child_process_1.exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    stdError = stderr;
                    return resolve("");
                }
                resolve(stdout);
            });
        });
        if (!res || res === "") {
            if (stdError !== "") {
                vscode.window.showErrorMessage(stdError);
            }
            else {
                vscode.window.showInformationMessage(`No results`);
            }
            return;
        }
        const lines = res.split(/\n/).filter(l => l !== "");
        const choices = lines.map(l => {
            const [path, num, ...line] = l.split(":");
            const parts = path.split("/");
            return {
                label: `${parts[parts.length - 1]}:${num}`,
                detail: line.join(":".trim()),
                description: path
            };
        });
        const line = vscode.window.activeTextEditor ? (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.selection.active.line :
            "";
        let file = vscode.window.activeTextEditor ?
            `${(_b = vscode.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.document.fileName}` :
            "";
        if (file.startsWith(projectRoot)) {
            file = file.slice(projectRoot.length);
        }
        if (file.startsWith('/')) {
            file = file.slice(1);
        }
        choices.unshift({
            label: "Current",
            detail: `${file}:${line}`,
            description: file
        });
        home = choices[0];
        current = home;
        const picked = yield vscode.window.showQuickPick(choices, {
            onDidSelectItem: (item) => __awaiter(this, void 0, void 0, function* () {
                current = item;
                goto(item, true, true);
            })
        });
        if (picked) {
            goto(current, false, false);
        }
        else {
            goto(home, false, false);
        }
    });
}
exports.showInputBox = showInputBox;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('vgrep.vgrep', () => __awaiter(this, void 0, void 0, function* () {
        showInputBox();
    })));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map