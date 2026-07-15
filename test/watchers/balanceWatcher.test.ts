import { BalanceWatcher } from '../../src/watchers/balanceWatcher';
import { AccountConfig, Alert, BalanceWatcherConfig } from '../../src/types/index';

global.fetch = jest.fn();

const mockAccount: AccountConfig = {
  publicKey: 'GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890AB',
  label: 'Test Account',
  watchers: {},
};

const mockConfig: BalanceWatcherConfig = {
  enabled: true,
  pollingInterval: 30,
  minimumXLM: 100,
  alertOnChange: true,
};

describe('BalanceWatcher', () => {
  let alerts: Alert[] = [];
  let watcher: BalanceWatcher;

  beforeEach(() => {
    alerts = [];
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ balance: '500.0000000', asset_type: 'native' }],
      }),
    });
    watcher = new BalanceWatcher(mockAccount, mockConfig, 'testnet', (alert) => alerts.push(alert));
  });

  afterEach(async () => {
    await watcher.stop();
  });

  it('should have correct name', () => {
    expect(watcher.name).toBe('BalanceWatcher');
  });

  it('should fetch balance from Horizon on start', async () => {
    await watcher.start();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/accounts/'));
  });

  it('should not emit alert on first check', async () => {
    await watcher.start();
    expect(alerts).toHaveLength(0);
  });

  it('should emit critical alert when balance drops below minimum', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balances: [{ balance: '500.0000000', asset_type: 'native' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balances: [{ balance: '50.0000000', asset_type: 'native' }] }),
      });

    await watcher.start();
    await (watcher as any).check();

    const minAlert = alerts.find(a => a.type === 'balance_below_minimum');
    expect(minAlert).toBeDefined();
    expect(minAlert?.severity).toBe('critical');
  });

  it('should handle Horizon API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(watcher.start()).resolves.not.toThrow();
  });
});
