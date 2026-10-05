#!/usr/bin/env bash
# NexaTelix one-shot VPS setup for Ubuntu 22.04 / 24.04.
# Run as root, from INSIDE the cloned nexatelix folder, AFTER creating .env.local.
#   cd /opt/nexatelix
#   sudo bash vps-setup.sh nexatelix.com
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then echo "Usage: sudo bash vps-setup.sh <domain>   e.g.  sudo bash vps-setup.sh nexatelix.com"; exit 1; fi
APP_DIR="$(pwd)"
[ -f "$APP_DIR/package.json" ] || { echo "ERROR: run this from inside the cloned nexatelix folder."; exit 1; }
[ -f "$APP_DIR/.env.local" ]  || { echo "ERROR: create .env.local first (see DEPLOY-ON-VPS.md step 5)."; exit 1; }

echo "==> [1/8] Swap (2G, so the build never runs out of memory)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [2/8] Base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https ufw

echo "==> [3/8] Node.js 22 LTS"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "    node $(node -v)"

echo "==> [4/8] Caddy (automatic HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

echo "==> [5/8] Install deps + build (takes 1-3 min)"
npm ci
npm run build

echo "==> [6/8] Run with pm2 (keeps it alive + restarts on reboot)"
npm i -g pm2
pm2 delete nexatelix >/dev/null 2>&1 || true
if [ -f "$APP_DIR/partner.pem" ]; then
  # Trust the partner's self-signed certificate (set before Node starts)
  NODE_EXTRA_CA_CERTS="$APP_DIR/partner.pem" PORT=3000 pm2 start npm --name nexatelix -- start
else
  PORT=3000 pm2 start npm --name nexatelix -- start
fi
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> [7/8] HTTPS reverse proxy for $DOMAIN"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN, www.$DOMAIN {
    reverse_proxy localhost:3000
}
EOF
systemctl reload caddy 2>/dev/null || systemctl restart caddy

echo "==> [8/8] Firewall (SSH + web)"
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22 >/dev/null 2>&1 || true
ufw allow 80  >/dev/null 2>&1 || true
ufw allow 443 >/dev/null 2>&1 || true
yes | ufw enable >/dev/null 2>&1 || true

echo ""
echo "============================================================"
echo " DONE.  Make sure DNS points $DOMAIN -> this server's IP."
echo " Then open  https://$DOMAIN  (HTTPS is fetched automatically"
echo " within a minute once DNS is live)."
echo ""
echo " Useful later:"
echo "   pm2 logs nexatelix     # see app logs"
echo "   pm2 restart nexatelix  # after an update (git pull && npm ci && npm run build)"
echo "============================================================"
