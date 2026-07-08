"""handlers_providers.py — GET /providers + POST /providers/configure.

GET /providers  — returns provider list enriched with description/state.
POST /providers/configure — enable/disable a provider, set URL or API key.
"""

from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from http.server import BaseHTTPRequestHandler

_PROVIDER_META = {
    "ollama-local":   {"description": "Ollama local (CPU/GPU)",      "icon": "local"},
    "ollama-cloud":   {"description": "Ollama Cloud",                 "icon": "cloud"},
    "anthropic":      {"description": "Anthropic Claude (API key)",   "icon": "cloud"},
    "openai":         {"description": "OpenAI GPT (API key)",         "icon": "cloud"},
    "copilot":        {"description": "GitHub Copilot",               "icon": "cloud"},
    "codex":          {"description": "OpenAI Codex",                 "icon": "cloud"},
    "openrouter":     {"description": "OpenRouter (API key)",         "icon": "cloud"},
    "opencode":       {"description": "OpenCode (local server)",      "icon": "local"},
    "cpp-local":      {"description": "llama.cpp local server",       "icon": "local"},
}


def _mgr(handler):
    from api_state import get_mgr
    return get_mgr(handler)


def _config_path() -> "Path":
    from pathlib import Path
    return Path.home() / ".bago" / "state" / "config.json"


def _load_config() -> dict:
    import json
    p = _config_path()
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_config(cfg: dict) -> None:
    import json, os
    p = _config_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(str(tmp), str(p))


def _provider_state(configured: bool, name: str) -> str:
    if configured:
        return "confirmed"
    local_providers = {"ollama-local", "cpp-local", "opencode"}
    if name in local_providers:
        return "pending"
    return "blocked"


def handle(handler: "BaseHTTPRequestHandler") -> None:
    from api_serializers import send_json
    mgr = _mgr(handler)
    if mgr is None:
        # Fallback: read from config.json directly
        cfg = _load_config()
        providers_cfg = cfg.get("providers", {})
        providers = []
        for name, meta in _PROVIDER_META.items():
            p_cfg = providers_cfg.get(name, {})
            enabled = bool(p_cfg.get("enabled", name == "ollama-local"))
            providers.append({
                "id": name,
                "name": name,
                "description": meta["description"],
                "state": "confirmed" if enabled else "blocked",
                "configured": enabled,
                "models": [],
            })
        send_json(handler, 200, {"providers": providers, "mode": "fallback"})
        return

    raw_providers = mgr.available_providers()
    cfg = getattr(mgr, "config", None)
    mode = cfg.get("model_catalog.mode", "all") if cfg else "all"

    enriched = []
    for p in raw_providers:
        name = p.get("name", "")
        meta = _PROVIDER_META.get(name, {})
        configured = bool(p.get("configured", False))
        enriched.append({
            "id": name,
            "name": name,
            "description": meta.get("description", name),
            "state": _provider_state(configured, name),
            "configured": configured,
            "models": p.get("models", []),
            "modelCount": len(p.get("models", [])),
        })

    send_json(handler, 200, {"providers": enriched, "mode": mode})


def handle_configure(handler: "BaseHTTPRequestHandler", body: dict) -> None:
    """POST /providers/configure — update provider config in ~/.bago/state/config.json."""
    from api_serializers import send_json

    provider_name = str(body.get("provider", "")).strip()
    if not provider_name:
        send_json(handler, 400, {"error": "provider requerido"})
        return

    cfg = _load_config()
    if "providers" not in cfg:
        cfg["providers"] = {}
    if provider_name not in cfg["providers"]:
        cfg["providers"][provider_name] = {}

    p_cfg = cfg["providers"][provider_name]

    if "enabled" in body:
        p_cfg["enabled"] = bool(body["enabled"])
    if "base_url" in body and str(body["base_url"]).strip():
        p_cfg["base_url"] = str(body["base_url"]).strip()
    if "api_key" in body and str(body["api_key"]).strip():
        p_cfg["api_key"] = str(body["api_key"]).strip()
    if "model" in body and str(body["model"]).strip():
        p_cfg["default_model"] = str(body["model"]).strip()

    _save_config(cfg)

    # Invalidate provider cache in session manager if available
    mgr = _mgr(handler)
    if mgr is not None:
        try:
            mgr._providers_cache = None
        except Exception:
            pass

    send_json(handler, 200, {"ok": True, "provider": provider_name, "config": p_cfg})

