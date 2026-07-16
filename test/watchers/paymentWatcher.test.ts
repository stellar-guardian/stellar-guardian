import { PaymentWatcher } from '../../src/watchers/paymentWatcher';
import { AccountConfig, Alert, PaymentWatcherConfig } from '../../src/types/index';

global.fetch = jest.fn();

const VALID_PUBLIC_KEY = 'GBZVR7LGDVHGPUDZXWPFHHLGHJRCB3BGFTRPZJPDQG4KPQKZHNM4KPBA';
const OTHER_KEY = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGMRCEA2KCZOBZHR3HEQN22';

const mockAccount: AccountConfig = {
  publicKey: VALID_PUBLIC_KEY,
  label: 'Test Account',
  watchers: {},
};

const mockConfig: PaymentWatcherConfig = {
  enabled: true,
  minimumAmount: 1,
  alertOnReceived: true,
  alertOnSent: true,
};

const mockPaymentResponse = (from: string, to: string, amount = '100.0000000') => ({
  _embedded: {
    records: [
      {
        id: 'payment-123',
        type: 'payment',
        amount,
        asset_type: 'native',
        from,
        to,
        created_at: '2026-07-16T07:00:00Z',
      },
    ],
  },
});

describe('PaymentWatcher', () => {
  let alerts: Alert[] = [];
  let watcher: PaymentWatcher;

  beforeEach(() => {
    alerts = [];
    jest.clearAllMocks();
    watcher = new PaymentWatcher(
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
    expect(watcher.name).toBe('PaymentWatcher');
  });

  it('should detect incoming payment', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPaymentResponse(OTHER_KEY, VALID_PUBLIC_KEY),
    });

    await watcher.start();
    await new Promise(r => setTimeout(r, 100));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('payment_received');
    expect(alerts[0].severity).toBe('info');
  });

  it('should detect outgoing payment', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPaymentResponse(VALID_PUBLIC_KEY, OTHER_KEY),
    });

    await watcher.start();
    await new Promise(r => setTimeout(r, 100));

    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('payment_sent');
  });

  it('should skip payments below minimum amount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPaymentResponse(OTHER_KEY, VALID_PUBLIC_KEY, '0.5000000'),
    });

    await watcher.start();
    await new Promise(r => setTimeout(r, 100));

    expect(alerts).toHaveLength(0);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(watcher.start()).resolves.not.toThrow();
  });

  it('should include payment details in alert', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPaymentResponse(OTHER_KEY, VALID_PUBLIC_KEY, '50.0000000'),
    });

    await watcher.start();
    await new Promise(r => setTimeout(r, 100));

    expect(alerts[0].details.amount).toBe('50.0000000');
    expect(alerts[0].details.asset).toBe('XLM');
    expect(alerts[0].details.direction).toBe('received');
  });
});
