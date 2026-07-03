from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[2]


class ShortcutContractTests(unittest.TestCase):
    def shortcut_paths(self) -> list[Path]:
        return [
            WORKSPACE / "ABRIR_UI_BAGO.cmd",
            ROOT / "ABRIR_UI_BAGO.cmd",
        ]

    def test_supported_shortcuts_exist(self) -> None:
        for path in self.shortcut_paths():
            self.assertTrue(path.exists(), str(path))

    def test_shortcuts_resolve_runtime_relatively(self) -> None:
        for path in self.shortcut_paths():
            text = path.read_text(encoding="utf-8")
            self.assertIn("%~dp0", text, str(path))
            self.assertIn("launcher.py", text, str(path))
            self.assertNotRegex(text, re.escape(str(WORKSPACE)), str(path))

    def test_runtime_shortcut_is_packaged(self) -> None:
        package_script = (ROOT / "scripts" / "package_v4.py").read_text(encoding="utf-8")
        package_json = (ROOT / "package.json").read_text(encoding="utf-8")
        self.assertIn('"ABRIR_UI_BAGO.cmd"', package_script)
        self.assertIn('"ABRIR_UI_BAGO.cmd"', package_json)

    def test_in_app_keyboard_shortcuts_are_wired(self) -> None:
        app = (ROOT / "ui-react" / "src" / "App.jsx").read_text(encoding="utf-8")
        for key in ["k", "j", "m", "b"]:
            with self.subTest(shortcut=f"Ctrl+{key.upper()}"):
                self.assertIn(f"event.key.toLowerCase() === '{key}'", app)
        self.assertIn("setPaletteOpen((value) => !value)", app)
        self.assertIn("orchestrator.focusChat()", app)
        self.assertIn("orchestrator.focusManager(orchestrator.activeModule)", app)
        self.assertIn("orchestrator.setRailCollapsed(!orchestrator.railCollapsed)", app)


if __name__ == "__main__":
    unittest.main()
