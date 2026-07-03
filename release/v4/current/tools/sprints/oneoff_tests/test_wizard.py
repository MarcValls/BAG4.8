"""test_wizard.py — smoke tests for the installed project_wizard contract."""
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
    def __init__(self, base_path: Path = ROOT) -> None:
        self.base_path = base_path
        self.mgr = None


def run_case(stdin_data: str, setup_project_memory=None) -> str:
    fake_in = io.StringIO("\n")
    fake_out = io.StringIO()
    fake_err = io.StringIO()
    fake_in = io.StringIO(stdin_data)
    fake_in.isatty = lambda: True
    fake_out.isatty = lambda: True
    fake_err.isatty = lambda: True

    if setup_project_memory is None:
        sys.modules.pop("project_memory", None)
    else:
        setup_project_memory()

    saved_stdin, saved_stdout, saved_stderr = sys.stdin, sys.stdout, sys.stderr
    sys.stdin, sys.stdout, sys.stderr = fake_in, fake_out, fake_err
    try:
        wizard.project_wizard(FakeRepl())
    finally:
        sys.stdin, sys.stdout, sys.stderr = saved_stdin, saved_stdout, saved_stderr

    return fake_out.getvalue()


out0 = run_case("\n")
assert "PROJECT:" in out0, out0
assert "Tu eleccion (0-4, Enter=0, q=cancelar):" in out0, out0


def _install_project_memory_status() -> None:
    module = types.ModuleType("project_memory")
    module.analyze_data = lambda root: {"root": str(root)}
    module.format_analysis = lambda data: "ANALYSIS OK"
    sys.modules["project_memory"] = module


out1 = run_case("1\n", _install_project_memory_status)
assert "PROJECT:" in out1, out1
assert "ANALYSIS OK" in out1, out1


def _install_project_memory_init() -> None:
    module = types.ModuleType("project_memory")
    module.init_project = lambda root: {"gabo_dir": str(Path(root) / ".gabo")}
    sys.modules["project_memory"] = module


out3 = run_case("3\n", _install_project_memory_init)
assert "PROJECT:" in out3, out3
assert "Proyecto inicializado:" in out3, out3


def _install_project_memory_status_exact() -> None:
    module = types.ModuleType("project_memory")
    module.status_data = lambda root: {"root": str(root), "ok": True}
    module.format_status = lambda data: "STATUS OK"
    sys.modules["project_memory"] = module


out2 = run_case("2\n", _install_project_memory_status_exact)
assert "PROJECT:" in out2, out2
assert "STATUS OK" in out2, out2

out_cancel = run_case("q\n")
assert "PROJECT:" in out_cancel, out_cancel
assert "Tu eleccion (0-4, Enter=0, q=cancelar):" in out_cancel, out_cancel

print("wizard: OK")
