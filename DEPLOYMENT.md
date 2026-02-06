# ModdyBot Deployment Guide

This guide explains how to deploy the autonomous deployment system for ModdyBot using GitHub webhooks and Cloudflare Tunnel.

## Overview

The deployment system automatically:
1. Receives GitHub push notifications via webhook
2. Pulls the latest code from GitHub
3. Installs updated dependencies
4. Restarts the bot

All without exposing your server's IP address, thanks to Cloudflare Tunnel.

## Prerequisites

- A server (Linux VPS recommended) with:
  - Git installed
  - Bun installed
  - PM2 installed (`npm install -g pm2`)
  - Cloudflare Tunnel (`cloudflared`) installed
- GitHub repository access
- Cloudflare account with domain configured

## Installation Steps

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Install Cloudflare Tunnel

Follow the official guide: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/

Or quick install on Linux:
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

### 3. Clone Repository

```bash
cd ~
git clone https://github.com/coah80/moddybot.git
cd moddybot
```

### 4. Configure Environment Variables

Create `.env` for the bot (if not already exists):
```bash
cp .env.example .env
```

Edit `.env` and add your Discord bot token and other required variables.

Create `.env.deploy` for the webhook server:
```bash
cp .env.deploy.example .env.deploy
```

Edit `.env.deploy`:
```env
WEBHOOK_SECRET=your_secure_random_secret_here
WEBHOOK_PORT=3000
```

> [!IMPORTANT]
> Generate a strong random secret for `WEBHOOK_SECRET`. You'll use this same secret when configuring the GitHub webhook.
> 
> ```bash
> openssl rand -hex 32
> ```

### 5. Install Dependencies

```bash
bun install
```

### 6. Configure Cloudflare Tunnel

Login to Cloudflare:
```bash
cloudflared tunnel login
```

Create a tunnel:
```bash
cloudflared tunnel create moddybot
```

Create a config file at `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID_FROM_PREVIOUS_COMMAND>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: moddy.coah80.com
    service: http://localhost:3000
  - service: http_status:404
```

Route the tunnel to your domain in Cloudflare dashboard, or via CLI:
```bash
cloudflared tunnel route dns moddybot moddy.coah80.com
```

Run the tunnel as a service:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 7. Start Bot and Webhook Server with PM2

```bash
bun run pm2:start
```

This starts both the Discord bot and the webhook server.

Verify processes are running:
```bash
pm2 list
```

You should see:
- `moddybot` - The Discord bot
- `deploy-server` - The webhook server

Save PM2 configuration to restart on reboot:
```bash
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable auto-restart on system reboot.

### 8. Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/coah80/moddybot
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://moddy.coah80.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: Use the same value as `WEBHOOK_SECRET` from `.env.deploy`
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked
4. Click **Add webhook**

GitHub will send a test ping. Check the webhook delivery status to verify it succeeded.

## Verification

### Test Webhook Server Locally

```bash
curl https://moddy.coah80.com/health
```

Should return: `{"status":"ok"}`

### Test Full Deployment

1. Make a small change to your repository (e.g., update README.md)
2. Commit and push to GitHub
3. Check PM2 logs:
   ```bash
   pm2 logs deploy-server
   ```
4. You should see:
   - Webhook received
   - Deployment started
   - Git pull output
   - Bot restart confirmation

## Useful Commands

### View Logs
```bash
pm2 logs moddybot
pm2 logs deploy-server
pm2 logs
```

### Restart Services
```bash
bun run pm2:restart
```

### Stop Services
```bash
bun run pm2:stop
```

### Check Status
```bash
pm2 status
```

### Manual Deployment
```bash
bash deploy.sh
```

## Troubleshooting

### Webhook Returns 401 Unauthorized

The webhook secret doesn't match. Verify:
1. `.env.deploy` has the correct `WEBHOOK_SECRET`
2. GitHub webhook configuration has the same secret
3. Restart the deploy-server: `pm2 restart deploy-server`

### Cloudflare Tunnel Not Working

Check tunnel status:
```bash
sudo systemctl status cloudflared
```

View cloudflared logs:
```bash
sudo journalctl -u cloudflared -f
```

Verify DNS is configured:
```bash
dig moddy.coah80.com
```

### Bot Not Restarting After Deployment

Check PM2 process name matches:
```bash
pm2 list
```

The deploy script restarts `moddybot`. If PM2 shows a different name, update `deploy.sh`.

### Permission Denied on deploy.sh

Make the script executable:
```bash
chmod +x deploy.sh
```

## Security Notes

- Never commit `.env` or `.env.deploy` to Git (they're in `.gitignore`)
- Use a strong random secret for `WEBHOOK_SECRET`
- Cloudflare Tunnel encrypts traffic and hides your server IP
- The webhook signature verification prevents unauthorized deployments
