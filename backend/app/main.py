from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth import router as auth_router
from .api.library import router as library_router
from .api.notes import router as notes_router
from .settings import cors_origins
from .startup import run_startup_migrations

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Ankie Web API")

origins = cors_origins()
allow_credentials = origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    run_startup_migrations()


app.include_router(auth_router, prefix="/api")
app.include_router(notes_router, prefix="/api")
app.include_router(library_router, prefix="/api")
