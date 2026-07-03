#!/bin/bash
set -e

# ============================================
# DFS CRM - Update Script
# Pulls latest code, rebuilds, restarts.
# Run this on your VPS when there are new changes in GitHub.
# ============================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

cd /var/www/dfs-crm

print_step "Pulling latest code from GitHub..."
git pull origin main

# ---- Check SMTP config in .env ----
ENV_FILE=/var/www/dfs-crm/.env
if [ -f "$ENV_FILE" ]; then
    CURRENT_SMTP_USER=$(grep -E '^SMTP_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
    CURRENT_SMTP_PASS=$(grep -E '^SMTP_PASS=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

    if [ -z "$CURRENT_SMTP_USER" ] || [ "$CURRENT_SMTP_USER" = "your-email@gmail.com" ] \
       || [ -z "$CURRENT_SMTP_PASS" ] || [ "$CURRENT_SMTP_PASS" = "your-app-specific-password" ]; then
        print_warn "SMTP is not configured in .env — emails will not send."
        echo ""
        read -p "Configure SMTP now? (y/N): " CONFIGURE_SMTP
        if [ "$CONFIGURE_SMTP" = "y" ] || [ "$CONFIGURE_SMTP" = "Y" ]; then
            read -p "SMTP host [smtp-relay.brevo.com]: " SMTP_HOST
            SMTP_HOST="${SMTP_HOST:-smtp-relay.brevo.com}"
            read -p "SMTP port [587]: " SMTP_PORT
            SMTP_PORT="${SMTP_PORT:-587}"
            read -p "SMTP secure (true/false) [false]: " SMTP_SECURE
            SMTP_SECURE="${SMTP_SECURE:-false}"
            read -p "SMTP username (e.g. 98000d002@smtp-brevo.com): " SMTP_USER
            read -sp "SMTP password / API key: " SMTP_PASS
            echo ""
            read -p "Sender email 'From' (e.g. noreply@dfs.finance): " SMTP_FROM

            # Update .env in-place — replace or append each key
            for kv in "SMTP_HOST=$SMTP_HOST" "SMTP_PORT=$SMTP_PORT" "SMTP_SECURE=$SMTP_SECURE" \
                      "SMTP_USER=$SMTP_USER" "SMTP_PASS=$SMTP_PASS" "SMTP_FROM=$SMTP_FROM"; do
                key="${kv%%=*}"
                if grep -qE "^${key}=" "$ENV_FILE"; then
                    sed -i "s|^${key}=.*|${kv}|" "$ENV_FILE"
                else
                    echo "$kv" >> "$ENV_FILE"
                fi
            done
            echo "SMTP settings written to .env."
        else
            print_warn "Skipping SMTP setup — emails will remain disabled."
        fi
    else
        echo "SMTP already configured (${CURRENT_SMTP_USER})."
    fi
fi

print_step "Rebuilding containers..."
docker compose up -d --build

print_step "Waiting for app to be ready..."
for i in {1..30}; do
    if docker compose exec -T app test -f /app/server.js &>/dev/null; then
        echo "App is ready."
        break
    fi
    sleep 2
done

print_step "Applying any new migrations..."
docker compose exec -T app npx prisma migrate deploy 2>/dev/null || print_warn "No new migrations."

print_step "Cleaning up old images..."
docker image prune -f >/dev/null 2>&1 || true

echo ""
echo -e "${GREEN}Update complete.${NC}"
echo ""
echo "  View logs:     docker compose logs -f app"
echo "  Check status:  docker compose ps"
echo ""
