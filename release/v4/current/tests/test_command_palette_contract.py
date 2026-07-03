from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UI_SRC = ROOT / "ui-react" / "src"


class CommandPaletteContractTests(unittest.TestCase):
    def test_palette_surface_exists(self) -> None:
        palette = (UI_SRC / "components" / "CommandPalette.jsx").read_text(encoding="utf-8")
        self.assertTrue((UI_SRC / "components" / "CommandPalette.jsx").exists())
        self.assertIn("Ctrl+K", palette)
        self.assertIn("Paleta de comandos", palette)

    def test_app_wires_palette_and_shortcut(self) -> None:
        app = (UI_SRC / "App.jsx").read_text(encoding="utf-8")
        topbar = (UI_SRC / "components" / "ManagerTopBar.jsx").read_text(encoding="utf-8")
        self.assertIn("paletteOpen", app)
        self.assertIn("setPaletteOpen", app)
        self.assertIn("onOpenPalette", topbar)
        self.assertIn("Buscar", topbar)


if __name__ == "__main__":
    unittest.main()
