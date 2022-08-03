import * as path from 'path';
import { workspace, ExtensionContext, languages } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import { SemanticTokensFeature } from 'vscode-languageclient/lib/common/semanticTokens';

import * as preview from './preview';

let client: LanguageClient;

const oasDetectionRegExpJson = /"openapi"\s*:\s*"(?<version_json>3\.\d\.\d+)"/;
const oasDetectionRegExpYaml =
  /(?<YAML>^(["']?)openapi\2\s*:\s*(["']?)(?<version_yaml>3\.\d\.\d+)\3)|(?<JSON>"openapi"\s*:\s*"(?<version_json>3\.\d\.\d+)")/m;

const asyncDetectionRegExpJson = /"asyncapi"\s*:\s*"(?<version_json>2\.\d+\.\d+)"/;
const asyncApiDetectionRegExpYaml =
  /(?<YAML>^(["']?)asyncapi\2\s*:\s*(["']?)(?<version_yaml>2\.\d+\.\d+)\3)|(?<JSON>"asyncapi"\s*:\s*"(?<version_json>2\.\d+\.\d+)")/m;

const adsDetectionRegExpJson = /"version"\s*:\s*"(?<version_json>2021-05-07)"/;
const adsDetectionRegExpYaml =
  /(?<YAML>^(["']?)version\2\s*:\s*(["']?)(?<version_yaml>2021-05-07)\3)|(?<JSON>"version"\s*:\s*"(?<version_json>2021-05-07)")/m;

export function isApiDOM(text: string): boolean {
  return oasDetectionRegExpJson.test(text) ||
    oasDetectionRegExpYaml.test(text) ||
    asyncDetectionRegExpJson.test(text) ||
    asyncApiDetectionRegExpYaml.test(text) ||
    adsDetectionRegExpJson.test(text) ||
    adsDetectionRegExpYaml.test(text);
}

export function activate(context: ExtensionContext): void {
  workspace.textDocuments.forEach(doc => {
    if (isApiDOM(doc.getText())) {
      languages.setTextDocumentLanguage(doc, "apidom")
    }
  })

  context.subscriptions.push(
    workspace.onDidOpenTextDocument(doc => {
      if (isApiDOM(doc.getText())) {
        languages.setTextDocumentLanguage(doc, "apidom")
      }
    }),
  )

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for apidom docs
    documentSelector: ['apidom'],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient('apidom', 'ApiDOM Language Server', serverOptions, clientOptions);
  client.registerProposedFeatures();
  client.registerFeature(new SemanticTokensFeature(client));
  // Start the client. This will also launch the server
  client.start();

  preview.activate(context);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
