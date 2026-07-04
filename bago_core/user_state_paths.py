from __future__ import annotations

import os
from pathlib import Path

USER_ROOT_ENV = "BAGO_USER_ROOT"
STATE_ROOT_ENV = "BAGO_STATE_ROOT"
RUNTIME_ROOT_ENV = "BAGO_RUNTIME_ROOT"


def _env_path(name: str) -> Path | None:
    value = os.environ.get(name, "").strip()
    if not value:
        return None
    return Path(value).expanduser().resolve()


def legacy_user_root() -> Path:
    return user_root()


def user_root() -> Path:
    override = _env_path(USER_ROOT_ENV)
    if override is not None:
        return override
    local = os.environ.get("LOCALAPPDATA", "").strip()
    if local:
        return Path(local).expanduser().resolve() / "BAGO"
    return Path.home() / "AppData" / "Local" / "BAGO"


def runtime_root() -> Path:
    override = _env_path(RUNTIME_ROOT_ENV)
    return override if override is not None else user_root() / "runtime"


def state_root() -> Path:
    override = _env_path(STATE_ROOT_ENV)
    return override if override is not None else user_root() / "state"


def cache_root() -> Path:
    return user_root() / "cache"


def backups_root() -> Path:
    return user_root() / "backups"


def install_selection_file() -> Path:
    return user_root() / "install_selection.json"


def supervisor_state_file() -> Path:
    return state_root() / "supervisor.json"


def supervisor_log_file() -> Path:
    return state_root() / "supervisor.log"


def supervisor_lock_file() -> Path:
    return state_root() / "supervisor.lock"


def supervisor_stop_file() -> Path:
    return state_root() / "supervisor.stop"


def ensure_user_roots() -> None:
    for path in (user_root(), runtime_root(), state_root(), cache_root(), backups_root()):
        path.mkdir(parents=True, exist_ok=True)
