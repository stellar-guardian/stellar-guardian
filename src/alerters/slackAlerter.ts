import { Alert, AlertSeverity, Alerter, SlackAlerterConfig } from '../types/index';
import { log } from '../lib/logger';

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#36a64f',
  warning: '#ffcc00',
  critical: '#ff0000',
};

export class SlackAlerter implements Alerter {
  name = 'SlackAlerter';

  constructor(private config: SlackAlerterConfig) {}

  async send(alert: Alert): Promise<void> {
    const minimumSeverity = this.config.minimumSeverity ?? 'info';
    const severityOrder: AlertSeverity[] = ['info', 'warning', 'critical'];

    if (severityOrder.indexOf(alert.severity) < severityOrder.indexOf(minimumSeverity)) {
      return;
    }

    const accountDisplay = alert.accountLabel ??
      `${alert.accountPublicKey.slice(0, 8)}...${alert.accountPublicKey.slice(-4)}`;

    const payload: Record<string, unknown> = {
      attachments: [
        {
          color: SEVERITY_COLORS[alert.severity],
          title: alert.message,
          fields: [
            { title: 'Account', value: accountDisplay, short: true },
            { title: 'Network', value: alert.network.toUpperCase(), short: true },
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
          ],
          footer: 'stellar-guardian',
        },
      ],
    };

    if (this.config.channel) {
      payload.channel = this.config.channel;
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}`);
    }

    log.success(`Alert sent to Slack: ${alert.message}`, this.name);
  }
}
