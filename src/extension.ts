import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Infinite Canvas extension is now active!');

    // Register the custom editor provider
    const provider = new CanvasEditorProvider(context.extensionUri);
    const registration = vscode.window.registerCustomEditorProvider(
        'infinite-canvas.canvasEditor',
        provider
    );

    // Register the new canvas command
    const newCanvasCommand = vscode.commands.registerCommand('infinite-canvas.newCanvas', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('Please open a workspace to create a new canvas');
            return;
        }

        const fileName = await vscode.window.showInputBox({
            prompt: 'Enter canvas file name',
            value: 'untitled.canvas',
            validateInput: (value) => {
                if (!value.endsWith('.canvas')) {
                    return 'File must have .canvas extension';
                }
                return null;
            }
        });

        if (fileName) {
            const filePath = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
            // Create new files in Obsidian-compatible format
            const initialContent = JSON.stringify({
                nodes: [],
                edges: []
            }, null, 2);

            await vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent));
            await vscode.commands.executeCommand('vscode.open', filePath);
        }
    });

    context.subscriptions.push(registration, newCanvasCommand);
}

export function deactivate() {}

class CanvasEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'infinite-canvas.canvasEditor';

    constructor(private readonly extensionUri: vscode.Uri) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup initial webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'webview'),
                vscode.Uri.joinPath(this.extensionUri, 'webview', 'src'),
                vscode.Uri.joinPath(this.extensionUri, 'webview', 'public')
            ]
        };

        // Set the HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Handle updates from the webview
        webviewPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'save':
                        await this.saveDocument(document, message.content);
                        break;
                    case 'ready':
                        // Send initial document content to webview
                        webviewPanel.webview.postMessage({
                            type: 'loadContent',
                            content: document.getText()
                        });
                        break;
                }
            }
        );

        // Handle document changes (when file is changed externally)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                webviewPanel.webview.postMessage({
                    type: 'loadContent',
                    content: document.getText()
                });
            }
        });

        // Clean up when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private async saveDocument(document: vscode.TextDocument, content: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        
        // Replace the entire document content
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );

        await vscode.workspace.applyEdit(edit);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get URIs for webview resources
        const webviewUri = vscode.Uri.joinPath(this.extensionUri, 'webview');
        const mainScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'style.css'));
        
        // Get nonce for security
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; connect-src https:; img-src ${webview.cspSource} https: data:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>Infinite Canvas</title>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
            background: #1e1e1e;
        }
        
        #canvas-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        
        canvas {
            display: block;
            cursor: grab;
            background: #1e1e1e;
        }
        
        canvas:active {
            cursor: grabbing;
        }
    </style>
</head>
<body>
    <div id="canvas-container">
        <canvas id="canvas"></canvas>
    </div>
    
    <script nonce="${nonce}">
        // VS Code API bridge
        const vscode = acquireVsCodeApi();
        
        // Global state for VS Code integration
        window.vsCodeAPI = {
            postMessage: (message) => vscode.postMessage(message),
            setState: (state) => vscode.setState(state),
            getState: () => vscode.getState()
        };
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'loadContent':
                    if (window.loadCanvasContent) {
                        window.loadCanvasContent(message.content);
                    }
                    break;
            }
        });
        
        // Signal that webview is ready
        vscode.postMessage({ type: 'ready' });
    </script>
    
    <script nonce="${nonce}" type="module" src="${mainScriptUri}"></script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}