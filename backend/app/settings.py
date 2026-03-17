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


def env_str(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None:
        return default
    return value


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return ["http://localhost:8080", "http://localhost:5173"]
    parts = [item.strip() for item in raw.split(",") if item.strip()]
    return parts or ["http://localhost:8080", "http://localhost:5173"]


def allow_cors_any() -> bool:
    return env_bool("ALLOW_CORS_ANY", False)


def enable_api_docs() -> bool:
    return env_bool("ENABLE_API_DOCS", True)


def disable_rate_limiting() -> bool:
    return env_bool("DISABLE_RATE_LIMITING", False)


def notes_upload_max_bytes() -> int:
    return env_int("NOTES_UPLOAD_MAX_BYTES", 5 * 1024 * 1024)


def collections_import_max_bytes() -> int:
    return env_int("COLLECTIONS_IMPORT_MAX_BYTES", 5 * 1024 * 1024)


def session_cleanup_interval_seconds() -> int:
    return max(30, env_int("SESSION_CLEANUP_INTERVAL_SECONDS", 300))


def csrf_cookie_name() -> str:
    return env_str("CSRF_COOKIE_NAME", "ankie_csrf")


def csrf_header_name() -> str:
    return env_str("CSRF_HEADER_NAME", "x-csrf-token")


def card_question_max_chars() -> int:
    return max(64, env_int("CARD_QUESTION_MAX_CHARS", 2000))


def card_answer_max_chars() -> int:
    return max(64, env_int("CARD_ANSWER_MAX_CHARS", 8000))


def allow_unsafe_notes_root() -> bool:
    return env_bool("ALLOW_UNSAFE_NOTES_ROOT", False)
