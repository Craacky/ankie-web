from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException
from ..schemas import NoteTreeNode
from ..settings import allow_unsafe_notes_root


def notes_root_for_user(user_id: int) -> Path:
    base = Path(os.getenv("NOTES_ROOT", "/data/notes"))
    safe_root = Path("/data/notes").resolve()
    base_resolved = base.resolve()
    if not allow_unsafe_notes_root():
        if base_resolved != safe_root and safe_root not in base_resolved.parents:
            raise HTTPException(
                status_code=503, detail="NOTES_ROOT must be under /data/notes"
            )
    root = (base_resolved / str(user_id)).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve_user_note_path(
    root: Path, rel_path: str, allow_missing: bool = False
) -> Path:
    normalized = (rel_path or "").strip().lstrip("/")
    if normalized == "":
        return root

    # Check for dangerous path components
    path_parts = normalized.split("/")
    for part in path_parts:
        if part in ("", ".", "..") or "\x00" in part:
            raise HTTPException(status_code=400, detail="Invalid path component")

    target = (root / normalized).resolve()

    try:
        root_resolved = root.resolve()
        target_resolved = target.resolve()
    except OSError:
        raise HTTPException(status_code=400, detail="Invalid path")

    # Check for symlinks
    try:
        if target.exists() and target.is_symlink():
            raise HTTPException(status_code=400, detail="Symlinks are not allowed")
    except OSError:
        pass

    # Verify target is under root
    if target_resolved != root_resolved:
        try:
            is_under = root_resolved in target_resolved.parents or str(
                target_resolved
            ).startswith(str(root_resolved) + os.sep)
        except ValueError:
            is_under = False
        if not is_under:
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
    try:
        is_dir = current.is_dir()
    except OSError:
        return NoteTreeNode(name=current.name, path="", type="file", has_children=False)

    rel = "" if current == root else str(current.relative_to(root)).replace("\\", "/")
    node_type = "folder" if is_dir else "file"
    node = NoteTreeNode(
        name=current.name if rel else "/",
        path=rel,
        type=node_type,
        has_children=_has_children(current) if is_dir else False,
    )
    if recursive and is_dir:
        try:
            children = sorted(
                current.iterdir(), key=lambda p: (p.is_file(), p.name.lower())
            )
        except OSError:
            children = []
        node.children = [
            build_notes_tree(root, child, recursive=True) for child in children
        ]
    return node


def list_notes_children(root: Path, current: Path) -> list[NoteTreeNode]:
    try:
        children = sorted(
            current.iterdir(), key=lambda p: (p.is_file(), p.name.lower())
        )
    except OSError:
        children = []
    return [build_notes_tree(root, child, recursive=False) for child in children]
