import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const statusBarItem = vscode.window.createStatusBarItem(
    'cat-waiting.status',
    vscode.StatusBarAlignment.Right,
  );

  statusBarItem.name = 'cat.waiting';
  statusBarItem.text = '🐱 Your cat is waiting';
  statusBarItem.tooltip = 'Code faster. Your cat is waiting.';

  context.subscriptions.push(statusBarItem);

  statusBarItem.show();
}
