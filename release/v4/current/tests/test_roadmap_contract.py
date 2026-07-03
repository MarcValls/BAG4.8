from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RoadmapContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        core = ROOT / ".bago" / "core"
        chat = ROOT / ".bago" / "chat"
        if str(core) not in sys.path:
            sys.path.insert(0, str(core))
        if str(chat) not in sys.path:
            sys.path.insert(0, str(chat))

    def test_roadmap_state_groups_three_iterations(self) -> None:
        from contract_state import build_roadmap_state

        roadmap = build_roadmap_state()
        self.assertEqual(roadmap["roadmap_version"], "bago.roadmap/v1")
        self.assertEqual(roadmap["status"], "verified")
        self.assertEqual(roadmap["current_iteration"], "iteration-3")
        self.assertEqual(len(roadmap["iterations"]), 3)
        self.assertEqual([item["id"] for item in roadmap["iterations"]], [
            "iteration-1",
            "iteration-2",
            "iteration-3",
        ])
        self.assertEqual([len(item["phases"]) for item in roadmap["iterations"]], [5, 2, 3])

    def test_roadmap_command_exposes_the_canonical_iteration_order(self) -> None:
        from commands import execute

        result = execute("/roadmap", object(), object())
        self.assertTrue(result["ok"], msg=result["message"])
        self.assertEqual(
            [item["id"] for item in result["data"]["iterations"]],
            ["iteration-1", "iteration-2", "iteration-3"],
        )
        self.assertIn("Phase 9 - Final Gate", result["message"])
        self.assertIn("Roadmap", result["message"])


if __name__ == "__main__":
    unittest.main()
