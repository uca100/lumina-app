#!/usr/bin/env bash
# install.sh — lumina (Inspiration Manager)
# Run ON pi5 (192.168.40.99) as the 'uri' user.
# Idempotent: safe to re-run after app changes.
#
# Usage: bash install.sh
# Prerequisites: Node.js 18+, npm installed on pi5

set -e

APP="lumina"
INSTALL_DIR="/usr/local/lumina"
SERVICE_FILE="/etc/systemd/system/lumina.service"
PORT=3009
USER="uri"

echo "==> [lumina] Starting install/update..."

# ── 1. System dependencies ─────────────────────────────────────────────────
echo "==> Checking system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y build-essential

if ! command -v node &>/dev/null || ! node -e "process.exit(parseInt(process.versions.node) < 18 ? 1 : 0)" 2>/dev/null; then
  echo "ERROR: Node.js 18+ required."
  exit 1
fi

# ── 2. App directory ────────────────────────────────────────────────────────
echo "==> Setting up app directory at ${INSTALL_DIR}..."
sudo mkdir -p "${INSTALL_DIR}"
sudo chown "${USER}:${USER}" "${INSTALL_DIR}"

# ── 3. Source check ─────────────────────────────────────────────────────────
if [[ ! -f "${INSTALL_DIR}/package.json" ]]; then
  echo "WARNING: No source files found in ${INSTALL_DIR}."
  echo "Run ./deploy.sh from mac first, then re-run install.sh."
  exit 1
fi

# ── 4. Install Node dependencies & rebuild native modules ──────────────────
echo "==> Installing npm dependencies..."
cd "${INSTALL_DIR}"
/usr/bin/npm install --omit=dev

echo "==> Rebuilding native modules (better-sqlite3)..."
/usr/bin/npm rebuild better-sqlite3

# ── 5. Environment file ─────────────────────────────────────────────────────
if [[ ! -f "${INSTALL_DIR}/.env.local" ]]; then
  cat > "${INSTALL_DIR}/.env.local" <<EOF
NODE_ENV=production
PORT=3009
# Anthropic API key (for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# Notion integration (optional)
NOTION_API_KEY=your_notion_api_key_here
EOF
  echo "==> Created .env.local — fill in API keys before starting service."
else
  echo "==> .env.local already exists — skipping."
fi

# ── 6. Systemd service ──────────────────────────────────────────────────────
echo "==> Installing systemd service..."
sudo cp "${INSTALL_DIR}/lumina.service" "${SERVICE_FILE}"
sudo systemctl daemon-reload
sudo systemctl enable lumina
sudo systemctl restart lumina

sleep 2
if sudo systemctl is-active --quiet lumina; then
  echo "==> lumina service is running."
else
  echo "ERROR: lumina service failed to start. Check: journalctl -u lumina -n 50"
  exit 1
fi

# ── 7. Firewall ─────────────────────────────────────────────────────────────
echo "==> Checking firewall rule for port ${PORT}..."
if ! sudo ufw status | grep -q "${PORT}"; then
  sudo ufw allow from 192.168.40.100 to any port ${PORT} proto tcp comment "lumina — nginx proxy only"
  echo "==> ufw rule added for port ${PORT}."
else
  echo "==> ufw rule already exists."
fi

echo ""
echo "==> MANUAL STEP (if first install): Add nginx route on tec (192.168.40.100):"
echo "    location /lumina { proxy_pass http://192.168.40.99:3009; ... }"
echo "    Then: cd ~/projects/nginx-proxy && ./deploy.sh"
echo ""

echo "==> [lumina] Install complete. URL: https://myweb.tail075174.ts.net/lumina"
