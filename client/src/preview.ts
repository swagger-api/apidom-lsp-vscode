import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

class PreviewPanel {
  initP: Promise<undefined> | null = null;

  panel: vscode.WebviewPanel | null = null;

  output: vscode.OutputChannel | null = null;

  context: vscode.ExtensionContext | null = null;

  previewURI: string | null = null;

  closedBy: 'human' | 'active-text-editor' | null = null;

  constructor(context: vscode.ExtensionContext, output: vscode.OutputChannel) {
    this.context = context;
    this.output = output;
  }

  isOpen() {
    return this.panel !== null;
  }

  isClosed() {
    return !this.isOpen();
  }

  open() {
    let disposable;

    this.panel = vscode.window.createWebviewPanel(
      'lspvscodePreview-SwaggerUI',
      'SwaggerUI Preview',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.initP = new Promise((resolve) => {
      disposable = this.panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case 'init': {
              resolve(undefined);
              this.initP = null;
            }
          }
        },
        undefined,
        this.context.subscriptions,
      );
      this.context.subscriptions.push(disposable);
    });

    disposable = this.panel.onDidDispose(
      () => {
        this.panel = null;
        this.previewURI = null;
        this.closedBy = 'human';
        this.initP = null;
        this.output.appendLine('Closing SwaggerUI Preview');
      },
      undefined,
      this.context.subscriptions,
    );
    this.context.subscriptions.push(disposable);

    const jsAsset = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'client', 'src', 'webview', 'swagger-ui.js'),
      ),
    );
    const cssAsset = this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'client', 'src', 'webview', 'swagger-ui.css'),
      ),
    );

    const templateString = fs
      .readFileSync(path.join(this.context.extensionPath, 'client', 'src', 'webview', 'index.html'))
      .toString();
    const template = this.makeTemplate(templateString);
    this.panel.webview.html = template({
      cspSource: this.panel.webview.cspSource,
      jsAsset,
      cssAsset,
    });

    this.output.appendLine('Opening the preview');
  }

  makeTemplate(templateString) {
    return (templateData) =>
      new Function(`{${Object.keys(templateData).join(',')}}`, `return \`${templateString}\``)(
        templateData,
      );
  }

  async preview(document: vscode.TextDocument) {
    if (this.isOpen()) {
      await this.initP;
      this.output.appendLine(`Updating preview with text from ${document.uri}.`);
      this.previewURI = document.uri.toString();
      this.panel.webview.postMessage({
        command: 'preview',
        text: JSON.stringify(document.getText()),
      });
    } else {
      this.output.appendLine('Skipping updating the SwaggerUI Preview as it is closed.');
    }
  }

  close() {
    this.panel.dispose();
    this.closedBy = 'active-text-editor';
  }
}

function debounce(func: Function) {
  let timer: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await func.apply(null, args);
    }, 500);
  };
}

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('lspvscode');
  const allowedExtnames = ['.json', '.yaml', '.yml'];
  const previewPanel = new PreviewPanel(context, output);
  const previewDebounced = debounce(previewPanel.preview.bind(previewPanel));
  let disposable;

  disposable = vscode.commands.registerTextEditorCommand(
    'lspvscode.preview',
    async (textEditor: vscode.TextEditor) => {
      const { document } = textEditor;
      const uri = document.uri.toString();
      const extname = path.extname(uri);

      if (extname === '' || allowedExtnames.includes(extname)) {
        if (previewPanel.isClosed()) {
          previewPanel.open();
        }
        await previewPanel.preview(document);
      }
    },
  );
  context.subscriptions.push(disposable);

  // tracking changes in currently tracked document
  disposable = vscode.workspace.onDidChangeTextDocument(async (changeEvent) => {
    const { document } = changeEvent;
    const uri = document.uri.toString();

    if (previewPanel.isOpen() && previewPanel.previewURI === uri) {
      previewDebounced(document);
    }
  });
  context.subscriptions.push(disposable);

  // set current active tab to tracking mode
  disposable = vscode.window.onDidChangeActiveTextEditor(async (changeEvent) => {
    if (typeof changeEvent === 'undefined') return;

    const { document } = changeEvent;
    const uri = document.uri.toString();
    const extname = path.extname(uri);

    if (extname === '' || allowedExtnames.includes(extname)) {
      // track documents without extensions or with all allowed extensions
      if (previewPanel.isClosed() && previewPanel.closedBy === 'active-text-editor') {
        previewPanel.open();
      }
      if (previewPanel.isOpen()) {
        await previewPanel.preview(document);
      }
    } else if (previewPanel.isOpen()) {
      // hide preview for files with unsupported extensions
      previewPanel.close();
    }
  });
  context.subscriptions.push(disposable);
}
