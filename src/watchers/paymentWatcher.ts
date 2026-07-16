import { randomUUID } from 'crypto';
import { AccountConfig, Alert, Network, PaymentWatcherConfig, Watcher } from '../types/index';
import { log } from '../lib/logger';

const HORIZON_URLS: Record<Network, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

interface HorizonPayment {
  id: string;
  type: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  source_account?: string;
  created_at: string;
}

export class PaymentWatcher implements Watcher {
  name = 'PaymentWatcher';
  private eventSource: any = null;
  private lastCursor = 'now';

  constructor(
    private account: AccountConfig,
    private watcherConfig: PaymentWatcherConfig,
    private network: Network,
    private onAlert: (alert: Alert) => void,
  ) {}

  async start(): Promise<void> {
    const label = this.account.label ?? this.account.publicKey.slice(0, 8) + '...';
    log.info(`Starting payment watcher for ${label}`, this.name);
    this.subscribe();
  }

  async stop(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    log.info(`Stopped payment watcher`, this.name);
  }

  private subscribe(): void {
    const url = `${HORIZON_URLS[this.network]}/accounts/${this.account.publicKey}/payments?cursor=${this.lastCursor}&order=asc`;

    log.info(`Subscribing to payment stream`, this.name);

    const fetchPayments = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Horizon API error: ${response.status}`);
        }
        const data = await response.json() as { _embedded: { records: HorizonPayment[] } };
        const payments = data._embedded?.records ?? [];

        for (const payment of payments) {
          this.handlePayment(payment);
          this.lastCursor = payment.id;
        }
      } catch (err) {
        log.error(`Payment stream error: ${(err as Error).message}`, this.name);
      }
    };

    fetchPayments();
  }

  private handlePayment(payment: HorizonPayment): void {
    const isIncoming = payment.to === this.account.publicKey;
    const isOutgoing = payment.from === this.account.publicKey;

    if (!isIncoming && !isOutgoing) return;

    const amount = parseFloat(payment.amount ?? '0');
    const minAmount = this.watcherConfig.minimumAmount ?? 0;

    if (amount < minAmount) return;

    if (isIncoming && this.watcherConfig.alertOnReceived === false) return;
    if (isOutgoing && this.watcherConfig.alertOnSent === false) return;

    const assetCode = payment.asset_type === 'native' ? 'XLM' : (payment.asset_code ?? 'UNKNOWN');
    const direction = isIncoming ? 'received' : 'sent';
    const counterparty = isIncoming ? payment.from : payment.to;

    this.onAlert({
      id: randomUUID(),
      type: isIncoming ? 'payment_received' : 'payment_sent',
      severity: 'info',
      accountPublicKey: this.account.publicKey,
      accountLabel: this.account.label,
      message: `Payment ${direction}: ${amount.toFixed(7)} ${assetCode}`,
      details: {
        direction,
        amount: amount.toFixed(7),
        asset: assetCode,
        counterparty: counterparty ?? 'unknown',
        transactionId: payment.id,
        timestamp: payment.created_at,
      },
      timestamp: new Date(payment.created_at),
      network: this.network,
    });

    log.info(`Payment ${direction}: ${amount} ${assetCode}`, this.name);
  }
}
