"""Smoke test for the banner fix on 2026-06-24."""
from __future__ import annotations

import importlib
import sys

CHAT_DIR = r"C:\Program Files\BAGO\.bago\chat"
if CHAT_DIR not in sys.path:
    sys.path.insert(0, CHAT_DIR)

for name in ("renderer", "repl_banner", "version"):
    sys.modules.pop(name, None)

importlib.invalidate_caches()

from repl_banner import print_banner

class FakeRepl:
    base_path = r"C:\test\workspace"

# 1. print_banner must not raise
print_banner(FakeRepl())
print("=" * 60)

# 2. R.banner() must return a string (the wrapper guarantees it)
import renderer as R
assert hasattr(R, "bago_logo_text"), "renderer missing bago_logo_text()"
assert hasattr(R, "_visible_width"), "renderer missing _visible_width()"
result = R.banner()
assert isinstance(result, str), f"banner() returned {type(result)}"
assert len(result) > 0, "banner() returned empty string"
assert "BAGO" in result or "bago" in result.lower(), "banner missing BAGO reference"
print("All banner assertions passed.")
print("=" * 60)
print("RESULT LENGTH:", len(result))
print("FIRST LINE:", result.split(chr(10))[0])
