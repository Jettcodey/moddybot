#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "Starting deployment..."

echo "Pulling latest changes from GitHub..."
git pull origin main

echo "Installing dependencies..."
bun install

echo "Restarting bot with systemd..."
sudo systemctl restart moddybot

echo "Deployment complete!"
