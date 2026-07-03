from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UI_SRC = ROOT / "ui-react" / "src"


class UiCognitiveLoadContractTests(unittest.TestCase):
    def test_topbar_does_not_duplicate_module_destination_navigation(self) -> None:
        topbar = (UI_SRC / "components" / "ManagerTopBar.jsx").read_text(encoding="utf-8")
        rail = (UI_SRC / "components" / "ModuleRail.jsx").read_text(encoding="utf-8")
        self.assertNotIn("orchestrator.openModule(module.id)", topbar)
        self.assertIn("orchestrator.openModule(module.id)", rail)
        self.assertIn("Destino único", topbar)

    def test_review_defines_required_cognitive_load_methods(self) -> None:
        review = (ROOT / "docs" / "UI_COGNITIVE_LOAD_REVIEW.md").read_text(encoding="utf-8")
        for phrase in [
            "Progressive disclosure",
            "Recognition over recall",
            "Command Palette",
            "Focus Mode",
            "Node/Link Candidates",
            "No duplicated visible destination navigation",
        ]:
            self.assertIn(phrase, review)


if __name__ == "__main__":
    unittest.main()
