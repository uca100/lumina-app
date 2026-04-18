#!/bin/bash
set -e

APP=lumina
PI5=uri@192.168.40.99
REMOTE_DIR=/usr/local/$APP

echo "==> Building $APP..."
BUILT_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ") BUILT_AT=$BUILT_AT npm run build

echo "==> Preparing remote directory..."
ssh $PI5 "sudo mkdir -p $REMOTE_DIR && sudo chown uri:uri $REMOTE_DIR"

echo "==> Syncing to pi5..."
rsync -av --delete \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env.local \
  --exclude='*.db' \
  --exclude='*.db-shm' \
  --exclude='*.db-wal' \
  --exclude='.next/cache' \
  ./ $PI5:$REMOTE_DIR/

echo "==> Installing production deps on pi5..."
ssh $PI5 "cd $REMOTE_DIR && npm install --omit=dev"

echo "==> Rebuilding native modules on pi5..."
ssh $PI5 "cd $REMOTE_DIR && npm rebuild better-sqlite3"

echo "==> Installing systemd service..."
ssh $PI5 "sudo cp $REMOTE_DIR/$APP.service /etc/systemd/system/$APP.service && sudo systemctl daemon-reload && sudo systemctl enable $APP"

echo "==> Restarting $APP service..."
ssh $PI5 "sudo systemctl restart $APP"

echo "==> Done! $APP deployed to pi5."
