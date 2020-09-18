# vgrep

Runs a grep search in the workspace root and provides the results in a quickpick dropdown.

Inspired by this [git grep extension](https://github.com/kawamurakazushi/vscode-grep).

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `vgrep.maxBuffer`: increase if exec command is overflowing its buffer
* `vgrep.command`: set to alternate commands you would like to run instead of `grep -nr`
