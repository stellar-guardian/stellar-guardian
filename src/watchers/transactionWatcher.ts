import { randomUUID } from 'crypto';
import { AccountConfig, Alert, Network, TransactionWatcherConfig, Watcher } from '../types/index';
import { log } from '../lib/logger';

const HORIZON_URLS: Record<Network, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

interface HorizonTransaction {
  id: string;
  hash: string;
  source_account: string;
  created_at: string;
  operation_count: number;
  fee_charged: string;
  successful: boolean;
}

export class TransactionWatcher implements Watcher {
  name = 'TransactionWatcher';
  private lastCursor = 'now';

  constructor(
    private account: AccountConfig,
    private watcherConfig: TransactionWatcherConfig,
    private network: Network,
    private onAlert: (alert: Alert) => void,
  ) {}

  async start(): Promise<void> {
    const label = this.account.label ?? this.account.publicKey.slice(0, 8) + '...';
    log.info(`Starting transaction watcher for ${label}`, this.name);
    await this.fetchTransactions();
  }

  async stop(): Promise<void> {
    log.info(`Stopped transaction watcher`, this.name);
  }

  async fetchTransactions(): Promise<void> {
    const url = `${HORIZON_URLS[this.network]}/accounts/${this.account.publicKey}/transactions?cursor=${this.lastCursor}&order=asc&limit=10`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Horizon API error: ${response.status}`);
      }

      const data = await response.json() as {
        _embedded: { records: HorizonTransaction[] };
      };

      const transactions = data._embedded?.records ?? [];

      for (const tx of transactions) {
        this.handleTransaction(tx);
        this.lastCursor = tx.id;
      }
    } catch (err) {
      log.error(`Transaction fetch error: ${(err as Error).message}`, this.name);
    }
  }

  private handleTransaction(tx: HorizonTransaction): void {
    const isOutgoing = tx.source_account === this.account.publicKey;

    this.onAlert({
      id: randomUUID(),
      type: 'transaction_detected',
      severity: 'info',
      accountPublicKey: this.account.publicKey,
      accountLabel: this.account.label,
      message: `New ${isOutgoing ? 'outgoing' : 'incoming'} transaction detected`,
      details: {
        hash: tx.hash,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        operationCount: tx.operation_count,
        feeCharged: tx.fee_charged,
        successful: tx.successful,
        timestamp: tx.created_at,
      },
      timestamp: new Date(tx.created_at),
      network: this.network,
    });

    log.info(`Transaction detected: ${tx.hash.slice(0, 8)}...`, this.name);
  }
}
