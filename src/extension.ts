import * as vscode from 'vscode';
import { getCatMessage } from './catMessage';
import { getRemainingMilliseconds } from './time';

export function activate(context: vscode.ExtensionContext): void {
  const statusBarItem = vscode.window.createStatusBarItem(
    'cat-waiting.status',
    vscode.StatusBarAlignment.Right,
  );

  statusBarItem.name = 'cat.waiting';

  context.subscriptions.push(statusBarItem);

  function updateStatusBarItem(): void {
    const configuration = vscode.workspace.getConfiguration('catWaiting');

    const configuredCatName = configuration.get<unknown>('catName', 'Milo');

    const catName =
      typeof configuredCatName === 'string' && configuredCatName.trim()
        ? configuredCatName.trim()
        : 'Milo';

    const homeTime = configuration.get<unknown>('homeTime', '18:00');

    try {
      if (typeof homeTime !== 'string') {
        throw new Error('homeTime must be a string.');
      }

      const now = new Date();
      const remainingMilliseconds = getRemainingMilliseconds(homeTime, now);
      const message = getCatMessage(catName, remainingMilliseconds, now);

      statusBarItem.text = message.text;
      statusBarItem.tooltip = message.tooltip;
    } catch {
      statusBarItem.text = '🐈 Check home time';
      statusBarItem.tooltip =
        'Set catWaiting.homeTime to a time in HH:mm format, such as 18:00.';
    }
  }

  const configurationSubscription = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration('catWaiting')) {
        updateStatusBarItem();
      }
    },
  );

  const timer = setInterval(updateStatusBarItem, 30_000);

  context.subscriptions.push(
    configurationSubscription,
    new vscode.Disposable(() => {
      clearInterval(timer);
    }),
  );

  updateStatusBarItem();
  statusBarItem.show();
}
