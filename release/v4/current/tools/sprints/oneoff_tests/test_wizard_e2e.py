"""test_wizard_e2e.py — end-to-end smoke for the wizard fallback branch."""
from __future__ import annotations

import contextlib
import importlib
import io
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CHAT_DIR = ROOT / ".bago" / "chat"
CORE_DIR = ROOT / ".bago" / "core"

for path in (str(CHAT_DIR), str(CORE_DIR), str(ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

for name in ("repl_wizard_project_v2", "renderer", "project_memory", "version"):
    sys.modules.pop(name, None)

importlib.invalidate_caches()

import repl_wizard_project_v2 as wizard


class FakeRepl:
    base_path = ROOT
    mgr = None

    def _navigate(self, title, labels, hint=None):
        raise RuntimeError("simulate broken TTY navigation")


module = types.ModuleType("project_memory")
module.analyze_data = lambda root: {"root": str(root)}
module.format_analysis = lambda data: "ANALYSIS OK"
sys.modules["project_memory"] = module

fake_in = io.StringIO("1\n")
fake_out = io.StringIO()
fake_err = io.StringIO()
fake_in.isatty = lambda: True
fake_out.isatty = lambda: True
fake_err.isatty = lambda: True

saved_stdin, saved_stdout, saved_stderr = sys.stdin, sys.stdout, sys.stderr
sys.stdin, sys.stdout, sys.stderr = fake_in, fake_out, fake_err
try:
    wizard.project_wizard(FakeRepl())
finally:
    sys.stdin, sys.stdout, sys.stderr = saved_stdin, saved_stdout, saved_stderr

output = fake_out.getvalue()
assert "PROJECT:" in output, output
assert "Tu eleccion (0-4, Enter=0, q=cancelar):" in output, output
assert "Analizar este directorio" in output, output
assert "ANALYSIS OK" in output, output

print("wizard_e2e: OK")
