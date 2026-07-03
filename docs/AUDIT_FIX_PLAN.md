# BAGO 4.8 Audit Fix Plan

Status: active
Runtime authority: `release/v4/current`
Auxiliary UI copy: top-level `ui-react`

This plan closes the nine audit findings by sprint. Each sprint must compare intent against the observed filesystem and test result before the next sprint starts.

## Execution Contract

For every sprint:

1. State the sprint intent in one sentence.
2. List the expected files to touch.
3. Implement only the sprint scope.
4. Run the sprint-specific validation commands.
5. Compare intent, result, deviation, and decision.

Do not mark UI, manager, roles, MCP, extensions, or release packaging as stable unless a test or runtime check proves the claim.

## Sprint Order

| Sprint | Scope | Audit findings | State |
|---|---|---:|---|
| 0 | Authority freeze and execution contract | all | closed |
| 1 | Remove recursive release/dist packaging | 6 | closed |
| 2 | Synchronize root UI and runtime UI | 3, 4 | closed |
| 3 | Restore contractual UI dist assets | 1 | closed |
| 4 | Make Electron manager smoke truthful | 3 | closed |
| 5 | Revive surfaces selectively | 2 | closed |
| 6 | Normalize version authority | 5 | closed |
| 7 | Normalize shortcuts and launchers | 9 | pending |
| 8 | Restore or document worktree traceability | 7 | pending |
| 9 | Resolve static UI debt | 8 | pending |
| 10 | Run final verification matrix | all | pending |
| 11 | Post-verification UI intuitiveness and cognitive-load review | follow-up | queued |

## Sprint Intent Matrix

### Sprint 1 - Packaging Recursion

Intent: release artifacts must not contain a nested copy of their own release tree.
Expected changes: `package.json`, `scripts/package_v4.py`, packaging tests.
Validation: no `release/v4/current/release/v4/current` and no duplicated `dist/win-unpacked/resources/release/v4/current` in generated output.

### Sprint 2 - UI Source Alignment

Intent: runtime UI and auxiliary UI either match or are explicitly separated by contract.
Expected changes: `ui-react/src`, `release/v4/current/ui-react/src`, UI sync notes.
Validation: focused hash comparison and Electron smoke expectations.

### Sprint 3 - UI Dist Contract

Intent: `release/v4/current/ui-react/dist` contains `index.html`, assets, and `ui_config.json` matching `release_version.txt`.
Expected changes: UI public asset inclusion in packaging/build inputs.
Validation: `python -m pytest release/v4/current/tests/test_ui_dist_contract.py -q`.

### Sprint 4 - Electron Manager Smoke

Intent: real Electron manager smoke must test the actual runtime UI label and bridge behavior.
Expected changes: UI label or smoke expectation, not both without justification.
Validation: `node release/v4/current/tests/test_manager_electron_smoke.cjs`.

### Sprint 5 - Surface Revival

Intent: revive roles, MCP, extensions, and workflows only where they have a live contract or safe experimental status.
Expected changes: live-surface documentation and tests; restore `.bago/roles`, `.bago/mcp`, `.bago/extensions`, or `.github/workflows` only if a live contract is proven.
Validation: `python -m pytest release/v4/current/tests/test_sprint_4_surfaces.py -q`.

### Sprint 6 - Version Authority

Intent: launcher, release metadata, UI config, and package metadata report one version.
Expected changes: `bago.ps1`, version drift tests.
Validation: `python -m pytest release/v4/current/tests/test_version_drift.py -q`.

### Sprint 7 - Shortcuts

Intent: supported shortcuts resolve the runtime relatively and do not depend on a hardcoded local path.
Expected changes: `ABRIR_UI_BAGO.cmd`, root wrappers or shortcut contract docs.
Validation: command resolution plus no visible PowerShell regression.

### Sprint 8 - Traceability

Intent: the canonical tree has an explicit traceability model.
Expected changes: worktree verification script or documentation.
Validation: `git status` where applicable or documented staging exception.

### Sprint 9 - Static UI Debt

Intent: static UI audit has no known contrast or layer violations that block repeated use.
Expected changes: CSS tokens, z-index layer, confirmed dead CSS cleanup.
Validation: `ui_audit.py`, UI build, UI tests.

### Sprint 10 - Final Verification

Intent: all sprint claims are backed by commands and no known P0 remains.
Expected changes: final evidence note only, unless validation finds defects.
Validation: full matrix listed in this plan's sprint log.

### Sprint 11 - UI Intuitiveness And Cognitive Load

Intent: after Sprint 10, review the UI for human cognitive load and make an action plan for reducing it before adding more UI surface area.
Expected changes: design review note first; implementation only after the runtime contract remains green.
Validation: identify VS Code-style mechanisms, command-palette/navigation patterns, progressive disclosure, chunking, grouping, empty states, onboarding cues, recognition-over-recall affordances, focus-mode candidates, and modules that would be clearer as node/link mechanics.

## Sprint Log

### Sprint 0 - Authority Freeze

Intent: the runtime authority and sprint comparison contract are written down before code changes.
Result: `docs/ARCHITECTURE.md` defines `release/v4/current` as runtime authority for this repair sequence, and this plan records the ordered sprints.
Deviation: none observed at authoring time.
Decision: continue to Sprint 1.

### Sprint 1 - Packaging Recursion

Intent: release artifacts must not contain a nested copy of their own release tree.
Result: `build.extraResources` no longer copies `release/v4/current` into packaged resources; `package_v4.py --test` rejects recursive/build paths; generated recursive trees were removed.
Deviation: `test_packaging.py` still skips ZIP-dependent checks when no persistent `bago-v*.zip` exists in `dist`, but the direct Electron builder contract test passes.
Decision: continue to Sprint 2.

### Sprint 2 - UI Source Alignment

Intent: runtime UI and auxiliary UI either match or are explicitly separated by contract.
Result: `release/v4/current/ui-react/src` was synchronized from top-level `ui-react/src`; `git diff --no-index --quiet -- ui-react/src release/v4/current/ui-react/src` reports equality; runtime UI build passes.
Deviation: UI package metadata remains intentionally separate for now (`release` keeps version `4.8.0`); version normalization is handled in Sprint 6.
Decision: continue to Sprint 3.

### Sprint 3 - UI Dist Contract

Intent: `release/v4/current/ui-react/dist` contains `index.html`, assets, and `ui_config.json` matching `release_version.txt`.
Result: `ui-react/public/ui_config.json` exists in the runtime tree, package inputs include `ui-react/public`, Vite rebuild emits `dist/ui_config.json`, and `test_ui_dist_contract.py` passes.
Deviation: first validation ran build and pytest in parallel and hit stale dist; sequential validation passes.
Decision: continue to Sprint 4.

### Sprint 4 - Electron Manager Smoke

Intent: real Electron manager smoke must test the actual runtime UI label and bridge behavior.
Result: Electron now loads the React UI through the local BAGO web server instead of `file://`, development/test runtime resolves to `release/v4/current`, and the smoke validates preload bridge plus `/status` command execution through the UI.
Deviation: the previous `/project . seed` assertion targeted a non-live surface because `.gabo/seed.py` is absent; the smoke now checks a live command route instead.
Decision: continue to Sprint 5.

### Sprint 5 - Surface Revival

Intent: revive roles, MCP, extensions, and workflows only where they have a live contract or safe experimental status.
Result: `docs/LIVE_SURFACES.md` defines live surfaces; tests validate installation roles, local HTTP API, process runner, wrappers, and source-repo CI boundary. Dead `.bago/roles`, `.bago/mcp`, and `.bago/extensions/bash-runner` were not restored.
Deviation: one real wrapper gap existed (`bago` without extension); it was added and included in packaging.
Decision: continue to Sprint 6.

### Sprint 6 - Version Authority

Intent: launcher, release metadata, UI config, and package metadata report one version.
Result: `bago.ps1` reads `release_version.txt` for its help banner; package metadata, UI package metadata, `ui_config.json`, and `versions.json.current` match `4.8.0`; `test_version_drift.py` passes.
Deviation: the outer shell profile still prints active runtime `4.2.2`, which is outside this runtime tree.
Decision: continue to Sprint 7.

### Sprint 7 - Shortcuts

Intent: supported shortcuts resolve the runtime relatively and do not depend on a hardcoded local path.
Result: root `ABRIR_UI_BAGO.cmd` now resolves `release\v4\current` from `%~dp0`; runtime `ABRIR_UI_BAGO.cmd` was added and included in packaging inputs; `test_shortcuts_contract.py` guards both shortcuts against local absolute paths.
Deviation: script-level multi-copy diagnostics still contain environment-specific paths; that is traceability scope, not shortcut scope.
Decision: continue to Sprint 8.

### Sprint 8 - Traceability

Intent: the canonical tree has an explicit traceability model.
Result: `docs/TRACEABILITY.md` documents that this snapshot is not a Git repository and uses package manifests/checksums for local traceability; `tools/sprints` is excluded from generated packages; `_verify_new.py` was removed; `verify-copies.ps1` now discovers runtime/default copies instead of hardcoding this workspace.
Deviation: installer defaults still mention `C:\Program Files\BAGO`, which is an installation target rather than source provenance.
Decision: continue to Sprint 9.

### Sprint 9 - Static UI Debt

Intent: static UI audit has no known contrast or layer violations that block repeated use.
Result: dropdown menu layer in `ManagerPanel.css` now uses the declared dropdown layer `z-index: 50`; `test_ui_static_contract.py` validates real CSS token contrast for `--muted2` and rejects z-index values outside the declared layer scale.
Deviation: the external skill auditor still reports `--muted2` using its frozen `#64748b` sample; the runtime CSS token is `#8492ad` and passes AA by dynamic test.
Decision: continue to Sprint 10.

### Sprint 10 - Final Verification

Intent: all sprint claims are backed by commands and no known P0 remains.
Result: final pytest matrix passed (`24 passed, 9 skipped, 7 subtests passed`); Electron manager smoke passed with preload bridge and `Modulo Workspace`; `package_v4.py --test` passed.
Deviation: running Vite build in parallel with packaging or Electron smoke can delete/rewrite `ui-react/dist` during reads; final validation was run sequentially for build and then read-only checks.
Decision: continue to Sprint 11.

### Sprint 11 - UI Intuitiveness And Cognitive Load

Intent: after Sprint 10, review the UI for human cognitive load and make an action plan for reducing it before adding more UI surface area.
Result: `docs/UI_COGNITIVE_LOAD_REVIEW.md` defines required cognitive-load methods, VS Code-style mechanics, node/link candidates, and ordered UI actions. The duplicated topbar module navigation was removed; the rail is now the single module destination navigator.
Deviation: command palette, focus mode, problems panel, breadcrumbs, and node/link canvases are planned but not implemented in this sprint.
Decision: keep runtime contract green, then implement the ordered UI actions in separate UI sprints.
