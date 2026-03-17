# Ankie Web

A self-hosted web app for studying flashcards in an Anki-like flow.

Import your own Q/A data from JSON, organize it into collections, study with flip-cards, and track progress. Designed for personal use, quick setup, and reliable Docker deployment.

## Why This Project

- You want a private flashcard trainer without accounts or cloud lock-in.
- You want to import your own knowledge base from files.
- You want a simple study loop with `Know / Don't Know` behavior and repeat logic.

## Features

- Telegram authentication with per-user isolated data.
- Create collections by uploading JSON + custom collection name.
- Sidebar with all collections and progress counters.
- Study mode with random order cards.
- Card flip interaction (question side / answer side).
- `Know` hides card until progress reset.
- `Don't Know` requeues card later in the same session (random interval).
- Reset collection progress and restart from scratch.
- Collection status: automatically marked as mastered when all cards are known.
- Edit and delete cards.
- Delete collections.
- Export collections to JSON.
- Markdown notes tree with create/rename/delete/upload and live preview.
- Light and dark themes.
- Persistent storage with SQLite in Docker volume.
  
## Preview
<img width="1633" height="948" alt="image" src="https://github.com/user-attachments/assets/5fc865a2-e971-4055-ac17-918182f27980" />

## JSON Import Format

Supported formats:

```json
[
  { "question": "What is 2+2?", "answer": "4" }
]
```

```json
{
  "cards": [
    { "q": "What is 2+2?", "a": "4" }
  ]
}
```

## Tech Stack

- Frontend: React + Vite + Tailwind + shadcn-style UI primitives.
- Backend: FastAPI + SQLAlchemy.
- Database: SQLite.
- Reverse proxy / TLS (production): Caddy.
- Containers: Docker + Docker Compose.

## Project Structure

```text
backend/
  app/api/                FastAPI routers (auth, notes, library)
  app/services/           Service-layer business logic
  app/dependencies.py     Auth/session dependencies
  app/startup.py          Startup schema/index bootstrap
frontend/
  src/components/         UI components and dialogs
  src/hooks/              Feature hooks (state + effects)
  src/features/           Feature utilities
scripts/                  Utility scripts (backup/restore, data prep)
docker-compose.yml        Local/dev compose
docker-compose.prod.yml   Production compose with Caddy + HTTPS
Caddyfile                 Reverse proxy and TLS config
```

## Runtime Configuration

Important backend environment variables:

- `CORS_ORIGINS` (comma-separated origins, default: `http://localhost:8080,http://localhost:5173`)
- `SESSION_TTL_DAYS` (session cookie TTL)
- `SESSION_CLEANUP_INTERVAL_SECONDS` (expired sessions cleanup interval)
- `NOTES_ROOT`
- `NOTES_UPLOAD_MAX_BYTES` (max uploaded note file size, default 5MB)
- `COLLECTIONS_IMPORT_MAX_BYTES` (max JSON import size, default 5MB)
- `COOKIE_SECURE` (should be `true` in production)
- `ENABLE_API_DOCS` (expose Swagger/Redoc)
- `ALLOW_CORS_ANY` (allow `*` origins; should be `false` in production)
- `DISABLE_RATE_LIMITING` (disable API rate limits)
- `ALLOW_UNSAFE_NOTES_ROOT` (allow notes path outside `/data/notes`)
- `CARD_QUESTION_MAX_CHARS` and `CARD_ANSWER_MAX_CHARS`

## Local Development (Docker)

```bash
docker compose up --build
```

Endpoints:

- App UI: `http://localhost:8080`
- API: `http://localhost:8000/api`

## Production on VPS (HTTPS)

### 1. Install dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git ufw
sudo systemctl enable --now docker
```

### 2. Clone repository

```bash
git clone <YOUR_REPO_URL> ankie-web
cd ankie-web
```

### 3. Configure domain and ACME email

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

- `DOMAIN`: domain pointing to your VPS IP.
- `ACME_EMAIL`: email for Let's Encrypt notifications.

### 4. Run production stack

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 5. Open firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 6. Update deployment

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Data Persistence

Study data is stored in SQLite at `/data/ankie.db` inside the backend container.

In Docker, this is persisted via volume `ankie_data`, so data survives container restarts/redeploys.

## Backup and Restore

### Backup volume

```bash
./scripts/backup_volume.sh
```

Optional explicit volume:

```bash
./scripts/backup_volume.sh <volume_name>
```

### Restore volume

```bash
./scripts/restore_volume.sh backups/ankie_data_YYYYMMDD_HHMMSS.tar.gz
```

Optional explicit volume:

```bash
./scripts/restore_volume.sh backups/ankie_data_YYYYMMDD_HHMMSS.tar.gz <volume_name>
```

## Security Notes

- Use HTTPS (`COOKIE_SECURE=true`) and strict `CORS_ORIGINS` in production.
- CSRF protection is enforced for unsafe methods; frontend sends `X-CSRF-Token` from cookie.
- Notes bootstrap archive extraction is path-validated for safety.
- File upload/import limits are configurable via env vars.
- Telegram auth credentials must be kept private.
- Recommended for internet-facing setups:
  - Use strong firewall rules.
  - Keep server packages and Docker images updated.
  - Restrict access by IP or VPN if possible.

## License
MIT
