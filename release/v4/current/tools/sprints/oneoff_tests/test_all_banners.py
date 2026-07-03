"""test_all_banners.py — verifica banner de las copias disponibles."""
from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

ROOTS = [
    r"C:\Users\AMTEC_Terminal_1º\AppData\Local\BAGO",
    r"C:\Users\AMTEC_Terminal_1º\.bago\dev",
    r"C:\Users\AMTEC_Terminal_1º\.bago\launch",
]

for root in ROOTS:
    print(f"\n========== {root} ==========")
    chat_dir = Path(root) / ".bago" / "chat"
    if not chat_dir.exists():
        print("SKIP: missing", chat_dir)
        continue
    os.chdir(root)
    for name in ("renderer", "version"):
        sys.modules.pop(name, None)
    sys.path.insert(0, str(chat_dir))
    try:
        importlib.invalidate_caches()
        import renderer as R
        print("VERSION:", R._BAGO_VERSION)
        b = R.banner()
        print(f"---BANNER (len={len(b)})---")
        print(b)
        print("---END---")
    except Exception as e:
        import traceback
        print(f"EXCEPTION: {type(e).__name__}: {e}")
        traceback.print_exc()
