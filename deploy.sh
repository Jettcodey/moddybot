#!/bin/bash

set -e

cd /home/cole/moddybot

echo "Starting deployment..."

echo "Pulling latest changes from GitHub..."
git pull origin main

echo "Installing dependencies..."
bun install

echo "Restarting bot with systemd..."
sudo systemctl restart moddybot

echo "Deployment complete!"
