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
