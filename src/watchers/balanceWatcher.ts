import { randomUUID } from 'crypto';
import { AccountConfig, Alert, Balance, BalanceWatcherConfig, Network, Watcher } from '../types/index';
import { log } from '../lib/logger';

const HORIZON_URLS: Record<Network, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
};

async function fetchBalances(publicKey: string, network: Network): Promise<Balance[]> {
  const url = `${HORIZON_URLS[network]}/accounts/${publicKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Horizon API error: ${response.status}`);
  }

  const data = await response.json() as {
    balances: Array<{
      balance: string;
      asset_type: string;
      asset_code?: string;
      asset_issuer?: string;
    }>;
  };

  return data.balances.map(b => ({
    asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
    amount: b.balance,
    assetType: b.asset_type as Balance['assetType'],
    assetCode: b.asset_code,
    assetIssuer: b.asset_issuer,
  }));
}

export class BalanceWatcher implements Watcher {
  name = 'BalanceWatcher';
  private intervalId: NodeJS.Timeout | null = null;
  private previousBalances: Map<string, string> = new Map();

  constructor(
    private account: AccountConfig,
    private watcherConfig: BalanceWatcherConfig,
    private network: Network,
    private onAlert: (alert: Alert) => void,
  ) {}

  async start(): Promise<void> {
    const interval = (this.watcherConfig.pollingInterval ?? 30) * 1000;
    await this.check();
    this.intervalId = setInterval(() => this.check(), interval);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async check(): Promise<void> {
    try {
      const balances = await fetchBalances(this.account.publicKey, this.network);

      for (const balance of balances) {
        const amount = parseFloat(balance.amount);
        const isFirstCheck = !this.previousBalances.has(balance.asset);
        const prevAmount = parseFloat(this.previousBalances.get(balance.asset) ?? balance.amount);

        if (!isFirstCheck) {
          if (this.watcherConfig.alertOnChange && amount !== prevAmount) {
            const direction = amount > prevAmount ? 'increased' : 'decreased';
            this.onAlert({
              id: randomUUID(),
              type: 'balance_changed',
              severity: 'info',
              accountPublicKey: this.account.publicKey,
              accountLabel: this.account.label,
              message: `Balance ${direction} for ${balance.asset}`,
              details: {
                asset: balance.asset,
                previousAmount: prevAmount.toFixed(7),
                currentAmount: amount.toFixed(7),
                direction,
              },
              timestamp: new Date(),
              network: this.network,
            });
          }

          if (
            balance.asset === 'XLM' &&
            this.watcherConfig.minimumXLM !== undefined &&
            amount < this.watcherConfig.minimumXLM
          ) {
            this.onAlert({
              id: randomUUID(),
              type: 'balance_below_minimum',
              severity: 'critical',
              accountPublicKey: this.account.publicKey,
              accountLabel: this.account.label,
              message: `XLM balance ${amount.toFixed(2)} is below minimum threshold of ${this.watcherConfig.minimumXLM} XLM`,
              details: {
                currentBalance: amount.toFixed(7),
                minimumBalance: this.watcherConfig.minimumXLM,
              },
              timestamp: new Date(),
              network: this.network,
            });
          }
        }

        this.previousBalances.set(balance.asset, balance.amount);
      }
    } catch (err) {
      log.error(`Failed to check balance: ${(err as Error).message}`, this.name);
    }
  }
}
