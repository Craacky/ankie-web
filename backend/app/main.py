from __future__ import annotations

import asyncio
import logging
import secrets
import time
from contextlib import asynccontextmanager, suppress
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .api.admin import router as admin_router
from .api.auth import router as auth_router
from .api.library import router as library_router
from .api.notes import router as notes_router
from .database import SessionLocal
from .limiter import limiter
from .services.auth import SESSION_COOKIE_NAME
from .services.admin import is_banned, record_request_log, resolve_user_id_from_session
from .settings import allow_cors_any, cors_origins, csrf_cookie_name, csrf_header_name, disable_rate_limiting, enable_api_docs
from .startup import admin_monitor_loop, run_migrations, session_cleanup_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    run_migrations()
    cleanup_task = asyncio.create_task(session_cleanup_loop())
    admin_task = asyncio.create_task(admin_monitor_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        admin_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task
        with suppress(asyncio.CancelledError):
            await admin_task


docs_enabled = enable_api_docs()
app = FastAPI(
    title="Ankie Web API",
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

origins = cors_origins()
if "*" in origins and not allow_cors_any():
    raise RuntimeError("CORS_ORIGINS cannot include '*' in production. Set ALLOW_CORS_ANY=true to override.")
allow_credentials = origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)
limiter.enabled = not disable_rate_limiting()
app.state.limiter = limiter
if limiter.enabled:
    app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}))
    app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    start = time.monotonic()
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = None
    ip = request.client.host if request.client else None
    if session_token:
        with SessionLocal() as db:
            user_id = resolve_user_id_from_session(db, session_token)
            if is_banned(db, user_id, ip):
                return JSONResponse(status_code=403, content={"detail": "Access denied"})
    else:
        with SessionLocal() as db:
            if is_banned(db, None, ip):
                return JSONResponse(status_code=403, content={"detail": "Access denied"})
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.monotonic() - start) * 1000
        logger.info(
            "request_id=%s method=%s path=%s status=error duration_ms=%.2f ip=%s",
            request_id,
            request.method,
            request.url.path,
            duration_ms,
            request.client.host if request.client else "unknown",
        )
        raise
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%.2f ip=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request.client.host if request.client else "unknown",
    )
    try:
        with SessionLocal() as db:
            record_request_log(
                db,
                user_id=user_id,
                ip=ip,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=int(duration_ms),
                request_id=request_id,
                user_agent=request.headers.get("user-agent"),
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to record request log: %s", exc)
    response.headers["x-request-id"] = request_id
    return response


@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        session_cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if session_cookie:
            csrf_cookie = request.cookies.get(csrf_cookie_name())
            csrf_header = request.headers.get(csrf_header_name())
            if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
                return JSONResponse(status_code=403, content={"detail": "CSRF token missing or invalid"})
    return await call_next(request)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
app.include_router(auth_router, prefix="/api")
app.include_router(notes_router, prefix="/api")
app.include_router(library_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
