from __future__ import annotations

import mimetypes
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from starlette.datastructures import UploadFile as StarletteUploadFile
from fastapi.responses import FileResponse
from ..dependencies import get_current_user
from ..limiter import limiter
from ..models import User
from ..schemas import MessageOut, NoteFileCreate, NoteFileOut, NoteFileUpdate, NoteFolderCreate, NotePathRename, NoteTreeNode
from ..services.notes import list_notes_children, notes_root_for_user, resolve_user_note_path
from ..settings import notes_upload_max_bytes
from ..utils.uploads import read_upload_with_limit

router = APIRouter()


@router.get("/notes/tree", response_model=list[NoteTreeNode])
@limiter.limit("60/minute")
def notes_tree(request: Request, path: str = "", current_user: User = Depends(get_current_user)) -> list[NoteTreeNode]:
    root = notes_root_for_user(current_user.id)
    target = resolve_user_note_path(root, path, allow_missing=True) if path else root
    if target.exists() and not target.is_dir():
        raise HTTPException(status_code=400, detail="Target is not a folder")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    return list_notes_children(root, target)


@router.get("/notes/file", response_model=NoteFileOut)
@limiter.limit("60/minute")
def read_note_file(request: Request, path: str, current_user: User = Depends(get_current_user)) -> NoteFileOut:
    root = notes_root_for_user(current_user.id)
    file_path = resolve_user_note_path(root, path)
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Target is not a file")
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="File is not UTF-8 text") from exc
    rel_path = str(file_path.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=file_path.name, content=content)


@router.put("/notes/file", response_model=NoteFileOut)
@limiter.limit("60/minute")
def update_note_file(request: Request, payload: NoteFileUpdate, current_user: User = Depends(get_current_user)) -> NoteFileOut:
    root = notes_root_for_user(current_user.id)
    file_path = resolve_user_note_path(root, payload.path, allow_missing=True)
    if file_path.exists() and not file_path.is_file():
        raise HTTPException(status_code=400, detail="Target path is not a file")
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(payload.content, encoding="utf-8")
    rel_path = str(file_path.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=file_path.name, content=payload.content)


@router.post("/notes/file", response_model=NoteFileOut)
@limiter.limit("30/minute")
def create_note_file(request: Request, payload: NoteFileCreate, current_user: User = Depends(get_current_user)) -> NoteFileOut:
    root = notes_root_for_user(current_user.id)
    parent = resolve_user_note_path(root, payload.parent_path, allow_missing=True)
    if parent.exists() and not parent.is_dir():
        raise HTTPException(status_code=400, detail="Parent path is not a folder")
    parent.mkdir(parents=True, exist_ok=True)
    filename = payload.name.strip()
    if not filename:
        raise HTTPException(status_code=400, detail="File name cannot be empty")
    file_path = resolve_user_note_path(root, str((parent / filename).relative_to(root)), allow_missing=True)
    if file_path.exists():
        raise HTTPException(status_code=409, detail="File already exists")
    file_path.write_text(payload.content, encoding="utf-8")
    rel_path = str(file_path.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=file_path.name, content=payload.content)


@router.post("/notes/folder", response_model=MessageOut)
@limiter.limit("30/minute")
def create_note_folder(request: Request, payload: NoteFolderCreate, current_user: User = Depends(get_current_user)) -> MessageOut:
    root = notes_root_for_user(current_user.id)
    parent = resolve_user_note_path(root, payload.parent_path, allow_missing=True)
    if parent.exists() and not parent.is_dir():
        raise HTTPException(status_code=400, detail="Parent path is not a folder")
    parent.mkdir(parents=True, exist_ok=True)
    folder_name = payload.name.strip()
    if not folder_name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")
    folder_path = resolve_user_note_path(root, str((parent / folder_name).relative_to(root)), allow_missing=True)
    if folder_path.exists():
        raise HTTPException(status_code=409, detail="Folder already exists")
    folder_path.mkdir(parents=True, exist_ok=False)
    return MessageOut(message="Folder created")


@router.post("/notes/upload", response_model=NoteFileOut)
@limiter.limit("10/minute")
async def upload_note_file(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> NoteFileOut:
    form = await request.form()
    parent_path = form.get("parent_path") or ""
    file = form.get("file")
    if not isinstance(parent_path, str):
        parent_path = ""
    if not isinstance(file, (UploadFile, StarletteUploadFile)):
        raise HTTPException(status_code=422, detail="file is required")
    root = notes_root_for_user(current_user.id)
    parent = resolve_user_note_path(root, parent_path, allow_missing=True)
    if parent.exists() and not parent.is_dir():
        raise HTTPException(status_code=400, detail="Parent path is not a folder")
    parent.mkdir(parents=True, exist_ok=True)
    filename = Path(file.filename or "").name.strip()
    if not filename:
        raise HTTPException(status_code=400, detail="File name cannot be empty")
    target = resolve_user_note_path(root, str((parent / filename).relative_to(root)), allow_missing=True)
    if target.exists():
        raise HTTPException(status_code=409, detail="File already exists")
    data = await read_upload_with_limit(file, notes_upload_max_bytes())
    try:
        text_data = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Only UTF-8 text files are supported") from exc
    target.write_text(text_data, encoding="utf-8")
    rel_path = str(target.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=target.name, content=text_data)


@router.patch("/notes/path", response_model=MessageOut)
@limiter.limit("30/minute")
def rename_note_path(request: Request, payload: NotePathRename, current_user: User = Depends(get_current_user)) -> MessageOut:
    root = notes_root_for_user(current_user.id)
    source = resolve_user_note_path(root, payload.path)
    new_name = payload.new_name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="New name cannot be empty")
    if "/" in new_name or "\\" in new_name:
        raise HTTPException(status_code=400, detail="New name cannot contain path separators")
    target = source.parent / new_name
    target = resolve_user_note_path(root, str(target.relative_to(root)), allow_missing=True)
    if target.exists():
        raise HTTPException(status_code=409, detail="Target already exists")
    source.rename(target)
    return MessageOut(message="Path renamed")


@router.delete("/notes/path", response_model=MessageOut)
@limiter.limit("30/minute")
def delete_note_path(request: Request, path: str, current_user: User = Depends(get_current_user)) -> MessageOut:
    root = notes_root_for_user(current_user.id)
    target = resolve_user_note_path(root, path)
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return MessageOut(message="Path deleted")


@router.get("/notes/raw")
@limiter.limit("60/minute")
def read_note_raw(request: Request, path: str, current_user: User = Depends(get_current_user)) -> FileResponse:
    root = notes_root_for_user(current_user.id)
    file_path = resolve_user_note_path(root, path)
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Target is not a file")
    media_type, _ = mimetypes.guess_type(file_path.name)
    return FileResponse(file_path, media_type=media_type or "application/octet-stream")
