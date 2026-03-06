from __future__ import annotations

import mimetypes
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import MessageOut, NoteFileCreate, NoteFileOut, NoteFileUpdate, NoteFolderCreate, NotePathRename, NoteTreeNode
from ..services.notes import (
    build_notes_tree,
    ensure_notes_bootstrap_for_user,
    notes_root_for_user,
    resolve_user_note_path,
)
from ..settings import notes_upload_max_bytes

router = APIRouter()


@router.get("/notes/tree", response_model=list[NoteTreeNode])
def notes_tree(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[NoteTreeNode]:
    ensure_notes_bootstrap_for_user(db, current_user)
    root = notes_root_for_user(current_user.id)
    children = sorted(root.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
    return [build_notes_tree(root, child) for child in children]


@router.get("/notes/file", response_model=NoteFileOut)
def read_note_file(path: str, current_user: User = Depends(get_current_user)) -> NoteFileOut:
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
def update_note_file(payload: NoteFileUpdate, current_user: User = Depends(get_current_user)) -> NoteFileOut:
    root = notes_root_for_user(current_user.id)
    file_path = resolve_user_note_path(root, payload.path, allow_missing=True)
    if file_path.exists() and not file_path.is_file():
        raise HTTPException(status_code=400, detail="Target path is not a file")
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(payload.content, encoding="utf-8")
    rel_path = str(file_path.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=file_path.name, content=payload.content)


@router.post("/notes/file", response_model=NoteFileOut)
def create_note_file(payload: NoteFileCreate, current_user: User = Depends(get_current_user)) -> NoteFileOut:
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
def create_note_folder(payload: NoteFolderCreate, current_user: User = Depends(get_current_user)) -> MessageOut:
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
async def upload_note_file(
    parent_path: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> NoteFileOut:
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
    data = await file.read()
    if len(data) > notes_upload_max_bytes():
        raise HTTPException(status_code=413, detail="Uploaded file is too large")
    try:
        text_data = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Only UTF-8 text files are supported") from exc
    target.write_text(text_data, encoding="utf-8")
    rel_path = str(target.relative_to(root)).replace("\\", "/")
    return NoteFileOut(path=rel_path, name=target.name, content=text_data)


@router.patch("/notes/path", response_model=MessageOut)
def rename_note_path(payload: NotePathRename, current_user: User = Depends(get_current_user)) -> MessageOut:
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
def delete_note_path(path: str, current_user: User = Depends(get_current_user)) -> MessageOut:
    root = notes_root_for_user(current_user.id)
    target = resolve_user_note_path(root, path)
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return MessageOut(message="Path deleted")


@router.get("/notes/raw")
def read_note_raw(path: str, current_user: User = Depends(get_current_user)) -> FileResponse:
    root = notes_root_for_user(current_user.id)
    file_path = resolve_user_note_path(root, path)
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Target is not a file")
    media_type, _ = mimetypes.guess_type(file_path.name)
    return FileResponse(file_path, media_type=media_type or "application/octet-stream")
