from __future__ import annotations

from fastapi import HTTPException, UploadFile


async def read_upload_with_limit(upload: UploadFile, max_bytes: int, chunk_size: int = 1024 * 1024) -> bytes:
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="Uploaded file is too large")
        chunks.append(chunk)
    return b"".join(chunks)
