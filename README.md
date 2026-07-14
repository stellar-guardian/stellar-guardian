# 🛡️ stellar-guardian

> A self-hosted monitoring and alerting daemon for Stellar accounts, nodes, and Soroban smart contracts — runs on Linux and Windows.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-black)](https://stellar.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows-lightgrey)](README.md)

---

## What is stellar-guardian?

`stellar-guardian` is an open-source self-hosted daemon that monitors your Stellar accounts, Soroban smart contracts, and network activity — alerting you instantly via Email, Slack, Telegram, Discord, SMS, or webhooks when important events occur.

Instead of manually checking your Stellar accounts or building custom monitoring from scratch, you install stellar-guardian once and it watches everything for you 24/7.

---

## Why stellar-guardian?

Stellar developers and businesses currently have no reliable way to:

- ❌ Know when their account receives funds in real time
- ❌ Get alerted when a Soroban contract is invoked
- ❌ Detect when account balance drops below a threshold
- ❌ Monitor trustline changes on watched accounts
- ❌ Get notified about suspicious transaction patterns
- ❌ Track contract events across multiple deployments

`stellar-guardian` solves all of these with a single self-hosted daemon.

---

## Features

- 👁️ **Balance Watcher** — Alert when XLM or asset balances change or hit thresholds
- 💸 **Payment Watcher** — Real-time incoming and outgoing payment detection
- 🔔 **Transaction Watcher** — Monitor all transactions on watched accounts
- 📜 **Contract Event Watcher** — Monitor Soroban contract events by topic
- ⚠️ **Trustline Watcher** — Detect trustline additions and removals
- 📧 **Email Alerter** — Send alerts via SMTP (Gmail, SendGrid, custom)
- 💬 **Slack Alerter** — Post formatted alerts to Slack channels
- 🤖 **Telegram Alerter** — Send alerts via Telegram bot
- 🎮 **Discord Alerter** — Send rich embed alerts to Discord channels
- 🌐 **Webhook Alerter** — POST signed JSON payloads to any endpoint
- 📱 **SMS Alerter** — Send critical alerts via Twilio
- 🖥️ **Web Dashboard** — Real-time monitoring UI at localhost:8080
- 🐧 **Linux Service** — Runs as systemd service, starts on boot
- 🪟 **Windows Service** — Runs as native Windows Service
- 🐳 **Docker Support** — Run in container with persistent volumes
- 📊 **Alert History** — SQLite database with full alert and delivery logs
- ⚡ **Alert Rate Limiting** — Prevent notification flooding
- 📦 **Alert Batching** — Group rapid alerts into digest notifications

---

## Quick Start

### Installation

```bash
npm install -g stellar-guardian
```

### Initialize configuration

```bash
stellar-guardian init
```

### Start the daemon

```bash
# Run in foreground
stellar-guardian start

# Install as Linux systemd service
stellar-guardian install --linux

# Install as Windows Service
stellar-guardian install --windows
```

### Check status

```bash
stellar-guardian status
```

---

## Configuration

Create `guardian.config.json` in your working directory:

```json
{
  "accounts": [
    {
      "publicKey": "GABC...",
      "label": "Main Treasury",
      "watchers": {
        "balance": {
          "enabled": true,
          "minimumXLM": 100,
          "alertOnChange": true,
          "pollingInterval": 30
        },
        "payments": {
          "enabled": true,
          "minimumAmount": 10
        },
        "transactions": {
          "enabled": true
        },
        "trustlines": {
          "enabled": true
        }
      }
    }
  ],
  "contracts": [
    {
      "contractId": "CXYZ...",
      "label": "Token Contract",
      "watchEvents": true,
      "eventTopics": ["transfer", "mint"]
    }
  ],
  "alerters": {
    "email": {
      "enabled": true,
      "smtp": {
        "host": "smtp.gmail.com",
        "port": 587,
        "user": "you@gmail.com",
        "password": "${SMTP_PASSWORD}"
      },
      "recipients": ["alerts@yourcompany.com"],
      "minimumSeverity": "warning"
    },
    "slack": {
      "enabled": true,
      "webhookUrl": "${SLACK_WEBHOOK_URL}",
      "channel": "#stellar-alerts"
    },
    "telegram": {
      "enabled": false,
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "chatIds": ["-1001234567890"]
    },
    "discord": {
      "enabled": false,
      "webhookUrl": "${DISCORD_WEBHOOK_URL}"
    },
    "webhook": {
      "enabled": false,
      "url": "https://your-server.com/webhook",
      "secret": "${WEBHOOK_SECRET}"
    }
  },
  "dashboard": {
    "enabled": true,
    "port": 8080
  },
  "network": "mainnet"
}
```

---

## CLI Commands

```bash
# Initialize new configuration
stellar-guardian init

# Start daemon in foreground
stellar-guardian start

# Install as system service
stellar-guardian install --linux
stellar-guardian install --windows

# Uninstall service
stellar-guardian uninstall

# Check daemon status
stellar-guardian status

# Send test alert through all alerters
stellar-guardian test-alert

# Check system prerequisites
stellar-guardian doctor

# Watcher management
stellar-guardian watchers list
stellar-guardian watchers pause <id>
stellar-guardian watchers resume <id>

# Alert history
stellar-guardian alerts list
stellar-guardian alerts list --account GABC...
stellar-guardian alerts export --format csv

# View audit log
stellar-guardian audit list
```

---

## Platform Support

| Platform | Installation Method | Auto-start |
|---|---|---|
| Ubuntu / Debian | systemd service | ✅ On boot |
| CentOS / RHEL | systemd service | ✅ On boot |
| Windows 10 | Windows Service | ✅ On boot |
| Windows Server | Windows Service | ✅ On boot |
| Docker | Container | ✅ Via restart policy |

---

## Alert Channels

| Alerter | Setup Difficulty | Cost |
|---|---|---|
| Email (SMTP) | Easy | Free (Gmail) |
| Slack | Easy | Free |
| Telegram | Easy | Free |
| Discord | Easy | Free |
| Desktop Notification | None | Free |
| ntfy.sh Push | Easy | Free |
| Webhook | Intermediate | Free |
| SMS (Twilio) | Easy | Paid |

---

## Roadmap

### v0.1.0 — Core Daemon
- [x] Project setup
- [ ] Daemon core architecture
- [ ] Linux systemd service
- [ ] Windows service installation
- [ ] Balance and payment watchers

### v0.2.0 — Alerters
- [ ] Email alerter
- [ ] Slack alerter
- [ ] Telegram alerter
- [ ] Discord alerter
- [ ] Webhook alerter

### v0.3.0 — Dashboard
- [ ] Web dashboard at localhost:8080
- [ ] Real-time balance charts
- [ ] Alert history with search
- [ ] Prometheus metrics endpoint

### v0.4.0 — Advanced Features
- [ ] Soroban contract event watcher
- [ ] Alert batching and rate limiting
- [ ] Weekly digest reports
- [ ] Docker support
- [ ] Standalone binaries for Linux and Windows

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

Look for issues tagged [`good first issue`](https://github.com/stellar-guardian/stellar-guardian/issues?q=label%3A%22good+first+issue%22) to get started.

---

## Community

- 💬 [GitHub Discussions](https://github.com/stellar-guardian/stellar-guardian/discussions)
- 🐛 [Issues](https://github.com/stellar-guardian/stellar-guardian/issues)
- 🐦 [Twitter](https://twitter.com/Engrukayat)

---

## License

MIT © [stellar-guardian](https://github.com/stellar-guardian)

---

<p align="center">Built with ❤️ for the Stellar ecosystem</p>
