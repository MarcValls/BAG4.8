# BAGO 4.8 Traceability

`release/v4/current` is the canonical runtime snapshot for this repair pass, but this local tree is not a Git repository. Do not use `git status` here as release provenance.

Traceability for this snapshot is file-manifest based:

- `release_version.txt` is the runtime version authority.
- `versions.json` records the visible version line.
- `scripts/package_v4.py` builds `current.manifest.json`, `current.sha256`, and package-level manifest/checksum files.
- `current.manifest.json` records included files, exclusions, and the tree SHA-256 when `scripts/package_v4.py` is run.
- `tools/sprints` is historical one-off material and is excluded from generated packages.

Validation commands:

```powershell
git status --short
python scripts/package_v4.py --test
python -m pytest tests/test_traceability_contract.py -q
```

Expected result:

- `git status --short` may fail with `not a Git repository` in this snapshot.
- `package_v4.py --test` must pass.
- `test_traceability_contract.py` must pass.

If source commit provenance is required, run the same checks from the upstream source repository before copying into this runtime snapshot.
