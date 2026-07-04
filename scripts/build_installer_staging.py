#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
import sys
import shutil as _shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STAGING_ROOT = ROOT / ".staging" / "installer"
RELEASE_OUT = STAGING_ROOT / "release" / "v4"
DIST_OUT = STAGING_ROOT / "dist"


def _safe_remove(path: Path) -> None:
    resolved = path.resolve()
    root = ROOT.resolve()
    if root not in resolved.parents and resolved != root:
        raise RuntimeError(f"Refusing to remove outside workspace: {resolved}")
    if resolved.exists():
        shutil.rmtree(resolved)


def _run(args: list[str]) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def _exe(name: str) -> str:
    resolved = _shutil.which(name)
    if resolved:
        return resolved
    if not name.endswith(".cmd"):
        resolved = _shutil.which(f"{name}.cmd")
        if resolved:
            return resolved
    return name


def main() -> int:
    _safe_remove(STAGING_ROOT)
    RELEASE_OUT.mkdir(parents=True, exist_ok=True)
    DIST_OUT.mkdir(parents=True, exist_ok=True)

    ui_dist = ROOT / "ui-react" / "dist" / "index.html"
    try:
        subprocess.run([_exe("npm"), "run", "manager:build-ui"], cwd=ROOT, check=True, text=True, capture_output=True)
    except subprocess.CalledProcessError:
        if not ui_dist.exists():
            raise
        print("UI build failed, reusing existing ui-react/dist")
    _run([
        sys.executable,
        "scripts/package_v4.py",
        "--output-dir",
        str(RELEASE_OUT),
        "--json",
    ])
    _run([
        _exe("npx"),
        "electron-builder",
        "--win",
        "nsis",
        "--config.directories.output=" + str(DIST_OUT),
    ])

    print(f"Staging root: {STAGING_ROOT}")
    print(f"Release tree: {RELEASE_OUT}")
    print(f"Installer out: {DIST_OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
