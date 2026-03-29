# DFS CRM - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Option A: Deploy to VPS (Ubuntu)](#option-a-deploy-to-vps-ubuntu)
4. [Option B: Deploy to Heroku](#option-b-deploy-to-heroku)
5. [Option C: Deploy to Vercel](#option-c-deploy-to-vercel)
6. [Database Setup](#database-setup)
7. [SSL / HTTPS](#ssl--https)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Maintenance & Updates](#maintenance--updates)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement      | Version   | Notes                          |
|------------------|-----------|--------------------------------|
| Node.js          | 18.x+     | LTS recommended                |
| PostgreSQL       | 14+       | Required for database          |
| npm              | 9+        | Comes with Node.js             |
| Git              | 2.x+      | For cloning/deploying          |

### Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **UI**: Chakra UI 2.10, Framer Motion
- **Database**: PostgreSQL + Prisma ORM 5.22
- **Auth**: NextAuth.js 5 (JWT sessions)
- **Email**: Nodemailer (SMTP)
- **PDF**: jsPDF (client-side generation)

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-random-64-char-string-here"

# Generate a secret with:
# openssl rand -base64 64

# ============================================
# SMTP (Email)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# For Gmail: Enable 2FA, then create an App Password
# https://myaccount.google.com/apppasswords
```

### Variable Reference

| Variable         | Required | Description                                      |
|------------------|----------|--------------------------------------------------|
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                     |
| `NEXTAUTH_URL`   | Yes      | Full URL of your deployed app                    |
| `NEXTAUTH_SECRET`| Yes      | Random secret for JWT signing (min 32 chars)     |
| `SMTP_HOST`      | Yes      | SMTP server hostname                             |
| `SMTP_PORT`      | Yes      | SMTP port (587 for TLS, 465 for SSL)             |
| `SMTP_SECURE`    | Yes      | `true` for port 465, `false` for 587             |
| `SMTP_USER`      | Yes      | SMTP authentication username                     |
| `SMTP_PASS`      | Yes      | SMTP authentication password                     |
| `SMTP_FROM`      | No       | Sender email (defaults to SMTP_USER)             |

---

## Option A: Deploy to VPS (Ubuntu)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should be 18.x+
npm -v   # Should be 9+

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE dfs_crm;
CREATE USER dfsuser WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE dfs_crm TO dfsuser;
ALTER DATABASE dfs_crm OWNER TO dfsuser;
\q
```

Your `DATABASE_URL` will be:
```
postgresql://dfsuser:your-strong-password@localhost:5432/dfs_crm?schema=public
```

### 3. Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/your-repo/dfs-crm.git
cd dfs-crm

# Create .env file
nano .env
# Paste your environment variables (see above)

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed demo users
npx tsx prisma/seed.ts

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "dfs-crm" -- start
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/dfs-crm
```

Paste the following:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Max upload size (for KYC documents)
    client_max_body_size 10M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/dfs-crm/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/dfs-crm /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5. File Upload Directory

```bash
# Create uploads directory
mkdir -p /var/www/dfs-crm/uploads/kyc-documents
mkdir -p /var/www/dfs-crm/uploads/proof-of-address
mkdir -p /var/www/dfs-crm/uploads/aml-reports

# Set permissions
chown -R www-data:www-data /var/www/dfs-crm/uploads
chmod -R 755 /var/www/dfs-crm/uploads
```

---

## Option B: Deploy to Heroku

### 1. Create Heroku App

```bash
# Login
heroku login

# Create app
heroku create dfs-crm

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0
```

### 2. Set Environment Variables

```bash
heroku config:set NEXTAUTH_URL="https://dfs-crm.herokuapp.com"
heroku config:set NEXTAUTH_SECRET="$(openssl rand -base64 64)"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT=587
heroku config:set SMTP_SECURE=false
heroku config:set SMTP_USER="your-email@gmail.com"
heroku config:set SMTP_PASS="your-app-password"
```

> Note: `DATABASE_URL` is automatically set by the PostgreSQL addon.

### 3. Deploy

```bash
# Push to Heroku
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy

# Seed demo users
heroku run npx tsx prisma/seed.ts

# Open app
heroku open
```

### 4. Heroku Procfile

Create a `Procfile` in the project root:

```
web: npm start
```

> **Important**: Heroku has an ephemeral filesystem. Uploaded files will be lost on dyno restart. For production, use a cloud storage service (AWS S3, Cloudinary) for file uploads.

---

## Option C: Deploy to Vercel

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Next.js

### 2. Configure Environment Variables

In Vercel dashboard > Project Settings > Environment Variables, add all the variables from the [Environment Variables](#environment-variables) section.

### 3. Database

Use a managed PostgreSQL service:
- **Vercel Postgres** (built-in)
- **Neon** (free tier available)
- **Supabase** (free tier available)
- **Railway** (easy setup)

### 4. Deploy

Vercel deploys automatically on every push to `main`.

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

> **Important**: Vercel is serverless. File uploads to local disk won't persist. Use cloud storage (S3, Vercel Blob) for file uploads.

---

## Database Setup

### Run Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

### Seed Demo Users

```bash
npx tsx prisma/seed.ts
```

This creates 4 demo users:

| Email                  | Role             | Password    |
|------------------------|------------------|-------------|
| `superadmin@dfs.com`   | Super Admin      | `Admin@123` |
| `admin@dfs.com`        | Admin Supervisor | `Admin@123` |
| `compliance@dfs.com`   | Compliance       | `Admin@123` |
| `operations@dfs.com`   | Operations       | `Admin@123` |

> **IMPORTANT**: Change these passwords immediately after first login in production!

### Database Backup

```bash
# Backup
pg_dump -U dfsuser -h localhost dfs_crm > backup_$(date +%Y%m%d).sql

# Restore
psql -U dfsuser -h localhost dfs_crm < backup_20260325.sql
```

### Automated Daily Backup (cron)

```bash
crontab -e
# Add this line:
0 2 * * * pg_dump -U dfsuser dfs_crm > /var/backups/dfs_crm_$(date +\%Y\%m\%d).sql
```

---

## SSL / HTTPS

### Using Certbot (Let's Encrypt - Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Verify SSL

After setup, your site should be accessible at `https://your-domain.com`.

Update `NEXTAUTH_URL` in `.env` to use `https://`:

```env
NEXTAUTH_URL="https://your-domain.com"
```

Then restart the app:

```bash
pm2 restart dfs-crm
```

---

## Post-Deployment Checklist

### Security

- [ ] Changed all demo user passwords
- [ ] Set strong `NEXTAUTH_SECRET` (64+ chars)
- [ ] SSL/HTTPS configured and working
- [ ] `NEXTAUTH_URL` set to HTTPS URL
- [ ] Database password is strong
- [ ] PostgreSQL not exposed to public internet
- [ ] Nginx security headers configured
- [ ] File upload directory has correct permissions
- [ ] Firewall configured (only ports 80, 443, 22 open)

### Functionality

- [ ] Login works for all roles
- [ ] Client registration and OTP email works
- [ ] KYC form submission works
- [ ] Document upload works
- [ ] Compliance review flow works
- [ ] Operations review flow works
- [ ] Notifications appear correctly
- [ ] PDF export works
- [ ] Password reset email works

### Monitoring

- [ ] PM2 configured with auto-restart
- [ ] PM2 startup configured for system reboot
- [ ] Database backups scheduled
- [ ] Nginx logs rotating (`/var/log/nginx/`)
- [ ] App logs accessible via `pm2 logs dfs-crm`

---

## Maintenance & Updates

### Deploying Updates

```bash
cd /var/www/dfs-crm

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Run new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart app
pm2 restart dfs-crm
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs dfs-crm

# Monitor resources
pm2 monit

# Restart
pm2 restart dfs-crm

# Stop
pm2 stop dfs-crm
```

### Database Maintenance

```bash
# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('dfs_crm'));"

# View active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'dfs_crm';"

# Vacuum (cleanup)
sudo -u postgres psql -d dfs_crm -c "VACUUM ANALYZE;"
```

---

## Troubleshooting

### App won't start

```bash
# Check logs
pm2 logs dfs-crm --lines 50

# Check if port 3000 is in use
lsof -i :3000

# Kill orphan processes
pm2 kill
pm2 start npm --name "dfs-crm" -- start
```

### Database connection failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U dfsuser -h localhost -d dfs_crm -c "SELECT 1;"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Emails not sending

```bash
# Test SMTP connection
openssl s_client -connect smtp.gmail.com:587 -starttls smtp

# Check SMTP variables
cat .env | grep SMTP

# Common Gmail issues:
# 1. 2FA must be enabled
# 2. Use App Password, not account password
# 3. Less secure apps must be allowed (or use App Password)
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check if port 3000 responds
curl http://localhost:3000

# Check Nginx config
sudo nginx -t

# Restart everything
pm2 restart dfs-crm
sudo systemctl restart nginx
```

### File uploads failing

```bash
# Check upload directory exists
ls -la /var/www/dfs-crm/uploads/

# Fix permissions
chown -R www-data:www-data /var/www/dfs-crm/uploads/
chmod -R 755 /var/www/dfs-crm/uploads/

# Check Nginx max upload size
grep client_max_body_size /etc/nginx/sites-available/dfs-crm
# Should be: client_max_body_size 10M;
```

### Migration errors

```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Force apply pending migrations
npx prisma migrate deploy
```

---

## Architecture Overview

```
Client Browser
       |
       v
   [Nginx] ──── SSL termination, reverse proxy, static files
       |
       v
   [Next.js App] ──── Port 3000, managed by PM2
       |
       v
   [PostgreSQL] ──── Database on localhost:5432
       |
       v
   [SMTP Server] ──── Gmail / SendGrid / Custom SMTP
```

### File Structure (Production)

```
/var/www/dfs-crm/
├── .env                 # Environment variables
├── .next/               # Built application
├── node_modules/        # Dependencies
├── prisma/              # Database schema & migrations
├── public/              # Static assets (logos, etc.)
├── src/                 # Source code
├── uploads/             # Uploaded KYC documents
│   ├── kyc-documents/
│   ├── proof-of-address/
│   └── aml-reports/
├── package.json
└── DEPLOYMENT.md        # This file
```

---

## Support

For issues with the DFS CRM platform:

1. Check application logs: `pm2 logs dfs-crm`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check database: `sudo -u postgres psql -d dfs_crm`

---

*Last updated: March 2026*
