from __future__ import annotations

import logging
import os
import shutil
import tarfile
import tempfile
import urllib.request
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import User
from ..schemas import NoteTreeNode

logger = logging.getLogger(__name__)


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


def build_notes_tree(root: Path, current: Path) -> NoteTreeNode:
    rel = "" if current == root else str(current.relative_to(root)).replace("\\", "/")
    node_type = "folder" if current.is_dir() else "file"
    node = NoteTreeNode(name=current.name if rel else "/", path=rel, type=node_type)
    if current.is_dir():
        children = sorted(current.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
        node.children = [build_notes_tree(root, child) for child in children]
    return node


def _safe_extract_tar(tar: tarfile.TarFile, destination: Path) -> None:
    destination_resolved = destination.resolve()
    for member in tar.getmembers():
        member_path = (destination / member.name).resolve()
        if member_path != destination_resolved and destination_resolved not in member_path.parents:
            raise HTTPException(status_code=400, detail="Archive contains unsafe paths")
    tar.extractall(destination)


def bootstrap_notes_from_github(user: User) -> bool:
    repo = os.getenv("NOTES_BOOTSTRAP_REPO", "").strip()
    token = os.getenv("GITHUB_TOKEN", "").strip()
    branch = os.getenv("NOTES_BOOTSTRAP_BRANCH", "master").strip() or "master"
    if not repo or not token:
        return False

    user_root = notes_root_for_user(user.id)
    if any(user_root.iterdir()):
        return True

    url = f"https://api.github.com/repos/{repo}/tarball/{branch}"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "ankie-web",
        },
    )
    with tempfile.TemporaryDirectory() as tmp_dir_name:
        tmp_dir = Path(tmp_dir_name)
        archive_path = tmp_dir / "notes.tar.gz"
        with urllib.request.urlopen(request, timeout=25) as resp:  # noqa: S310
            archive_path.write_bytes(resp.read())
        with tarfile.open(archive_path, "r:gz") as tar:
            _safe_extract_tar(tar, tmp_dir)
        extracted_roots = [p for p in tmp_dir.iterdir() if p.is_dir()]
        if not extracted_roots:
            return False
        source_root = extracted_roots[0]
        for child in source_root.iterdir():
            destination = user_root / child.name
            if destination.exists():
                continue
            if child.is_dir():
                shutil.copytree(child, destination)
            else:
                shutil.copy2(child, destination)
    return True


def ensure_notes_bootstrap_for_user(db: Session, user: User) -> None:
    root = notes_root_for_user(user.id)
    if any(root.iterdir()):
        return
    try:
        ok = bootstrap_notes_from_github(user)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Notes bootstrap failed for user %s: %s", user.id, exc)
        ok = False
    if ok and not user.notes_bootstrap_done:
        user.notes_bootstrap_done = True
        db.commit()
