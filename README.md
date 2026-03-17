# Ankie Web

Self-hosted flashcards + notes web app with Telegram login, offline-friendly study flow, and an admin monitoring dashboard.

## Highlights

- Telegram authentication with per-user isolated data.
- Collections and cards with `Know / Don't Know` study loop.
- Notes workspace with folders, markdown preview, and uploads.
- Admin dashboard with request monitoring, alerts, and bans.
- SQLite persistence with Docker volumes.
- Caddy reverse proxy with HTTPS.

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: FastAPI + SQLAlchemy
- Database: SQLite
- Proxy/TLS: Caddy
- Deployment: Docker + Docker Compose

## JSON Import Format

```json
[
  { "question": "What is 2+2?", "answer": "4", "markdown": false }
]
```

```json
{
  "cards": [
    { "q": "What is 2+2?", "a": "4" }
  ]
}
```

## Markdown Import Format

Upload a `.md` file where each card starts with `## Question` and the answer is all content until the next `##`.

```md
# Optional Title

## What is 2+2?
The answer is **4**.

## Another question
Answer supports Markdown, lists, code, etc.
```

## Local Development (Docker)

```bash
docker compose up --build
```

Endpoints:

- UI: `http://localhost:8080`
- API: `http://localhost:8000/api`

## Production (VPS + Caddy)

1. Install dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git ufw
sudo systemctl enable --now docker
```

2. Clone and configure:

```bash
git clone <YOUR_REPO_URL> ankie-web
cd ankie-web
cp .env.production.example .env.production
```

3. Edit `.env.production`:

- `DOMAIN` and `ACME_EMAIL`
- `TELEGRAM_BOT_USERNAME` and `TELEGRAM_BOT_TOKEN`
- `ADMIN_TELEGRAM_IDS` and `TELEGRAM_ADMIN_CHAT_ID`

4. Run production:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

5. Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## GitHub Actions Deployment

The repo includes `.github/workflows/deploy.yml` for SSH-based deploy on push to `main`.

Required GitHub Secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PATH`

## Admin Dashboard

The Admin tab appears only for users in `ADMIN_TELEGRAM_IDS` (env allowlist). It shows:

- Request counts, errors, and last seen.
- Recent alerts and request logs.
- Ban and unban controls.

Alerts are sent to `TELEGRAM_ADMIN_CHAT_ID` when thresholds are exceeded.

## Security Model

- CSRF protection on unsafe methods.
- Rate limiting on API endpoints.
- Request logging with IP + user_id.
- Notes root restricted to `/data/notes` by default.
- Caddy adds HSTS, CSP, and secure headers.

## Key Environment Variables

- `CORS_ORIGINS`
- `SESSION_TTL_DAYS`
- `SESSION_CLEANUP_INTERVAL_SECONDS`
- `COOKIE_SECURE`
- `ENABLE_API_DOCS`
- `ALLOW_CORS_ANY`
- `DISABLE_RATE_LIMITING`
- `ALLOW_UNSAFE_NOTES_ROOT`
- `NOTES_ROOT`
- `NOTES_UPLOAD_MAX_BYTES`
- `COLLECTIONS_IMPORT_MAX_BYTES`
- `CARD_QUESTION_MAX_CHARS`
- `CARD_ANSWER_MAX_CHARS`
- `ADMIN_TELEGRAM_IDS`
- `TELEGRAM_ADMIN_CHAT_ID`
- `REQUEST_LOG_RETENTION_DAYS`
- `ALERT_CHECK_INTERVAL_SECONDS`
- `ALERT_WINDOW_SECONDS`
- `ALERT_REQUESTS_THRESHOLD`
- `ALERT_ERROR_THRESHOLD`

## Data Persistence

SQLite database path in container: `/data/ankie.db`. Stored in Docker volume `ankie_data`.

## Backup and Restore

```bash
./scripts/backup_volume.sh
./scripts/restore_volume.sh backups/ankie_data_YYYYMMDD_HHMMSS.tar.gz
```

## License

MIT
