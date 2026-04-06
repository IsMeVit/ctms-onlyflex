# CTMS - Cinema Ticketing Management System

A full-stack cinema booking system built with Next.js 16, TypeScript, Tailwind CSS, and Prisma.

## Features

- Movie management
- Showtime scheduling
- Seat booking system
- User authentication (NextAuth.js)
- Admin dashboard
- Customer booking flow

## Prerequisites

- Docker installed on server
- SSH access to server
- Git

## Quick Deploy

### 1. SSH into Server

```bash
ssh vit@86.48.3.217
```

### 2. Navigate to Project

```bash
cd /home/vit/ctms-onlyflex
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit `.env` with your settings:

```
POSTGRES_PASSWORD=your_strong_password
AUTH_SECRET=run_locally: openssl rand -base64 32
APP_URL=http://86.48.3.217:3000
```

### 4. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp
sudo ufw enable
```

### 5. Deploy

```bash
docker compose up -d --build
```

### 6. Run Database Migrations

```bash
docker compose exec app npx prisma migrate deploy
```

### 7. Access Application

```
http://86.48.3.217:3000
```

## Troubleshooting

### Check Container Status

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs -f        # All logs
docker compose logs -f app    # App logs only
docker compose logs -f db     # Database logs
```

### Restart Services

```bash
docker compose restart        # Restart all
docker compose restart app    # Restart app only
```

### Rebuild and Redeploy

```bash
git pull
docker compose up -d --build
```

### Stop Services

```bash
docker compose down           # Stop but keep data
docker compose down -v        # Stop and delete data (WARNING!)
```

### Access Database

```bash
docker compose exec db psql -U postgres -d moviedb
```

## Future: Adding HTTPS & Domain

### 1. Buy a Domain

Purchase from providers like:
- Namecheap
- GoDaddy
- Google Domains

### 2. Point Domain to Server

Add DNS A record:
- **Host:** @ (or subdomain)
- **Value:** 86.48.3.217

### 3. Install SSL Certificate

```bash
apt update
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### 4. Update APP_URL

Edit `.env`:
```
APP_URL=https://yourdomain.com
```

Then redeploy:
```bash
docker compose up -d --build
```

## Admin Access

1. Visit `http://86.48.3.217/admin/login`
2. Credentials are set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `DATABASE_URL` | Full connection string |
| `AUTH_SECRET` | NextAuth session secret |
| `APP_URL` | Application URL |

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL 16
- **Auth:** NextAuth.js v5
- **Container:** Docker, Docker Compose

## License

Private - All rights reserved
