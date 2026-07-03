"""test_repl_full.py — smoke test for BagoREPL._handle_chat."""
from __future__ import annotations

import contextlib
import importlib
import io
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CHAT_DIR = ROOT / ".bago" / "chat"
CORE_DIR = ROOT / ".bago" / "core"

for path in (str(CHAT_DIR), str(CORE_DIR), str(ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

for name in (
    "repl",
    "renderer",
    "repl_menu",
    "repl_startup",
    "repl_utils",
    "switch_engine",
    "session_manager",
    "commands",
    "state_paths",
    "context_budget",
    "version",
):
    sys.modules.pop(name, None)

importlib.invalidate_caches()

import renderer as R
from repl import BagoREPL

calls: list[tuple[str, str]] = []
orig_print_message = R.print_message


def traced_print_message(role: str, content: str) -> None:
    calls.append((role, content))
    orig_print_message(role, content)


R.print_message = traced_print_message

with tempfile.TemporaryDirectory() as td:
    repl = BagoREPL(
        provider="ollama-local",
        model="llama3.2:3b",
        system_prompt="",
        base_path=td,
        state_root=td,
    )
    repl.mgr.send = lambda text, route_info=None: "RESPUESTA OK"
    repl.mgr._adapter = None
    repl.mgr.last_budget_report = None

    stdout = io.StringIO()
    stderr = io.StringIO()
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        repl._handle_chat("HOLA")
    repl.mgr.close()

output = stdout.getvalue()

assert calls, "print_message no fue llamado"
assert calls[0][0] == "assistant", calls
assert calls[0][1] == "RESPUESTA OK", calls
assert "RESPUESTA OK" in output, output

print("repl_full: OK")
