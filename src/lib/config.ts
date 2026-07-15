import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { GuardianConfig } from '../types/index';
import { log } from './logger';

function resolveEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const value = process.env[key];
      if (!value) {
        log.warn(`Environment variable ${key} is not set`);
        return '';
      }
      return value;
    });
  }
  if (Array.isArray(obj)) return obj.map(resolveEnvVars);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, resolveEnvVars(v)])
    );
  }
  return obj;
}

function validateConfig(config: GuardianConfig): void {
  const errors: string[] = [];

  if (!config.network) {
    errors.push('Missing required field: network');
  } else if (!['testnet', 'mainnet'].includes(config.network)) {
    errors.push(`Invalid network: ${config.network}`);
  }

  if (!config.accounts || config.accounts.length === 0) {
    errors.push('At least one account must be configured');
  }

  config.accounts?.forEach((account, i) => {
    if (!account.publicKey) {
      errors.push(`accounts[${i}]: missing publicKey`);
    } else if (!account.publicKey.startsWith('G') || account.publicKey.length !== 56) {
      errors.push(`accounts[${i}]: invalid Stellar public key format`);
    }
  });

  if (!config.alerters || Object.keys(config.alerters).length === 0) {
    errors.push('At least one alerter must be configured');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

let cachedConfig: GuardianConfig | null = null;

export function getConfig(configPath?: string): GuardianConfig {
  if (cachedConfig) return cachedConfig;

  const path = configPath || resolve(process.cwd(), 'guardian.config.json');

  if (!existsSync(path)) {
    throw new Error(`Configuration file not found at ${path}`);
  }

  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read config file: ${(err as Error).message}`);
  }

  let parsed: GuardianConfig;
  try {
    parsed = JSON.parse(raw) as GuardianConfig;
  } catch {
    throw new Error('Invalid JSON in guardian.config.json');
  }

  const resolved = resolveEnvVars(parsed) as GuardianConfig;
  validateConfig(resolved);

  log.success(`Configuration loaded (${resolved.accounts.length} account(s))`, 'Config');
  cachedConfig = resolved;
  return resolved;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
