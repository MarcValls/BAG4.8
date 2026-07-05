from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .roots import framework_root

_DEFAULT_CONTRACT_PATH = framework_root() / "docs" / "contracts" / "resolver_contract.json"


def load_contract(contract_path: str | Path | None = None) -> dict[str, Any]:
    path = Path(contract_path) if contract_path is not None else _DEFAULT_CONTRACT_PATH
    if path.exists():
        return _load_json(path)
    return _builtin_contract()


def _load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"resolver contract must be a JSON object: {path}")
    return data


def _builtin_contract() -> dict[str, Any]:
    return {
        "schema_version": 1,
        "description": "Fallback resolver contract for BAGO.",
        "roots": {
            "framework_root": ".",
            "workspace_state_root": "~/.gabo",
            "legacy_workspace_root": "~/.bago",
        },
        "pieces": [
            {
                "id": "framework.root",
                "kind": "root",
                "loader": "path",
                "candidates": ["."],
                "aliases": ["repo.root"],
            },
            {
                "id": "workspace.state_root",
                "kind": "root",
                "loader": "path",
                "candidates": ["~/.gabo", "~/.bago"],
                "aliases": ["workspace.root", ".gabo", ".bago"],
            },
            {
                "id": "core.package",
                "kind": "package",
                "loader": "path",
                "candidates": [".gabo/core", ".bago/core", "bago_core"],
                "aliases": ["core"],
            },
            {
                "id": "chat.package",
                "kind": "package",
                "loader": "path",
                "candidates": [".gabo/chat", ".bago/chat"],
                "aliases": ["chat"],
            },
            {
                "id": "providers.package",
                "kind": "package",
                "loader": "path",
                "candidates": [".gabo/providers", ".bago/providers"],
                "aliases": ["providers"],
            },
            {
                "id": "api.package",
                "kind": "package",
                "loader": "path",
                "candidates": [".gabo/api", ".bago/api"],
                "aliases": ["api"],
            },
            {
                "id": "tools.package",
                "kind": "package",
                "loader": "path",
                "candidates": [".gabo/tools", ".bago/tools"],
                "aliases": ["tools"],
            },
            {
                "id": "chat.commands",
                "kind": "module",
                "loader": "module_path",
                "candidates": [".gabo/chat/commands.py", ".bago/chat/commands.py"],
                "aliases": ["commands", "repl.commands"],
            },
        ],
    }
