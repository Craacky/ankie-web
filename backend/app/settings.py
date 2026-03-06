from __future__ import annotations

import os


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return ["http://localhost:8080", "http://localhost:5173"]
    parts = [item.strip() for item in raw.split(",") if item.strip()]
    return parts or ["http://localhost:8080", "http://localhost:5173"]


def notes_upload_max_bytes() -> int:
    return env_int("NOTES_UPLOAD_MAX_BYTES", 5 * 1024 * 1024)


def collections_import_max_bytes() -> int:
    return env_int("COLLECTIONS_IMPORT_MAX_BYTES", 5 * 1024 * 1024)


def session_cleanup_interval_seconds() -> int:
    return max(30, env_int("SESSION_CLEANUP_INTERVAL_SECONDS", 300))
