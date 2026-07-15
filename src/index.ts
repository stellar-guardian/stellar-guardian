#!/usr/bin/env node
import { startDaemon } from './daemon/index.js';
import { log } from './lib/logger.js';

const command = process.argv[2];

async function main() {
  log.info('stellar-guardian v0.1.0', 'CLI');

  switch (command) {
    case 'start':
      await startDaemon();
      break;
    case 'version':
    case '--version':
    case '-v':
      console.log('stellar-guardian v0.1.0');
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
stellar-guardian — Stellar account monitoring daemon

Usage:
  stellar-guardian start          Start the monitoring daemon
  stellar-guardian status         Show daemon status
  stellar-guardian test-alert     Send test alert through all alerters
  stellar-guardian version        Show version number
  stellar-guardian help           Show this help message

Configuration:
  Create guardian.config.json in your working directory.
  See https://github.com/stellar-guardian/stellar-guardian for docs.
      `);
      break;
  }
}

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
