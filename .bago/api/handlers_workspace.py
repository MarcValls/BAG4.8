"""handlers_workspace.py - Workspace authority endpoints for BAGO."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler


def _mgr(handler):
    from api_state import get_mgr

    return get_mgr(handler)


def _workspace_payload(mgr: Any) -> dict[str, Any]:
    status = mgr.status()
    workspace_state = status.get("workspace_state") or getattr(mgr, "workspace_state", lambda: {})()
    welcome_state = status.get("welcome_state") or getattr(mgr, "welcome_state", lambda: {})()
    menu_state = status.get("menu_state") or getattr(mgr, "menu_state", lambda: {})()
    cfg = getattr(mgr, "config", None)
    tool_calling = cfg.get("features.tool_calling", False) if cfg else False
    catalog_mode = cfg.get("model_catalog.mode", "all") if cfg else "all"
    binding = {
        "framework_root": status.get("framework_root", ""),
        "project_root": status.get("project_root", ""),
        "workspace_state_root": workspace_state.get("workspace_state_root", status.get("workspace_state_root", "")),
        "workspace_scope_root": workspace_state.get("workspace_scope_root", status.get("workspace_scope_root", "")),
        "workspace_mirror_root": workspace_state.get("workspace_mirror_root", status.get("workspace_mirror_root", "")),
        "workspace_context_root": status.get("workspace_context_root", ""),
        "workspace_id": workspace_state.get("workspace_id", status.get("workspace_id", "")),
        "authorized_root": status.get("authorized_root", ""),
        "repo_root": status.get("repo_root", ""),
        "repo_branch": status.get("repo_branch", ""),
        "objective": status.get("objective", ""),
        "context_revision": status.get("context_revision", ""),
        "binding_confirmed": workspace_state.get("binding_confirmed", status.get("binding_confirmed", False)),
        "binding_reason": workspace_state.get("binding_reason", status.get("binding_reason", "")),
    }
    workspace_state_name = str(workspace_state.get("workspace_state", "")).lower()
    manifest_state = str(workspace_state.get("manifest_state", "")).lower()
    needs_seed = (
        not bool(binding["binding_confirmed"])
        or manifest_state in {"missing", "invalid"}
        or workspace_state_name in {"invalid", "missing", "absent", "legacy_only"}
    )
    permissions = {
        "canChat": bool(status.get("provider") and status.get("model") and (binding["binding_confirmed"] or binding["project_root"])),
        "canInitializeWorkspace": not bool(binding["workspace_state_root"]),
        "canLinkWorkspace": bool(binding["workspace_state_root"]) and not bool(binding["binding_confirmed"]),
        "canRepairWorkspace": bool(binding["workspace_state_root"]) and (
            manifest_state in {"missing", "invalid"}
            or workspace_state_name in {"invalid", "legacy_only"}
        ),
        "canSeedWorkspace": bool(binding["workspace_state_root"]),
        "canRunTools": bool(binding["binding_confirmed"] and tool_calling),
        "canInspectContext": bool(binding["binding_confirmed"] and (binding["context_revision"] or status.get("last_receipt"))),
        "canViewEvidence": bool(status.get("last_receipt") or status.get("context_revision")),
    }
    return {
        "ok": True,
        "contract_version": status.get("contract_version", "bago.contract.ui.v1"),
        "session_id": getattr(mgr, "session_id", "?"),
        "provider": getattr(mgr, "provider", "?"),
        "model": getattr(mgr, "model", "?"),
        "status": status,
        "workspace_state": workspace_state,
        "welcome_state": welcome_state,
        "menu_state": menu_state,
        "binding": binding,
        "permissions": permissions,
        "recommendations": list(workspace_state.get("allowed_actions") or workspace_state.get("acciones_permitidas") or []),
        "blocked_operations": list(workspace_state.get("blocked_operations") or workspace_state.get("operaciones_bloqueadas") or []),
        "summary": {
            "state": workspace_state.get("workspace_state", "unknown"),
            "manifest_exists": bool(workspace_state.get("manifest_exists", False)),
            "binding_confirmed": bool(binding["binding_confirmed"]),
            "binding_reason": str(binding["binding_reason"] or ""),
        },
        "model_catalog_mode": catalog_mode,
        "tool_calling": tool_calling,
        "seed_suggested": needs_seed,
        "seed_reason": "workspace no validado" if needs_seed else "",
    }


def handle(handler: "BaseHTTPRequestHandler") -> None:
    from api_serializers import send_json

    mgr = _mgr(handler)
    if mgr is None:
        send_json(handler, 503, {"ok": False, "error": "SessionManager no disponible"})
        return
    send_json(handler, 200, _workspace_payload(mgr))

