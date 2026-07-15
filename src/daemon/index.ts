import { getConfig } from '../lib/config.js';
import { log } from '../lib/logger.js';
import { BalanceWatcher } from '../watchers/balanceWatcher.js';
import { SlackAlerter } from '../alerters/slackAlerter.js';
import { Alert, Alerter, Watcher } from '../types/index.js';

class GuardianDaemon {
  private watchers: Watcher[] = [];
  private alerters: Alerter[] = [];
  private isRunning = false;

  async start(): Promise<void> {
    log.info('Starting stellar-guardian daemon...', 'Daemon');
    const config = getConfig();

    if (config.alerters.slack?.enabled) {
      this.alerters.push(new SlackAlerter(config.alerters.slack));
      log.success('Slack alerter initialized', 'Daemon');
    }

    if (this.alerters.length === 0) {
      log.warn('No alerters configured — alerts will only be logged', 'Daemon');
    }

    for (const account of config.accounts) {
      const label = account.label ?? account.publicKey.slice(0, 8) + '...';
      if (account.watchers.balance?.enabled) {
        const watcher = new BalanceWatcher(
          account,
          account.watchers.balance,
          config.network,
          (alert) => this.handleAlert(alert),
        );
        this.watchers.push(watcher);
        log.info(`Balance watcher configured for ${label}`, 'Daemon');
      }
    }

    if (this.watchers.length === 0) {
      log.warn('No watchers configured — nothing to monitor', 'Daemon');
    }

    await Promise.all(this.watchers.map(w => w.start()));
    this.isRunning = true;
    log.success(
      `stellar-guardian is running (${this.watchers.length} watcher(s), ${this.alerters.length} alerter(s))`,
      'Daemon',
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    log.info('Stopping stellar-guardian daemon...', 'Daemon');
    await Promise.all(this.watchers.map(w => w.stop()));
    this.watchers = [];
    this.alerters = [];
    this.isRunning = false;
    log.success('stellar-guardian stopped gracefully', 'Daemon');
  }

  private async handleAlert(alert: Alert): Promise<void> {
    log.alert(alert.severity, alert.message, 'Alert');
    for (const alerter of this.alerters) {
      try {
        await alerter.send(alert);
      } catch (err) {
        log.error(`Alerter ${alerter.name} failed: ${(err as Error).message}`, 'Daemon');
      }
    }
  }
}

export async function startDaemon(): Promise<void> {
  const daemon = new GuardianDaemon();

  process.on('SIGTERM', async () => {
    log.info('Received SIGTERM', 'Daemon');
    await daemon.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    log.info('Received SIGINT', 'Daemon');
    await daemon.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    log.error(`Uncaught exception: ${err.message}`, 'Daemon');
    process.exit(1);
  });

  try {
    await daemon.start();
  } catch (err) {
    log.error(`Failed to start daemon: ${(err as Error).message}`, 'Daemon');
    process.exit(1);
  }
}
