from __future__ import annotations

from pathlib import Path
import sys


CORE = Path(__file__).resolve().parent / "release" / "v4" / "current" / ".bago" / "core"
if str(CORE) not in sys.path:
    sys.path.insert(0, str(CORE))

from intent_engine import classify_intent


CASES = {
    "revisa este diff y dime riesgos": "review",
    "dime riesgos y revisa este diff": "review",
    "audita el codigo de inicio y resume fallos": "review",
    "implementa la migracion de rutas": "work",
    "la migracion de rutas implementala ahora": "work",
    "planifica y luego refactoriza este modulo": "work",
    "corrige este bug en la UI y ejecuta la solucion": "execute",
    "ejecuta la solucion y corrige este bug en la UI": "execute",
    "levanta electron y abre la app": "execute",
    "hola, que tal?": "chat",
    "gracias por la ayuda": "chat",
}


def test_intent_engine_mixed_phrases():
    for text, expected in CASES.items():
        assert classify_intent(text) == expected, text
