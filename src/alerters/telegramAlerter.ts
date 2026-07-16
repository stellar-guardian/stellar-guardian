import { Alert, AlertSeverity, Alerter, TelegramAlerterConfig } from '../types/index';
import { log } from '../lib/logger';

const SEVERITY_EMOJIS: Record<AlertSeverity, string> = {
  info: '🔵',
  warning: '🟡',
  critical: '🔴',
};

export class TelegramAlerter implements Alerter {
  name = 'TelegramAlerter';

  constructor(private config: TelegramAlerterConfig) {}

  async send(alert: Alert): Promise<void> {
    const minimumSeverity = this.config.minimumSeverity ?? 'info';
    const severityOrder: AlertSeverity[] = ['info', 'warning', 'critical'];

    if (severityOrder.indexOf(alert.severity) < severityOrder.indexOf(minimumSeverity)) {
      return;
    }

    const emoji = SEVERITY_EMOJIS[alert.severity];
    const accountDisplay = alert.accountLabel ??
      `${alert.accountPublicKey.slice(0, 8)}...${alert.accountPublicKey.slice(-4)}`;

    const detailLines = Object.entries(alert.details)
      .map(([key, value]) => `• *${key}*: ${value}`)
      .join('\n');

    const message = [
      `${emoji} *stellar\\-guardian Alert*`,
      ``,
      `*${this.escapeMarkdown(alert.message)}*`,
      ``,
      `*Account:* ${this.escapeMarkdown(accountDisplay)}`,
      `*Network:* ${alert.network.toUpperCase()}`,
      `*Severity:* ${alert.severity.toUpperCase()}`,
      `*Time:* ${alert.timestamp.toISOString()}`,
      ``,
      detailLines,
    ].join('\n');

    for (const chatId of this.config.chatIds) {
      await this.sendMessage(chatId, message);
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    log.success(`Alert sent to Telegram chat ${chatId}`, this.name);
  }
}
