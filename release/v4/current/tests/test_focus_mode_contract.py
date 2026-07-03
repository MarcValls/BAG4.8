from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UI_SRC = ROOT / "ui-react" / "src"


class FocusModeContractTests(unittest.TestCase):
    def test_review_mode_wires_single_surface_focus(self) -> None:
        app = (UI_SRC / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("reviewMode", app)
        self.assertIn("workspace--review", app)
        self.assertIn("reviewRailCollapsedRef", app)
        self.assertIn("setReviewMode(true)", app)
        self.assertIn("setReviewMode(false)", app)
        self.assertIn("setRailCollapsed(reviewRailCollapsedRef.current)", app)
        self.assertIn("reviewMode ? null : (", app)

    def test_topbar_hides_secondary_strip_in_review(self) -> None:
        topbar = (UI_SRC / "components" / "ManagerTopBar.jsx").read_text(encoding="utf-8")
        self.assertIn("reviewMode ? null :", topbar)
        self.assertIn("Review", topbar)
        self.assertIn("Abrir paleta de comandos", topbar)


if __name__ == "__main__":
    unittest.main()
