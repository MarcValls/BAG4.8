from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
CLAIMS = ROOT / "docs" / "CLAIMS.md"


class ClaimsDocsSyncTests(unittest.TestCase):
    def test_readme_mvp_status_rows_are_backed_by_claims_matrix(self) -> None:
        readme = README.read_text(encoding="utf-8").lower()
        claims = CLAIMS.read_text(encoding="utf-8").lower()

        expected = {
            "cli": ("bago has a functional cli", "python bago_core\\cli.py validate"),
            "persistent session": ("bago persists sessions", "python test_e2e.py"),
            "provider/model switch": (
                "bago can switch provider/model without losing session availability",
                "python test_e2e.py",
            ),
            "ollama local startup": ("bago supports ollama local", "python bago_core\\cli.py llm list"),
            "local api": ("bago local api is safe by default", "python .bago\\api\\bridge.py --test"),
            "evidence bundles": ("bago can generate evidence bundles", "python bago_core\\cli.py evidence --test"),
            "security validation": ("bago local api is safe by default", "python test_security_release.py"),
            "react ui": ("react ui is available", "cd ui-react; npm run build"),
        }

        for label, (claim, proof) in expected.items():
            with self.subTest(label=label):
                self.assertIn(label, readme)
                self.assertIn(claim, claims)
                self.assertIn(proof, claims)

    def test_readme_experimental_rows_match_claims_boundaries(self) -> None:
        readme = README.read_text(encoding="utf-8").lower()
        claims = CLAIMS.read_text(encoding="utf-8").lower()

        expected = {
            "rl policy layer": "rl learns preferences",
            "agents and autopilot": "agents/autopilot can execute work",
            "cloud multiprovider completeness": "cloud providers are supported",
        }

        for label, claim in expected.items():
            with self.subTest(label=label):
                self.assertIn(label, readme)
                self.assertIn(claim, claims)

        self.assertIn("c++ runtime", readme)
        self.assertIn("experimental", readme)
        self.assertNotIn("c++ runtime", claims)
        self.assertIn("advanced knowledge/embedding store", readme)
        self.assertIn("must remain separate from the mvp claim set", readme)


if __name__ == "__main__":
    unittest.main()
