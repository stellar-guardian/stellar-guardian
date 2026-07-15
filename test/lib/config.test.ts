import { clearConfigCache, getConfig } from '../../src/lib/config';
import * as fs from 'fs';

jest.mock('fs');

const VALID_PUBLIC_KEY = 'GBZVR7LGDVHGPUDZXWPFHHLGHJRCB3BGFTRPZJPDQG4KPQKZHNM4KPBA';

const validConfig = {
  network: 'testnet',
  accounts: [
    {
      publicKey: VALID_PUBLIC_KEY,
      label: 'Test Account',
      watchers: { balance: { enabled: true } },
    },
  ],
  alerters: {
    slack: { enabled: true, webhookUrl: 'https://hooks.slack.com/test' },
  },
};

describe('Config', () => {
  beforeEach(() => {
    clearConfigCache();
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(validConfig));
  });

  it('should load valid config', () => {
    const config = getConfig('/test/guardian.config.json');
    expect(config.network).toBe('testnet');
    expect(config.accounts).toHaveLength(1);
  });

  it('should throw when config file not found', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    expect(() => getConfig('/nonexistent.json')).toThrow('Configuration file not found');
  });

  it('should throw on invalid JSON', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('not valid json{{{');
    expect(() => getConfig('/test/guardian.config.json')).toThrow('Invalid JSON');
  });

  it('should throw when accounts array is empty', () => {
    const invalid = { ...validConfig, accounts: [] };
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(invalid));
    expect(() => getConfig('/test/guardian.config.json')).toThrow('At least one account');
  });

  it('should throw on invalid public key format', () => {
    const invalid = {
      ...validConfig,
      accounts: [{ ...validConfig.accounts[0], publicKey: 'INVALID' }],
    };
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(invalid));
    expect(() => getConfig('/test/guardian.config.json')).toThrow('invalid Stellar public key format');
  });

  it('should cache config on second call', () => {
    getConfig('/test/guardian.config.json');
    getConfig('/test/guardian.config.json');
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
  });
});
