#!/bin/bash
set -e

# ============================================
# DFS CRM - SSL Renewal Script
# Run on the VPS when the Let's Encrypt cert
# is close to expiry or already expired.
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_DIR=/var/www/dfs-crm
cd "$PROJECT_DIR"

# ---- 0. Show current cert state ----
step "Current cert state (before renewal):"
sudo docker compose run --rm certbot certificates || true

# ---- 1. Attempt renewal ----
FORCE=""
if [ "$1" = "--force" ]; then
    FORCE="--force-renewal"
    warn "Force-renewal requested; will replace cert even if not near expiry."
fi

step "Running certbot renew ${FORCE}..."
if sudo docker compose run --rm certbot renew ${FORCE}; then
    echo "Certbot renew succeeded."
else
    err "Certbot renew failed. See output above."
    echo ""
    echo "Common fixes:"
    echo "  * Port 80 must be reachable from the public internet (Let's Encrypt uses it)."
    echo "  * Nginx must be running and serving /.well-known/acme-challenge/ via the webroot."
    echo "  * Rate limits: Let's Encrypt caps 5 duplicate certs per 7 days."
    exit 1
fi

# ---- 2. Reload nginx so the new cert is picked up ----
step "Restarting nginx to load the new certificate..."
sudo docker compose restart nginx

# ---- 3. Verify ----
step "New cert state (after renewal):"
sudo docker compose run --rm certbot certificates

echo ""
echo -e "${GREEN}SSL renewal complete.${NC}"
echo "  Browser-check: https://portal.dfs.finance"
echo "  Expiry check:  echo | openssl s_client -servername portal.dfs.finance -connect portal.dfs.finance:443 2>/dev/null | openssl x509 -noout -dates"
echo ""
