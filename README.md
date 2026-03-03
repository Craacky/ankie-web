# Ankie Web

A self-hosted, no-auth web app for studying flashcards in an Anki-like flow.

Import your own Q/A data from JSON, organize it into collections, study with flip-cards, and track progress. Designed for personal use, quick setup, and reliable Docker deployment.

## Why This Project

- You want a private flashcard trainer without accounts or cloud lock-in.
- You want to import your own knowledge base from files.
- You want a simple study loop with `Know / Don't Know` behavior and repeat logic.

## Features

- No authentication, single-user friendly workflow.
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
backend/                  FastAPI app
frontend/                 React app
scripts/                  Utility scripts (backup/restore, data prep)
Sources/                  Source learning materials
Sources/PreloadCollections Generated JSON collections
docker-compose.yml        Local/dev compose
docker-compose.prod.yml   Production compose with Caddy + HTTPS
Caddyfile                 Reverse proxy and TLS config
```

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

## Preparing Collections from Markdown Sources

This project includes a converter that builds import-ready JSON collections from markdown files in `Sources/Theory`.

Run:

```bash
python3 scripts/prepare_collections.py
```

Output:

- JSON collections: `Sources/PreloadCollections/**/*.json`
- Manifest: `Sources/PreloadCollections/collections-manifest.json`

## Security Notes

- This app is intentionally no-auth for personal/private use.
- Do not expose it publicly without access controls.
- Recommended for internet-facing setups:
  - Use strong firewall rules.
  - Keep server packages and Docker images updated.
  - Restrict access by IP or VPN if possible.

## License
MIT
