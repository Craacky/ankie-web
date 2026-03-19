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


def admin_telegram_ids() -> set[int]:
    raw = os.getenv("ADMIN_TELEGRAM_IDS", "").strip()
    if not raw:
        return set()
    values: set[int] = set()
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        # Allow IDs that may include accidental non-digit chars (e.g. "id:123456")
        digits = "".join(ch for ch in item if ch.isdigit())
        if not digits:
            continue
        try:
            values.add(int(digits))
        except ValueError:
            continue
    return values


def telegram_admin_chat_id() -> str | None:
    raw = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "").strip()
    return raw or None


def request_log_retention_days() -> int:
    return max(1, env_int("REQUEST_LOG_RETENTION_DAYS", 14))


def alert_check_interval_seconds() -> int:
    return max(15, env_int("ALERT_CHECK_INTERVAL_SECONDS", 60))


def alert_window_seconds() -> int:
    return max(30, env_int("ALERT_WINDOW_SECONDS", 60))


def alert_requests_threshold() -> int:
    return max(10, env_int("ALERT_REQUESTS_THRESHOLD", 120))


def alert_error_threshold() -> int:
    return max(5, env_int("ALERT_ERROR_THRESHOLD", 30))
