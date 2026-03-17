from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException
from ..schemas import NoteTreeNode


def notes_root_for_user(user_id: int) -> Path:
    base = Path(os.getenv("NOTES_ROOT", "/data/notes"))
    root = (base / str(user_id)).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve_user_note_path(root: Path, rel_path: str, allow_missing: bool = False) -> Path:
    normalized = (rel_path or "").strip().lstrip("/")
    target = (root / normalized).resolve()
    if target != root and root not in target.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    if not allow_missing and not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    return target


def _has_children(path: Path) -> bool:
    try:
        return any(path.iterdir())
    except OSError:
        return False


def build_notes_tree(root: Path, current: Path, recursive: bool = True) -> NoteTreeNode:
    rel = "" if current == root else str(current.relative_to(root)).replace("\\", "/")
    node_type = "folder" if current.is_dir() else "file"
    node = NoteTreeNode(
        name=current.name if rel else "/",
        path=rel,
        type=node_type,
        has_children=_has_children(current) if current.is_dir() else False,
    )
    if recursive and current.is_dir():
        children = sorted(current.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        node.children = [build_notes_tree(root, child, recursive=True) for child in children]
    return node


def list_notes_children(root: Path, current: Path) -> list[NoteTreeNode]:
    children = sorted(current.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
    return [build_notes_tree(root, child, recursive=False) for child in children]
