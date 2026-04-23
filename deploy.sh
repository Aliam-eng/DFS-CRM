#!/bin/bash
set -e

# ============================================
# DFS CRM - Automated VPS Deployment Script
# Run this on your Hostinger VPS as root
# ============================================

DOMAIN=""
EMAIL=""
REPO_URL="https://github.com/Aliam-eng/DFS-CRM.git"
DB_PASSWORD=""
SMTP_USER=""
SMTP_PASS=""
STORAGE_PROVIDER="LOCAL"
UPLOADTHING_TOKEN=""

# ---- Colors ----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() { echo -e "\n${GREEN}[STEP]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Collect info ----
echo ""
echo "============================================"
echo "   DFS CRM - Hostinger VPS Deploy"
echo "============================================"
echo ""

read -p "Enter your domain (e.g. crm.dfstrading.com): " DOMAIN
read -p "Enter your email (for SSL certificate): " EMAIL
read -p "GitHub repo URL [${REPO_URL}]: " INPUT_REPO
REPO_URL="${INPUT_REPO:-$REPO_URL}"
read -sp "Enter a database password: " DB_PASSWORD
echo ""
read -p "Enter SMTP email (Gmail): " SMTP_USER
read -sp "Enter SMTP app password: " SMTP_PASS
echo ""
read -p "Storage provider (LOCAL/UPLOADTHING) [LOCAL]: " INPUT_STORAGE
STORAGE_PROVIDER="${INPUT_STORAGE:-LOCAL}"
if [ "$STORAGE_PROVIDER" = "UPLOADTHING" ]; then
    read -sp "Enter UploadThing V7 token: " UPLOADTHING_TOKEN
    echo ""
fi

NEXTAUTH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# ---- Step 1: Install Docker ----
print_step "Installing Docker..."

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed."
else
    echo "Docker already installed."
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin
fi

# ---- Step 2: Clone repo ----
print_step "Cloning repository..."

mkdir -p /var/www
if [ -d "/var/www/dfs-crm" ]; then
    print_warn "Directory /var/www/dfs-crm already exists. Pulling latest..."
    cd /var/www/dfs-crm
    git pull origin main
else
    cd /var/www
    git clone "$REPO_URL" dfs-crm
    cd /var/www/dfs-crm
fi

# ---- Step 3: Create .env ----
print_step "Creating .env file..."

cat > /var/www/dfs-crm/.env <<EOF
DB_PASSWORD=${DB_PASSWORD}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
AUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=noreply@${DOMAIN}
STORAGE_PROVIDER=${STORAGE_PROVIDER}
UPLOADTHING_TOKEN=${UPLOADTHING_TOKEN}
EOF

echo ".env created."

# ---- Step 4: Update nginx.conf with domain ----
print_step "Configuring Nginx for ${DOMAIN}..."

sed -i "s/yourdomain.com/${DOMAIN}/g" /var/www/dfs-crm/nginx.conf

# ---- Step 5: Build & Start ----
print_step "Building and starting containers (this may take a few minutes)..."

cd /var/www/dfs-crm
docker compose up -d --build

# Wait for database to be healthy
print_step "Waiting for database to be ready..."
for i in {1..30}; do
    if docker compose exec -T db pg_isready -U dfsuser -d dfs_crm &>/dev/null; then
        echo "Database is ready."
        break
    fi
    sleep 2
done

# Wait for app to be ready
print_step "Waiting for app to start..."
for i in {1..30}; do
    if docker compose exec -T app test -f /app/server.js &>/dev/null; then
        echo "App is ready."
        break
    fi
    sleep 2
done

# ---- Step 6: Run migrations (should already run on container start, but ensure) ----
print_step "Ensuring database migrations are applied..."
docker compose exec -T app npx prisma migrate deploy 2>/dev/null || print_warn "Migrations may have run already."

# ---- Step 7: Seed database ----
print_step "Seeding database with demo users..."
docker compose exec -T app npx tsx prisma/seed.ts 2>/dev/null || print_warn "Seed may have already been applied."

# ---- Step 8: SSL Certificate ----
print_step "Setting up SSL certificate for ${DOMAIN}..."

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/lib/letsencrypt \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.${DOMAIN}" || print_warn "SSL setup failed — you can retry manually later."

# Update nginx to use SSL
cat > /var/www/dfs-crm/nginx.conf <<NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    client_max_body_size 10M;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# Restart nginx with SSL config
docker compose restart nginx

# ---- Step 9: SSL Auto-renewal cron ----
print_step "Setting up SSL auto-renewal..."

(crontab -l 2>/dev/null | grep -v "dfs-crm.*certbot renew" ; echo "0 3 * * * cd /var/www/dfs-crm && docker compose run --rm certbot renew --quiet && docker compose restart nginx") | crontab -

# ---- Step 10: Daily database backup cron ----
print_step "Setting up daily database backup..."

mkdir -p /var/backups/dfs-crm
(crontab -l 2>/dev/null | grep -v "dfs-crm.*pg_dump" ; echo "0 2 * * * cd /var/www/dfs-crm && docker compose exec -T db pg_dump -U dfsuser dfs_crm > /var/backups/dfs-crm/dfs_\$(date +\%Y\%m\%d).sql && find /var/backups/dfs-crm -name 'dfs_*.sql' -mtime +14 -delete") | crontab -

# ---- Step 11: Firewall (UFW) ----
print_step "Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp comment "SSH" >/dev/null 2>&1 || true
    ufw allow 80/tcp comment "HTTP" >/dev/null 2>&1 || true
    ufw allow 443/tcp comment "HTTPS" >/dev/null 2>&1 || true
    echo "y" | ufw enable >/dev/null 2>&1 || true
    echo "Firewall configured."
else
    print_warn "UFW not installed — skipping firewall setup."
fi

# ---- Done ----
echo ""
echo "============================================"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "  URL:   https://${DOMAIN}"
echo ""
echo "  Demo Logins:"
echo "  ┌──────────────────────────┬──────────────┐"
echo "  │ Email                    │ Password     │"
echo "  ├──────────────────────────┼──────────────┤"
echo "  │ superadmin@dfs.com       │ Admin@123    │"
echo "  │ admin@dfs.com            │ Admin@123    │"
echo "  │ compliance@dfs.com       │ Admin@123    │"
echo "  │ operations@dfs.com       │ Admin@123    │"
echo "  └──────────────────────────┴──────────────┘"
echo ""
echo -e "${YELLOW}  IMPORTANT: Change demo passwords immediately!${NC}"
echo ""
echo "  Useful commands:"
echo "    cd /var/www/dfs-crm"
echo "    docker compose logs -f app    # View app logs"
echo "    docker compose restart        # Restart all"
echo "    docker compose down           # Stop all"
echo "    docker compose up -d --build  # Rebuild & start"
echo ""
