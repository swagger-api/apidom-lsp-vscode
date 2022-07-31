import * as vscode from 'vscode';
import * as assert from 'assert';

import { getDocUri, activate } from './helper';

suite('Should do completion', () => {
  // const docUri = getDocUri('oasbasic.json');
  const docUri = getDocUri('asyncbasic.yaml');

  test('Completes JS/TS in txt file', async () => {
/*
    await testCompletion(docUri, new vscode.Position(0, 1), {
      items: [{ label: 'openapi', kind: vscode.CompletionItemKind.Text }],
    });
*/
    await testCompletion(docUri, new vscode.Position(1, 0), {
      items: [{ label: 'openapi', kind: vscode.CompletionItemKind.Text }],
    });
  });
});

async function testCompletion(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedCompletionList: vscode.CompletionList,
) {
  await activate(docUri);

  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const actualCompletionList = (await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    docUri,
    position,
  )) as vscode.CompletionList;

  assert.ok(actualCompletionList.items.length >= 1);
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i];
    assert.equal(actualItem.label, expectedItem.label);
    assert.equal(actualItem.kind, expectedItem.kind);
  });
}
