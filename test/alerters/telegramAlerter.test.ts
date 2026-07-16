import { TelegramAlerter } from '../../src/alerters/telegramAlerter';
import { Alert, TelegramAlerterConfig } from '../../src/types/index';

global.fetch = jest.fn();

const mockConfig: TelegramAlerterConfig = {
  enabled: true,
  botToken: 'test-bot-token-123',
  chatIds: ['-1001234567890'],
  minimumSeverity: 'info',
};

const mockAlert: Alert = {
  id: 'test-id-123',
  type: 'payment_received',
  severity: 'info',
  accountPublicKey: 'GBZVR7LGDVHGPUDZXWPFHHLGHJRCB3BGFTRPZJPDQG4KPQKZHNM4KPBA',
  accountLabel: 'Treasury',
  message: 'Payment received: 100.0000000 XLM',
  details: {
    amount: '100.0000000',
    asset: 'XLM',
    direction: 'received',
  },
  timestamp: new Date('2026-07-16T07:00:00Z'),
  network: 'mainnet',
};

describe('TelegramAlerter', () => {
  let alerter: TelegramAlerter;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    alerter = new TelegramAlerter(mockConfig);
  });

  it('should have correct name', () => {
    expect(alerter.name).toBe('TelegramAlerter');
  });

  it('should POST to Telegram API', async () => {
    await alerter.send(mockAlert);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should send to all configured chat IDs', async () => {
    const multiChatConfig: TelegramAlerterConfig = {
      ...mockConfig,
      chatIds: ['-1001234567890', '-1009876543210'],
    };
    const multiAlerter = new TelegramAlerter(multiChatConfig);
    await multiAlerter.send(mockAlert);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should skip alert below minimum severity', async () => {
    const highMinConfig: TelegramAlerterConfig = {
      ...mockConfig,
      minimumSeverity: 'critical',
    };
    const strictAlerter = new TelegramAlerter(highMinConfig);
    await strictAlerter.send(mockAlert);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should include correct chat ID in payload', async () => {
    await alerter.send(mockAlert);
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.chat_id).toBe('-1001234567890');
  });

  it('should throw on Telegram API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });
    await expect(alerter.send(mockAlert)).rejects.toThrow('Telegram API error');
  });

  it('should use MarkdownV2 parse mode', async () => {
    await alerter.send(mockAlert);
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(body.parse_mode).toBe('MarkdownV2');
  });
});
