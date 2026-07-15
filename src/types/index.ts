export type Network = 'testnet' | 'mainnet';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType =
  | 'balance_below_minimum'
  | 'balance_above_maximum'
  | 'balance_changed'
  | 'payment_received'
  | 'payment_sent'
  | 'transaction_detected'
  | 'trustline_added'
  | 'trustline_removed'
  | 'contract_event';

export interface Balance {
  asset: string;
  amount: string;
  assetType: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  assetCode?: string;
  assetIssuer?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  accountPublicKey: string;
  accountLabel?: string;
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  network: Network;
}

export interface WatcherConfig {
  enabled: boolean;
  pollingInterval?: number;
}

export interface BalanceWatcherConfig extends WatcherConfig {
  minimumXLM?: number;
  maximumXLM?: number;
  alertOnChange?: boolean;
  assets?: string[];
}

export interface PaymentWatcherConfig extends WatcherConfig {
  minimumAmount?: number;
  assets?: string[];
  alertOnSent?: boolean;
  alertOnReceived?: boolean;
}

export interface TransactionWatcherConfig extends WatcherConfig {
  types?: string[];
}

export interface TrustlineWatcherConfig extends WatcherConfig {}

export interface AccountConfig {
  publicKey: string;
  label?: string;
  watchers: {
    balance?: BalanceWatcherConfig;
    payments?: PaymentWatcherConfig;
    transactions?: TransactionWatcherConfig;
    trustlines?: TrustlineWatcherConfig;
  };
}

export interface SlackAlerterConfig {
  enabled: boolean;
  webhookUrl: string;
  channel?: string;
  minimumSeverity?: AlertSeverity;
}

export interface EmailAlerterConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure?: boolean;
  };
  recipients: string[];
  minimumSeverity?: AlertSeverity;
}

export interface TelegramAlerterConfig {
  enabled: boolean;
  botToken: string;
  chatIds: string[];
  minimumSeverity?: AlertSeverity;
}

export interface DiscordAlerterConfig {
  enabled: boolean;
  webhookUrl: string;
  minimumSeverity?: AlertSeverity;
}

export interface WebhookAlerterConfig {
  enabled: boolean;
  url: string;
  secret?: string;
  minimumSeverity?: AlertSeverity;
}

export interface DashboardConfig {
  enabled: boolean;
  port?: number;
}

export interface GuardianConfig {
  network: Network;
  accounts: AccountConfig[];
  alerters: {
    email?: EmailAlerterConfig;
    slack?: SlackAlerterConfig;
    telegram?: TelegramAlerterConfig;
    discord?: DiscordAlerterConfig;
    webhook?: WebhookAlerterConfig;
  };
  dashboard?: DashboardConfig;
}

export interface Alerter {
  name: string;
  send(alert: Alert): Promise<void>;
}

export interface Watcher {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}
