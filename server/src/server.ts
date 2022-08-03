#!/usr/bin/env node
import './wasm-loader';
import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  CompletionItem,
  CompletionParams,
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  SymbolInformation,
  TextDocuments,
  TextDocumentSyncKind, WorkspaceFolder,
} from 'vscode-languageserver';
import {
  createConnection,
  SemanticTokensRegistrationOptions,
  SemanticTokensRegistrationType,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Hover, SemanticTokens, SemanticTokensParams } from 'vscode-languageserver-protocol';
import { Location } from 'vscode-languageserver-types';
import {
  CompletionContext,
  getLanguageService,
  LanguageService,
  LanguageServiceContext,
  ValidationContext,
  LogLevel,
} from '@swagger-api/apidom-ls';

import { ApidomSettings } from './server-types';
import { configuration } from './configuration';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection: Connection;
if (process.argv.indexOf('--stdio') === -1) {
  connection = createConnection(ProposedFeatures.all);
} else {
  connection = createConnection();
}
// console.log = connection.console.log.bind(connection.console);
// console.error = connection.console.error.bind(connection.console);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = true;
let hasDiagnosticRelatedInformationCapability = false;
let languageService: LanguageService;

let folders: WorkspaceFolder[] | null;

const defaultSettings: ApidomSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ApidomSettings = defaultSettings;

function getGlobalSettings(): Thenable<ApidomSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(defaultSettings);
  }
  const settings = connection.workspace.getConfiguration({
    section: 'apidom',
  });
  if (settings) {
    return settings;
  }
  return Promise.resolve(defaultSettings);
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const validationContext: ValidationContext = {
    comments: DiagnosticSeverity.Error,
    // relatedInformation: hasDiagnosticRelatedInformationCapability,
    maxNumberOfProblems: globalSettings.maxNumberOfProblems,
  };
  const diagnostics = await languageService.doValidation(textDocument, validationContext);
  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: <Diagnostic[]>diagnostics });
}

async function reloadFromConfiguration() {
  if (languageService) {
    // const workspaceFolders = await connection.workspace.getWorkspaceFolders();
    //console.log('workspaceFolders ', JSON.stringify(workspaceFolders));
    const context: LanguageServiceContext = {
      metadata: configuration(globalSettings),
      logLevel: LogLevel.ERROR,
      defaultContentLanguage: {
        namespace: 'openapi',
        version: '3.1.0',
      },
      workspaceFolders: folders || undefined,
    };
    languageService.terminate();
    languageService = getLanguageService(context);
    documents.all().forEach(validateTextDocument);
  }
}

connection.onDidChangeConfiguration(async (change) => {
  if (hasConfigurationCapability) {
    globalSettings = await getGlobalSettings();
  } else {
    globalSettings = <ApidomSettings>(change.settings.apidom || defaultSettings);
  }
  reloadFromConfiguration();
  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

/*connection.workspace.onDidChangeWorkspaceFolders(async (e: WorkspaceFoldersChangeEvent) => {
  console.log('onDidChangeWorkspaceFolders', JSON.stringify(e));
});*/
connection.onInitialize(async (params: InitializeParams) => {
  const { capabilities, workspaceFolders } = params;
  folders = workspaceFolders;
  // console.log('params ', JSON.stringify(params));
  globalSettings = await getGlobalSettings();
  const context: LanguageServiceContext = {
    metadata: configuration(globalSettings),
    logLevel: LogLevel.ERROR,
    defaultContentLanguage: {
      namespace: 'openapi',
      version: '3.1.0',
    },
    workspaceFolders: workspaceFolders || undefined,
  };
  languageService = getLanguageService(context);
  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  // @ts-ignore
  const result: InitializeResult = {
    capabilities: {
      // textDocumentSync: TextDocumentSyncKind.Incremental,
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: false, // true TODO
      },
      hoverProvider: true,
      documentHighlightProvider: false,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      semanticTokensProvider: {
        legend: languageService.getSemanticTokensLegend(),
        range: false,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  result.capabilities.codeActionProvider = {
    codeActionKinds: [CodeActionKind.QuickFix],
  };

  // const notification = new NotificationType<string>('testNotification');
  // connection.sendNotification(notification, 'aaa');
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  // @ts-ignore
  const registrationOptions: SemanticTokensRegistrationOptions = {
    documentSelector: ['apidom'],
    legend: languageService.getSemanticTokensLegend(),
    range: false,
    full: {
      delta: false,
    },
  };
  connection.client.register(SemanticTokensRegistrationType.type, registrationOptions);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  async (completionParams: CompletionParams): Promise<CompletionItem[]> => {
    const completionContext: CompletionContext = {
      maxNumberOfItems: 100,
    };

    const doc = documents.get(completionParams.textDocument.uri)!;
    const list = await languageService.doCompletion(doc, completionParams, completionContext);

    // The pass parameter contains the position of the text document in
    // which code complete got requested.
    return list ? list.items : [];
  },
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    /*    if (item.data === 1) {
      // eslint-disable-next-line no-param-reassign
      item.detail = 'TypeScript details';
      // eslint-disable-next-line no-param-reassign
      item.documentation = 'TypeScript documentation';
    } else if (item.data === 2) {
      // eslint-disable-next-line no-param-reassign
      item.detail = 'JavaScript details';
      // eslint-disable-next-line no-param-reassign
      item.documentation = 'JavaScript documentation';
    } */
    return item;
  },
);

connection.languages.semanticTokens.on(
  async (params: SemanticTokensParams): Promise<SemanticTokens> => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) {
      return { data: [] };
    }
    return languageService.computeSemanticTokens(doc);
  },
);

// TODO Complete semantic tokens
/* connection.languages.semanticTokens.on((params) => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return { data: [] };
  }
  builder = new ProposedFeatures.SemanticTokensBuilder();
  return await languageService.computeSemanticTokens(document.getText());
  return builder.build();
});

connection.languages.semanticTokens.onEdits((params) => {
  const document = documents.get(params.textDocument.uri);
  if (document === undefined) {
    return { edits: [] };
  }
  if (builder === undefined) {
    builder = new ProposedFeatures.SemanticTokensBuilder();
  }
  builder.previousResult(params.previousResultId);
  buildTokens(builder, document);
  return builder.buildEdits();
});

connection.languages.semanticTokens.onRange((params) => {
  return { data: [] };
}); */

connection.onHover(
  async ({ textDocument, position }): Promise<Hover | undefined> => {
    const doc = documents.get(textDocument.uri);
    if (doc === undefined) {
      return undefined;
    }
    return languageService.doHover(doc, position);
  },
);

connection.onDefinition(
  async (params): Promise<Location | null> => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) {
      return null;
    }
    return languageService.doProvideDefinition(doc, params);
  },
);

connection.onReferences(
  async (params): Promise<Location[] | null> => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) {
      return null;
    }
    return languageService.doProvideReferences(doc, params);
  },
);

connection.onDocumentSymbol(
  async (params): Promise<SymbolInformation[]> => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) {
      return [];
    }
    // eslint-disable-next-line no-return-await
    return languageService.doFindDocumentSymbols(doc);
  },
);

async function provideCodeActions(parms: CodeActionParams): Promise<CodeAction[]> {
  if (!parms.context.diagnostics.length) {
    return [];
  }
  const document = documents.get(parms.textDocument.uri);
  if (!document) {
    return [];
  }
  return languageService.doCodeActions(document, parms);
}

connection.onCodeAction(provideCodeActions);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

connection.listen();
