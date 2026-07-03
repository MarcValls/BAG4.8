"""handlers_memory.py \u2014 GET /memory/list[?scope=...] for the BAGO HTTP bridge.

Mirrors .bago/chat/repl_memory.list_memories() so the ControlPlane can
fetch the user's saved memories without importing the runtime module.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import TYPE_CHECKING

_RUNTIME_DIR = Path(__file__).resolve().parents[1] / "chat"
if str(_RUNTIME_DIR) not in sys.path:
    sys.path.insert(0, str(_RUNTIME_DIR))

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler


def handle(handler: "BaseHTTPRequestHandler") -> None:
    from api_serializers import send_json
    from api_state import resolve_state_root
    from urllib.parse import parse_qs, urlparse

    from repl_memory import list_memories

    scope = parse_qs(urlparse(handler.path).query).get("scope", ["user"])[0]
    try:
        base_path = resolve_state_root(handler)
        entries = list_memories(scope=scope, base_path=base_path)
        serialised = [
            {
                "name": e.name,
                "scope": e.scope,
                "type": e.type,
                "description": e.description,
                "path": str(e.path),
            }
            for e in entries
        ]
        send_json(handler, 200, {"scope": scope, "entries": serialised})
    except Exception as exc:
        send_json(handler, 500, {"error": f"list_memories fall\u00f3: {exc}"})
