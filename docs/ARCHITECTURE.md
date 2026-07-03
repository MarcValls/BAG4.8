# BAGO v4 Architecture

BAGO v4.8.0 is a session-first control plane. The stable product path is the fused RC4 + RC5-R1 canon: Python 3.11+ CLI, local API, optional React UI, contracts, and evidence. C++ stays experimental and cannot block distribution.

The stable MVP boundary is defined in `docs/MVP.md`. Modules outside that boundary must be documented as partial, experimental, or planned.

## Operational Authority Freeze

For the current audit and repair sequence, `release/v4/current` is the runtime tree that must be made reproducible and verifiable. The top-level `ui-react` folder in `C:\Users\AMTEC_Terminal_1º\BAG4.8` is treated as an auxiliary working copy until it is synchronized or explicitly retired.

The React UI and the manager are presentation surfaces only. They must follow backend-confirmed state and cannot redefine framework root, workspace root, session state, provider/model state, or release validity.

Each repair sprint must close with an intent-vs-result comparison before the next sprint starts. If a sprint reveals a new P0 or a conflict between canon, tests, and runtime behavior, the next sprint is blocked until that conflict is classified.

## Boundaries

| Scope | Path | Role |
|---|---|---|
| Source workspace | workspace resolved by `.bago\pack.json` | code, docs, tests, release assembly |
| Installed runtime | `C:\Program Files\BAGO` | installed executable surface |
| Mutable user state | `C:\ProgramData\BAGO\user` | sessions, credentials, runtime state |
| Advanced backend source | `C:\bago_true\.bago` | external engine source material |
| Advanced RL source | `C:\bago_true\.bago\rl` | external RL source material |

Release artifacts must not package live state, logs, credentials, caches, `node_modules`, or checkpoints.

## Runtime Layers

1. Launcher layer
   - `bago.cmd`, `bago.ps1`, `bago.sh`
   - `bago_core/cli.py`
   - `bago_core/launcher.py`

2. Core session layer
   - `.bago/core/session_manager.py`
   - `.bago/core/context_store.py`
   - `.bago/core/config_manager.py`
   - `.bago/core/credential_manager.py`

3. Provider layer
   - `.bago/core/provider_adapter.py`
   - `.bago/providers/ollama_local.py`
   - `.bago/providers/ollama_cloud.py`
   - `.bago/providers/copilot.py`
   - `.bago/providers/anthropic.py`
   - `.bago/providers/openrouter.py`
   - `.bago/providers/opencode.py`

4. Control/API layer
   - `.bago/api/bridge.py`
   - `.bago/api/control_shadow.py`

5. Evidence and governance layer
   - `bago_core/evidence_bundle.py`
   - `bago_core/claim_ledger.py`
   - `bago_core/codegen/evidence_builder.py` (Code Forge 3B)
   - `docs/contracts/`
   - `docs/INTERPRETE_REFLEXIVO_IMPLEMENTATION.md` (interpretation, formalization, metacognition)

6. UI layer
   - `ui-react`
   - optional future `apps/mobile-expo`
   - UI actions must stay single-path, visible, and backend-authoritative.

7. Plan execution layer
   - `PLAN_VERTICE`
   - `PLAN_VERTICE/monitor`
   - `PLAN_VERTICE/skill-draft/bago-v4-executor`

8. Code Forge layer (BAGO 4.8.0)
   - `bago_core/codegen/task_classifier.py` — request → safe contract
   - `bago_core/codegen/task_compiler.py` — contract → execution plan
   - `bago_core/codegen/context_builder.py` — plan → staged file map
   - `bago_core/codegen/patch_parser.py` — raw output → unified-diff patches
   - `bago_core/codegen/repair_loop.py` — generate → validate → repair (≤3)
   - `bago_core/codegen/code_verdict.py` — repair verdict → final decision
   - `bago_core/codegen/evidence_builder.py` — verdict → audit bundle
   - `bago_core/validation/validation_pipeline.py` — language adapters + gates
   - `bago_core/validation/adapters/python_adapter.py` — Python gate stack
   - `bago_core/execution/atomic_patch.py` — apply patch atomically with snapshot

## Primary Data Flow

```text
user
  -> launcher / CLI
  -> session manager
  -> provider adapter
  -> context store + evidence
  -> optional API/UI surfaces
```

Provider switching is handled by the switch engine and must preserve session context when possible.

## API Flow

```text
ui-react
  -> local HTTP API
  -> session/provider/control shadow
  -> response, status, events
```

The API must default to local access. Non-localhost exposure requires explicit token protection.

## Planned External Bridges

These bridges are current detection surfaces, not current execution authority:

- `bago engine status` for `C:\bago_true\.bago`.
- AppData/cmd-rl detection for migration and compatibility only.

Current RL shadow bridge:

- `bago rl status` and `bago rl shadow` for RL observation.
- `bago rl train bc` and `bago rl eval` for safe policy layer.
- `/rl/status` and `/rl/shadow` expose the same safe state to the local API/UI.

These bridges are still planned:

- canary/full RL execution remains future and gated.

## Current Distribution Shape

Included:

- Python runtime.
- contracts.
- evidence tooling.
- optional React UI build.
- launchers.
- docs.

Excluded:

- `.bago/state`.
- `.bago/logs`.
- credentials.
- `ui-react/node_modules`.
- C++ build requirement.
- checkpoints.

## Next Steps

1. Add release packaging scripts that enforce exclusions.
2. Add install/update smoke tests for `C:\Program Files\BAGO`.
3. Add policy quality metrics before canary.
4. Implement the interpretation stack defined in `docs/INTERPRETE_REFLEXIVO_IMPLEMENTATION.md`.
