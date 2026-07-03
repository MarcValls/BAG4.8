from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class TraceabilityContractTests(unittest.TestCase):
    def test_snapshot_declares_non_git_traceability(self) -> None:
        doc = (ROOT / "docs" / "TRACEABILITY.md").read_text(encoding="utf-8")
        self.assertIn("not a Git repository", doc)
        self.assertIn("current.manifest.json", doc)
        self.assertIn("package_v4.py --test", doc)

    def test_runtime_traceability_inputs_exist(self) -> None:
        for relative in ["release_version.txt", "versions.json", "scripts/package_v4.py"]:
            self.assertTrue((ROOT / relative).exists(), relative)

    def test_local_snapshot_is_not_presented_as_git_worktree(self) -> None:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode != 0:
            self.assertIn("not a git repository", result.stderr.lower())

    def test_historical_sprints_are_excluded_from_packages(self) -> None:
        for script in [
            ROOT / "scripts" / "package_v4.py",
            ROOT / "scripts" / "package_user_bundle.py",
            ROOT / "scripts" / "package_audit_bundle.py",
        ]:
            self.assertIn('"tools/sprints"', script.read_text(encoding="utf-8"), str(script))

        package_json = (ROOT / "package.json").read_text(encoding="utf-8")
        self.assertIn('"!tools/sprints/**/*"', package_json)

    def test_removed_local_probe_script_stays_removed(self) -> None:
        self.assertFalse((ROOT / "scripts" / "_verify_new.py").exists())

    def test_verify_copies_is_not_bound_to_this_workspace(self) -> None:
        script = (ROOT / "scripts" / "verify-copies.ps1").read_text(encoding="utf-8")
        self.assertNotIn("C:\\Users\\AMTEC_Terminal_1º\\BAG4.8", script)
        self.assertIn("$RuntimeRoot", script)
        self.assertIn("CopyRoot", script)


if __name__ == "__main__":
    unittest.main()
