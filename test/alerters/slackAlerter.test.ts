import { SlackAlerter } from '../../src/alerters/slackAlerter';
import { Alert, SlackAlerterConfig } from '../../src/types/index';

global.fetch = jest.fn();

const mockConfig: SlackAlerterConfig = {
  enabled: true,
  webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK',
  channel: '#stellar-alerts',
  minimumSeverity: 'info',
};

const mockAlert: Alert = {
  id: 'test-id-123',
  type: 'balance_below_minimum',
  severity: 'critical',
  accountPublicKey: 'GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890AB',
  accountLabel: 'Treasury',
  message: 'XLM balance 50.00 is below minimum threshold of 100 XLM',
  details: { currentBalance: '50.0000000', minimumBalance: 100 },
  timestamp: new Date('2026-07-14T22:00:00Z'),
  network: 'mainnet',
};

describe('SlackAlerter', () => {
  let alerter: SlackAlerter;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    alerter = new SlackAlerter(mockConfig);
  });

  it('should have correct name', () => {
    expect(alerter.name).toBe('SlackAlerter');
  });

  it('should POST to Slack webhook URL', async () => {
    await alerter.send(mockAlert);
    expect(global.fetch).toHaveBeenCalledWith(
      mockConfig.webhookUrl,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should use red color for critical alerts', async () => {
    await alerter.send(mockAlert);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.attachments[0].color).toBe('#ff0000');
  });

  it('should skip alert below minimum severity', async () => {
    const highMinConfig: SlackAlerterConfig = { ...mockConfig, minimumSeverity: 'critical' };
    const infoAlerter = new SlackAlerter(highMinConfig);
    const infoAlert: Alert = { ...mockAlert, severity: 'info' };
    await infoAlerter.send(infoAlert);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw on Slack API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400 });
    await expect(alerter.send(mockAlert)).rejects.toThrow();
  });

  it('should include channel in payload', async () => {
    await alerter.send(mockAlert);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.channel).toBe('#stellar-alerts');
  });
});
