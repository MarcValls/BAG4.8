"""handlers_files.py \u2014 file listing + read endpoints for the BAGO HTTP bridge.

GET /files/list              \u2014 walk the project's base_path
GET /files/read/<path>       \u2014 read a single file (UTF-8 with replace)

Both endpoints are sandboxed to `session_mgr.base_path`; the read
endpoint rejects any path that escapes that root.
"""

from __future__ import annotations
import os
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.parse import unquote

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler


_SKIP_DIRS = {"node_modules", ".git", "__pycache__", "dist", "build"}


def _mgr(handler):
    from api_state import get_mgr
    return get_mgr(handler)


def handle_list(handler):
    from api_serializers import send_json
    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    base = Path(getattr(mgr, "workspace_mirror_root", getattr(mgr, "base_path", Path.cwd()))).resolve()
    try:
        entries = []
        for root, dirs, files in os.walk(base):
            rel_root = Path(root).relative_to(base)
            for d in sorted(dirs):
                entries.append({
                    "path": str(rel_root / d).replace("\\", "/"),
                    "name": d,
                    "type": "directory",
                })
            for f in sorted(files):
                entries.append({
                    "path": str(rel_root / f).replace("\\", "/"),
                    "name": f,
                    "type": "file",
                })
            dirs[:] = [d for d in dirs if d not in _SKIP_DIRS]
        send_json(handler, 200, {"ok": True, "base_path": str(base), "workspace_mirror_root": str(base), "workspace_scope_root": str(getattr(mgr, "workspace_scope_root", "")), "workspace_id": str(getattr(mgr, "workspace_id", "")), "entries": entries})
    except Exception as exc:
        send_json(handler, 500, {"ok": False, "state": "failed", "error_code": "FILES_LIST_FAILED", "message": f"Error listando archivos: {exc}"})


def handle_read(handler, file_path: str):
    from api_serializers import send_json
    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "state": "blocked", "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return
    base = Path(getattr(mgr, "workspace_mirror_root", getattr(mgr, "base_path", Path.cwd()))).resolve()
    raw_path = unquote(file_path)
    target = (base / raw_path).resolve()
    try:
        target.relative_to(base)
    except ValueError:
        send_json(handler, 403, {"ok": False, "state": "blocked", "error_code": "PATH_OUT_OF_SCOPE", "message": "La ruta está fuera del alcance autorizado.", "path": raw_path, "workspace_mirror_root": str(base)})
        return
    if not target.is_file():
        send_json(handler, 404, {"ok": False, "state": "blocked", "error_code": "FILE_NOT_FOUND", "message": "Archivo no encontrado", "path": raw_path, "workspace_mirror_root": str(base)})
        return
    try:
        content = target.read_text(encoding="utf-8", errors="replace")
        send_json(handler, 200, {
            "ok": True,
            "path": raw_path,
            "absolute_path": str(target),
            "workspace_id": str(getattr(mgr, "workspace_id", "")),
            "workspace_mirror_root": str(base),
            "hash": "",
            "content": content,
            "encoding": "utf-8",
            "size": target.stat().st_size,
        })
    except OSError as exc:
        send_json(handler, 500, {"ok": False, "state": "failed", "error_code": "FILE_READ_FAILED", "message": f"Error leyendo archivo: {exc}", "path": raw_path, "workspace_mirror_root": str(base)})


_WRITE_FORBIDDEN = {".git", ".env", "state", "dist", "release", "__pycache__", "node_modules", ".venv", "venv"}


def _resolve_write_root(mgr) -> "Path":
    """Resolve the best available writable root from the session manager.
    Prefers project_root. Skips temp/AppData mirror paths."""
    import tempfile, os
    _tmp = Path(tempfile.gettempdir()).resolve()
    _appdata = Path(os.environ.get("APPDATA", "")).resolve() if os.environ.get("APPDATA") else None
    _localappdata = Path(os.environ.get("LOCALAPPDATA", "")).resolve() if os.environ.get("LOCALAPPDATA") else None

    def _is_temp(p: Path) -> bool:
        try:
            p.relative_to(_tmp)
            return True
        except ValueError:
            pass
        if _appdata:
            try:
                p.relative_to(_appdata)
                return True
            except ValueError:
                pass
        if _localappdata:
            try:
                p.relative_to(_localappdata)
                return True
            except ValueError:
                pass
        return False

    for attr in ("project_root", "workspace_scope_root", "workspace_mirror_root", "base_path"):
        val = getattr(mgr, attr, None)
        if val:
            p = Path(str(val)).resolve()
            if p.exists() and not _is_temp(p):
                return p
    return Path.cwd().resolve()


def handle_write(handler, body: dict):
    """POST /files/write - write a file to the active project root."""
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "error_code": "SESSION_MANAGER_MISSING", "message": "SessionManager no disponible"})
        return

    raw_path = str(body.get("path") or "").strip()
    content = body.get("content") or ""

    if not raw_path:
        send_json(handler, 400, {"ok": False, "error_code": "MISSING_PATH", "message": "Campo 'path' requerido"})
        return

    # Sandbox check
    normalized = raw_path.replace("\\", "/").lower()
    for seg in _WRITE_FORBIDDEN:
        if seg.lower() in normalized.split("/"):
            send_json(handler, 403, {"ok": False, "error_code": "FORBIDDEN_PATH", "message": f"Ruta no permitida: {raw_path}"})
            return

    base = _resolve_write_root(mgr)
    target_raw = Path(raw_path)
    if not target_raw.is_absolute():
        target = (base / target_raw).resolve()
    else:
        target = target_raw.resolve()

    try:
        target.relative_to(base)
    except ValueError:
        send_json(handler, 403, {"ok": False, "error_code": "PATH_OUT_OF_SCOPE", "message": "La ruta está fuera del proyecto activo.", "path": raw_path, "project_root": str(base)})
        return

    existed = target.exists()
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(str(content), encoding="utf-8")
    except OSError as exc:
        send_json(handler, 500, {"ok": False, "error_code": "WRITE_FAILED", "message": f"Error escribiendo archivo: {exc}", "path": raw_path})
        return

    try:
        rel = str(target.relative_to(base))
    except ValueError:
        rel = str(target)

    send_json(handler, 200, {
        "ok": True,
        "path": rel,
        "absolute_path": str(target),
        "project_root": str(base),
        "created": not existed,
        "overwritten": existed,
        "bytes_written": len(str(content).encode("utf-8")),
    })

