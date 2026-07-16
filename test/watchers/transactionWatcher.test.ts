import { TransactionWatcher } from '../../src/watchers/transactionWatcher';
import { AccountConfig, Alert, TransactionWatcherConfig } from '../../src/types/index';

global.fetch = jest.fn();

const VALID_PUBLIC_KEY = 'GBZVR7LGDVHGPUDZXWPFHHLGHJRCB3BGFTRPZJPDQG4KPQKZHNM4KPBA';
const OTHER_KEY = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGMRCEA2KCZOBZHR3HEQN22';

const mockAccount: AccountConfig = {
  publicKey: VALID_PUBLIC_KEY,
  label: 'Test Account',
  watchers: {},
};

const mockConfig: TransactionWatcherConfig = {
  enabled: true,
};

const mockTxResponse = (sourceAccount: string) => ({
  _embedded: {
    records: [
      {
        id: 'tx-123',
        hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        source_account: sourceAccount,
        created_at: '2026-07-16T07:00:00Z',
        operation_count: 1,
        fee_charged: '100',
        successful: true,
      },
    ],
  },
});

describe('TransactionWatcher', () => {
  let alerts: Alert[] = [];
  let watcher: TransactionWatcher;

  beforeEach(() => {
    alerts = [];
    jest.clearAllMocks();
    watcher = new TransactionWatcher(
      mockAccount,
      mockConfig,
      'testnet',
      (alert) => alerts.push(alert),
    );
  });

  afterEach(async () => {
    await watcher.stop();
  });

  it('should have correct name', () => {
    expect(watcher.name).toBe('TransactionWatcher');
  });

  it('should detect outgoing transaction', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTxResponse(VALID_PUBLIC_KEY),
    });

    await watcher.start();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('transaction_detected');
    expect(alerts[0].details.direction).toBe('outgoing');
  });

  it('should detect incoming transaction', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTxResponse(OTHER_KEY),
    });

    await watcher.start();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].details.direction).toBe('incoming');
  });

  it('should include transaction hash in alert', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTxResponse(VALID_PUBLIC_KEY),
    });

    await watcher.start();
    expect(alerts[0].details.hash).toBeDefined();
    expect(alerts[0].details.successful).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(watcher.start()).resolves.not.toThrow();
  });

  it('should handle empty transaction list', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ _embedded: { records: [] } }),
    });

    await watcher.start();
    expect(alerts).toHaveLength(0);
  });
});
