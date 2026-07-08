"""handlers_project.py - Real HTTP endpoints for project/workspace control.

These routes expose the same semantics as `/project ...` slash commands,
but as first-class HTTP endpoints so the UI does not need to tunnel through
`/command` for workspace activation flows.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler


_CHAT_PROJECT_COMMANDS_PATH = Path(__file__).resolve().parents[1] / "chat" / "project_commands.py"
_spec = importlib.util.spec_from_file_location("_bago_project_commands", _CHAT_PROJECT_COMMANDS_PATH)
_mod = importlib.util.module_from_spec(_spec)
sys.modules.setdefault("_bago_project_commands", _mod)
_spec.loader.exec_module(_mod)

cmd_project = _mod.cmd_project


def _mgr(handler):
    from api_state import get_mgr

    return get_mgr(handler)


def _ctx(handler):
    from request_context import build_context

    return build_context(handler)


def _action_args(action: str, body: dict[str, Any] | None = None) -> list[str]:
    payload = body or {}
    root = str(
        payload.get("root")
        or payload.get("path")
        or payload.get("workspace")
        or payload.get("project_root")
        or ""
    ).strip()
    args = [action]
    if root and action != "sync":
        args.append(root)
    return args


def _handle(handler: "BaseHTTPRequestHandler", action: str, body: dict[str, Any] | None = None) -> None:
    ctx = _ctx(handler)
    if ctx.session_mgr is None or ctx.switch_engine is None:
        ctx.send_json(503, {"ok": False, "error": "SessionManager/SwitchEngine no disponible"})
        return

    args = _action_args(action, body)
    channel = ctx.channel(body)
    pre_state = ctx.session_mgr.status()

    def _do() -> dict[str, Any]:
        return dict(cmd_project(ctx.session_mgr, ctx.switch_engine, args))

    try:
        result, elapsed_ms = ctx.timed_call(_do)
    except Exception:
        ctx.send_json(500, {"ok": False, "error": f"Error interno al ejecutar /project {action}"})
        return

    payload = {
        "ok": bool(result.get("ok")),
        "message": result.get("message", ""),
        "action": action,
        "endpoint": f"/project/{action}",
        "session_id": ctx.session_mgr.session_id,
        "provider": ctx.session_mgr.provider,
        "model": ctx.session_mgr.model,
        "data": ctx.json_safe(result.get("data", result.get("result"))),
    }
    ctx.record_shadow(
        action_kind="project",
        channel=channel,
        payload={"action": action, "args": args, "body": body or {}},
        pre_state=pre_state,
        post_state=ctx.session_mgr.status(),
        result=payload,
        elapsed_ms=elapsed_ms,
    )
    ctx.send_json(200 if payload["ok"] else 400, payload)


def handle_project_status(handler: "BaseHTTPRequestHandler") -> None:
    _handle(handler, "status")


def handle_project_analyze(handler: "BaseHTTPRequestHandler") -> None:
    _handle(handler, "analyze")


def handle_project_init(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "init", body)


def handle_project_link(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "link", body)


def handle_project_seed(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "seed", body)


def handle_project_sync(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "sync", body)


def handle_workspace_init(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "init", body)


def handle_workspace_link(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "link", body)


def handle_workspace_seed(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "seed", body)


def handle_workspace_sync(handler: "BaseHTTPRequestHandler", body: dict[str, Any]) -> None:
    _handle(handler, "sync", body)
