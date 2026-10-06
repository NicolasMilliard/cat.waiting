import * as vscode from 'vscode';
import { getRemainingMilliseconds } from './time';

export function activate(context: vscode.ExtensionContext): void {
  const homeTime = '18:00';
  const remainingMilliseconds = getRemainingMilliseconds(homeTime, new Date());

  const totalMinutes = Math.max(0, Math.ceil(remainingMilliseconds / 60_000));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const statusBarItem = vscode.window.createStatusBarItem(
    'cat-waiting.status',
    vscode.StatusBarAlignment.Right,
  );

  statusBarItem.name = 'cat.waiting';
  statusBarItem.text = `🐱 Home in ${hours}h ${minutes}m`;
  statusBarItem.tooltip = 'Code faster. Your cat is waiting.';

  context.subscriptions.push(statusBarItem);

  statusBarItem.show();
}
