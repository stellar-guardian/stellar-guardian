import { AlertSeverity } from '../types/index';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function timestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: string, color: string, icon: string, message: string, context?: string): string {
  const ts = `${colors.gray}${timestamp()}${colors.reset}`;
  const lvl = `${color}${colors.bold}${icon} ${level}${colors.reset}`;
  const ctx = context ? ` ${colors.cyan}[${context}]${colors.reset}` : '';
  return `${ts} ${lvl}${ctx} ${message}`;
}

export const log = {
  info(message: string, context?: string): void {
    console.log(formatMessage('INFO ', colors.blue, 'i', message, context));
  },
  success(message: string, context?: string): void {
    console.log(formatMessage('OK   ', colors.green, '+', message, context));
  },
  warn(message: string, context?: string): void {
    console.warn(formatMessage('WARN ', colors.yellow, '!', message, context));
  },
  error(message: string, context?: string): void {
    console.error(formatMessage('ERROR', colors.red, 'x', message, context));
  },
  alert(severity: AlertSeverity, message: string, context?: string): void {
    const colorMap: Record<AlertSeverity, string> = {
      info: colors.blue,
      warning: colors.yellow,
      critical: colors.red,
    };
    console.log(formatMessage('ALERT', colorMap[severity], '*', message, context));
  },
  debug(message: string, context?: string): void {
    if (process.env.DEBUG === 'true') {
      console.log(formatMessage('DEBUG', colors.gray, '?', message, context));
    }
  },
};
