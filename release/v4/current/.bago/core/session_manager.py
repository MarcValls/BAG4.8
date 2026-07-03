#!/usr/bin/env python3
"""session_manager.py — BAGO Session Manager (slim core).

Orquesta todo el ciclo de vida de una sesión de chat:
- Carga/guarda contexto via ContextStore
- Mantiene el provider/modelo activo
- Coordina switches con SwitchEngine
- Expone la API que usa el REPL.

El SessionManager es la única puerta de entrada al core desde el chat.

Modularizado en:
- session_utils.py: constants, free functions
- session_context_mixin.py: prompt, RAG, BC policy, auto-evolve
- session_adapters_mixin.py: adapter lifecycle, providers, switch
- session_persistence_mixin.py: save/load, status, bago_mode, goal
- session_tools_mixin.py: tool approval, feedback, memory
- session_turn_mixin.py: send, stream, receipts, tool rounds, orchestration
"""
from __future__ import annotations

import os
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, str(Path(__file__).resolve().parent))
from version import CURRENT as BAGO_VERSION
from context_store import ContextStore, TimelineEvent
from state_paths import resolve_state_root
from model_equivalence import EquivalenceMap
from message_adapter import MessageAdapter
from rl_engine import FeedbackCollector, PreferenceModel
from config_manager import ConfigManager
from credential_manager import CredentialManager
from script_registry import ScriptRegistry
from tool_registry import ToolRegistry
from plan_engine import PlanEngine
from agent_gateway import AgentGateway
from knowledge_base import KnowledgeBase
from embedding_store import EmbeddingStore
from context_envelope import ContextReceipt
from context_governance import (
    CanonCache,
    ClaimVerifier,
    ContextClassifier,
    ContextPlanner,
    ContextRanker,
    ContextSourceRouter,
    ContradictionDetector,
    TokenBudgeter,
)
from gabo_connector import GaboConnector
from guardrails import PathGuard, ToolLogger, ClaimValidator
from workspace_binding import resolve_framework_root, resolve_workspace_binding
from directory_context import DirectoryContextEngine
from provider_adapter import ProviderAdapter, ProviderResponse

from session_utils import (
    ADAPTER_REGISTRY,
    BAGO_MODES,
    normalize_bago_mode,
    normalize_bridges,
    format_rag_context,
)
from session_context_mixin import SessionContextMixin
from session_adapters_mixin import SessionAdaptersMixin
from session_persistence_mixin import SessionPersistenceMixin
from session_tools_mixin import SessionToolsMixin
from session_turn_mixin import SessionTurnMixin


# CANON[SS-001]: SessionManager owns the authoritative chat/session state.
class SessionManager(
    SessionContextMixin,
    SessionAdaptersMixin,
    SessionPersistenceMixin,
    SessionToolsMixin,
    SessionTurnMixin,
):
    """Gestiona una sesión de chat multi-provider."""

    @staticmethod
    def _format_rag_context(fragments):
        return format_rag_context(fragments)

    def __init__(
        self,
        session_id: str | None = None,
        provider: str = "ollama-local",
        model: str = "qwen2.5:14b",
        base_path: str | None = None,
        state_root: str | None = None,
        system_prompt: str = "",
        bago_mode: str = "B",
        active_agent: str = "default",
        active_bridges: list[str] | None = None,
    ):
        self.session_id = session_id or str(uuid.uuid4())[:12]
        self.provider = provider
        self.model = model
        self.system_prompt = system_prompt
        self.bago_mode = normalize_bago_mode(bago_mode)
        self.active_bridges = normalize_bridges(active_bridges or [provider], primary=provider)
        self.base_path = Path(base_path or os.getcwd())
        self.state_root = resolve_state_root(state_root)
        self.state_dir = self.state_root
        self.state_dir.mkdir(parents=True, exist_ok=True)
        # CANON[SS-002]: workspace binding comes from explicit project and workspace roots.
        self.framework_root = resolve_framework_root()
        self.project_root = self.base_path
        self.workspace_state_root = self.project_root / ".gabo"
        self.workspace_scope_root = self.project_root
        binding = resolve_workspace_binding(self.project_root)
        self.workspace_id = binding.workspace_id
        self.workspace_manifest = Path(binding.manifest_path)
        # CANON[SS-003]: keep the resolved binding as a projection, not a second authority.
        self.workspace_binding = binding.to_dict()
        self.workspace_context_root = self.workspace_state_root / "context"

        self.config = ConfigManager(base_path=str(self.base_path), state_root=str(self.state_root))
        self.credentials = CredentialManager(base_path=str(self.base_path), state_root=str(self.state_root))

        self.store = ContextStore(self.session_id, base_dir=self.state_dir)
        if not self.store.get_meta():
            self.store.update_meta({
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_provider": "",
                "last_model": "",
                "switch_count": 0,
                "bago_version": BAGO_VERSION,
                "framework_root": str(self.framework_root),
                "project_root": str(self.project_root),
                "workspace_state_root": str(self.workspace_state_root),
                "workspace_scope_root": str(self.workspace_scope_root),
                "workspace_id": str(self.workspace_id),
            })
            self.store.add_timeline_event(TimelineEvent("session", "start", f"Session {self.session_id} created"))
        self.equiv = EquivalenceMap()
        self.msg_adapter = MessageAdapter()

        self.rl_pref = PreferenceModel(base_dir=self.base_path, state_root=self.state_root)
        self.rl_feedback = FeedbackCollector(self.rl_pref)
        self.script_registry = ScriptRegistry(repo_root=self.base_path)
        self.dev_mode = os.environ.get("BAGO_DEV_MODE", "").strip() in ("1", "true", "TRUE", "yes", "YES")
        self.tool_registry = ToolRegistry(script_registry=self.script_registry, workspace_root=self.base_path, dev_mode=self.dev_mode)
        self.plan_engine = PlanEngine()
        self.agent_gateway = AgentGateway()
        self.agent_gateway.activate(active_agent)
        self.knowledge = KnowledgeBase(base_path=str(self.base_path), state_root=str(self.state_root))
        self.embedding_store = EmbeddingStore(base_path=str(self.base_path), state_root=str(self.state_root))
        self.context_classifier = ContextClassifier()
        self.context_planner = ContextPlanner()
        self.context_router = ContextSourceRouter()
        self.context_ranker = ContextRanker()
        self.context_contradictions = ContradictionDetector()
        self.claim_verifier = ClaimVerifier()
        self.token_budgeter = TokenBudgeter()
        self.canon_cache = CanonCache(self.base_path, self.workspace_context_root)
        self.last_code_task: dict[str, Any] | None = None
        self.last_context_envelope = None
        self._adapter: ProviderAdapter | None = None
        self._init_info: dict = self._init_adapter()
        self.persistent_goal: str = ""
        self.last_receipt: ContextReceipt | None = None
        self.last_budget_report = None
        self.last_context_benchmark: dict[str, Any] | None = None
        self.last_cognitive_benchmark: dict[str, Any] | None = None
        self.last_context_certification: dict[str, Any] | None = None
        self._gabo: GaboConnector = GaboConnector(self.project_root)
        self.directory_context = DirectoryContextEngine(self.workspace_scope_root, self.workspace_context_root)
        self.last_working_set: dict[str, Any] | None = None

        self.path_guard = PathGuard(dev_mode=self.dev_mode)
        tool_log_path = self.state_dir / "tool_log.jsonl"
        self.tool_logger = ToolLogger(log_path=str(tool_log_path))
        self.claim_validator = ClaimValidator()

        self.created_at = time.time()
        self.total_tokens = 0
        self.total_calls = 0
        self.last_switch_at: float | None = None
        self.switch_log: list[dict] = []

        self._pending_tools: list[dict] | None = None
        self._pending_normalized: list[dict] | None = None
        self._pending_user_message: str = ""
        self._pending_tools_kwargs: dict[str, Any] = {}
        self._providers_cache: list[dict[str, Any]] | None = None
        self._providers_cache_at = 0.0
        self._providers_cache_ttl = 30.0

    def rebind_project_root(self, new_project_root: str | Path) -> None:
        """Rebindea la sesión al proyecto activo sin perder el estado de chat."""
        project_root = Path(new_project_root).expanduser().resolve()
        if not project_root.exists():
            raise FileNotFoundError(f"Project root not found: {project_root}")

        def _close_safe(value: Any) -> None:
            try:
                if value:
                    value.close()
            except Exception:
                pass

        _close_safe(getattr(self, "knowledge", None))
        _close_safe(getattr(self, "embedding_store", None))

        self.base_path = project_root
        self.project_root = project_root
        self.workspace_scope_root = project_root
        self.workspace_state_root = project_root / ".gabo"
        self.workspace_context_root = self.workspace_state_root / "context"
        # CANON[SS-004]: rebinding updates project and workspace roots together.
        binding = resolve_workspace_binding(project_root)
        self.workspace_id = binding.workspace_id
        self.workspace_manifest = Path(binding.manifest_path)
        self.workspace_binding = binding.to_dict()

        self.config = ConfigManager(base_path=str(self.base_path), state_root=str(self.state_root))
        self.credentials = CredentialManager(base_path=str(self.base_path), state_root=str(self.state_root))
        self.script_registry = ScriptRegistry(repo_root=self.base_path)
        self.dev_mode = os.environ.get("BAGO_DEV_MODE", "").strip() in ("1", "true", "TRUE", "yes", "YES")
        self.tool_registry = ToolRegistry(script_registry=self.script_registry, workspace_root=self.base_path, dev_mode=self.dev_mode)
        self.knowledge = KnowledgeBase(base_path=str(self.base_path), state_root=str(self.state_root))
        self.embedding_store = EmbeddingStore(base_path=str(self.base_path), state_root=str(self.state_root))
        self.context_classifier = ContextClassifier()
        self.context_planner = ContextPlanner()
        self.context_router = ContextSourceRouter()
        self.context_ranker = ContextRanker()
        self.context_contradictions = ContradictionDetector()
        self.claim_verifier = ClaimVerifier()
        self.token_budgeter = TokenBudgeter()
        self.canon_cache = CanonCache(self.base_path, self.workspace_context_root)
        self.path_guard = PathGuard(dev_mode=self.dev_mode)
        self._gabo = GaboConnector(self.project_root)
        self.directory_context = DirectoryContextEngine(self.workspace_scope_root, self.workspace_context_root)
        self.last_working_set = None
        self._adapter = None
        self._init_info = self._init_adapter()
        self._providers_cache = None
        self._providers_cache_at = 0.0

        self.store.update_meta({
            "framework_root": str(self.framework_root),
            "project_root": str(self.project_root),
            "workspace_state_root": str(self.workspace_state_root),
            "workspace_scope_root": str(self.workspace_scope_root),
            "workspace_id": str(self.workspace_id),
            # CANON[SS-005]: persist the rebinding so future sessions can restore it.
            "active_project_analysis": {
                "root": str(self.project_root),
                "configured": None,
                "linked": None,
                "stack": [],
                "issues": [],
                "suggestions": [],
                "source": "rebind",
            },
        })

    def record_project_analysis(self, data: dict[str, Any]) -> None:
        """Persist a compact project audit for the next model turn."""
        if not isinstance(data, dict):
            return
        summary = {
            "root": str(data.get("root") or data.get("project_root") or self.project_root),
            "configured": data.get("configured"),
            "linked": data.get("linked"),
            "link_mode": data.get("link_mode"),
            "stack": list(data.get("stack") or [])[:8],
            "issues": list(data.get("issues") or [])[:8],
            "suggestions": list(data.get("suggestions") or [])[:8],
            "source": "project_analysis",
        }
        self.store.update_meta({"active_project_analysis": summary})

# ── Quick test ──────────────────────────────────────────────────────

def _run_tests() -> int:
    import tempfile
    from provider_adapter import HealthStatus, ModelInfo

    class FailingAdapter(ProviderAdapter):
        def __init__(self, config: dict | None = None):
            super().__init__("failing", config)

        def chat(self, messages: list[dict], model: str, **kwargs: Any) -> ProviderResponse:
            raise RuntimeError("boom")

        def list_models(self) -> list[ModelInfo]:
            return [ModelInfo("broken", "broken", self.provider_name, 1024, 256, "test", "free")]

        def health_check(self, timeout: float = 5.0):
            return HealthStatus(ok=False, provider=self.provider_name, detail="boom")

        def is_configured(self) -> bool:
            return True

        def supports_tools(self) -> bool:
            return False

        def supports_streaming(self) -> bool:
            return False

    with tempfile.TemporaryDirectory() as td:
        state_root = Path(td) / "state"
        old = os.environ.get("BAGO_STATE_ROOT")
        os.environ["BAGO_STATE_ROOT"] = str(state_root)
        mgr = SessionManager(base_path=td, state_root=str(state_root), provider="ollama-local", model="qwen2.5:14b")
        assert mgr.session_id
        assert mgr.provider == "ollama-local"
        status = mgr.status()
        assert "session_id" in status
        assert status["provider"] == "ollama-local"
        original_engine = (mgr.provider, mgr.model)
        assert mgr.set_bago_mode("G")["mode"] == "G"
        assert mgr.activate_agent("coder")["ok"]
        assert (mgr.provider, mgr.model) == original_engine
        effective_prompt = mgr.effective_system_prompt()
        assert "MODO BAGO ACTIVO [G]" in effective_prompt
        assert "AGENTE ACTIVO [coder]" in effective_prompt
        mgr.save()
        loaded = SessionManager.load(mgr.session_id, base_path=td, state_root=str(state_root))
        assert loaded.provider == "ollama-local"
        assert loaded.bago_mode == "G"
        assert loaded.agent_gateway.active.name == "coder"

        ADAPTER_REGISTRY["failing"] = FailingAdapter
        failing = SessionManager(base_path=td, state_root=str(state_root), provider="failing", model="broken")
        before = len(failing.store.get_history())
        try:
            failing.send("este turno no debe persistirse")
            raise AssertionError("send() debía fallar con el adapter de prueba")
        except RuntimeError as exc:
            assert str(exc) == "boom"
        after = len(failing.store.get_history())
        assert before == after
        failing.close()
        ADAPTER_REGISTRY.pop("failing", None)

        loaded.close()
        mgr.close()
        print("session_manager.py --test: ALL PASS")
        if old is None:
            os.environ.pop("BAGO_STATE_ROOT", None)
        else:
            os.environ["BAGO_STATE_ROOT"] = old
    return 0


if __name__ == "__main__":
    if "--test" in sys.argv:
        raise SystemExit(_run_tests())
