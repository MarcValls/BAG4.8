# Canon Comment Index

This index tracks the first canonical and legacy annotations added to code.

| ID | File | Status | Meaning |
|---|---|---|---|
| `CANON[WS-001]` | `.bago/core/workspace_binding.py` | canonical | Authoritative resolver for framework, project, and workspace binding. |
| `CANON[WS-002]` | `.bago/core/workspace_binding.py` | canonical | Workspace state always lives under `project_root/.gabo`. |
| `CANON[WS-003]` | `.bago/core/workspace_binding.py` | canonical | `workspace.json` is the canonical workspace identity record. |
| `CANON[WS-004]` | `.bago/core/workspace_binding.py` | canonical | Binding fails closed when authorities are incoherent. |
| `CANON[SS-001]` | `.bago/core/session_manager.py` | canonical | SessionManager owns the authoritative chat/session state. |
| `CANON[SS-002]` | `.bago/core/session_manager.py` | canonical | Workspace binding comes from explicit project/workspace roots. |
| `CANON[SS-003]` | `.bago/core/session_manager.py` | canonical | Resolved binding is a projection, not a second authority. |
| `CANON[SS-004]` | `.bago/core/session_manager.py` | canonical | Rebasing updates project and workspace roots together. |
| `CANON[SS-005]` | `.bago/core/session_manager.py` | canonical | Rebinding is persisted into session meta. |
| `CANON[CTX-001]` | `.bago/core/context_envelope.py` | canonical | Every model call carries session and workspace authorities. |
| `CANON[CTX-002]` | `.bago/core/context_envelope.py` | canonical | Envelope source-of-truth version is explicit. |
| `CANON[CTX-003]` | `.bago/core/context_envelope.py` | canonical | Receipts store effective values, not just requested ones. |
| `CANON[SP-001]` | `.bago/core/session_persistence_mixin.py` | canonical | Binding is confirmed only when all authorities agree. |
| `LEGACY[SP-L001]` | `.bago/core/session_persistence_mixin.py` | legacy | `.bago/state` is read only for compatibility and migration. |
| `LEGACY[SP-L002]` | `.bago/core/session_persistence_mixin.py` | legacy | Canonical state root wins; legacy is fallback only. |
| `LEGACY[API-L001]` | `.bago/api/bridge.py` | legacy | Direct legacy imports remain only while handlers are migrated. |
| `LEGACY[API-L002]` | `.bago/api/bridge.py` | legacy | Fallback routes remain only for un-migrated endpoints. |
| `LEGACY[API-L003]` | `.bago/api/bridge.py` | legacy | Bridge keeps HTTP plumbing; domain handlers live elsewhere. |
| `CANON[CHAT-001]` | `.bago/chat/commands.py` | canonical | Slash-command registry is the authoritative chat command layer. |
| `LEGACY[CHAT-L001]` | `.bago/chat/commands.py` | legacy | Local path injection keeps spec-loaded tests and flat imports working. |
| `CANON[CHAT-002]` | `.bago/chat/repl_menu.py` | canonical | Menu rendering is a projection of chat/session state, not authority. |
| `LEGACY[CHAT-L002]` | `.bago/chat/repl_menu.py` | legacy | Local path injection keeps sibling chat modules importable. |
| `CANON[CHAT-003]` | `.bago/chat/repl.py` | canonical | REPL is the interactive surface, not a second source of truth. |
| `LEGACY[CHAT-L003]` | `.bago/chat/repl.py` | legacy | Local path injection keeps peer chat modules importable by file path. |
| `CANON[CHAT-004]` | `.bago/chat/repl_startup.py` | canonical | Startup renders session state and does not author it. |
| `LEGACY[CHAT-L004]` | `.bago/chat/repl_startup.py` | legacy | Local imports remain compatible with file-path loading. |
| `LEGACY[CHAT-L005]` | `.bago/chat/context_commands.py` | legacy | Local path injection keeps sibling command helpers importable. |
| `LEGACY[CHAT-L006]` | `.bago/chat/project_commands.py` | legacy | Local path injection keeps project helpers importable. |
| `CANON[CTX-004]` | `.bago/chat/context_commands.py` | canonical | `/context` is the authoritative inspection and control surface. |
| `CANON[CTX-005]` | `.bago/chat/context_commands.py` | canonical | Subcommands report or mutate live session state only. |
| `LEGACY[CTX-L001]` | `.bago/chat/context_commands.py` | legacy | `parse_args` stays local because the file is loaded directly. |
| `CANON[PRJ-001]` | `.bago/chat/project_commands.py` | canonical | `/project` is the canonical binding surface for project state. |
| `CANON[PRJ-002]` | `.bago/chat/project_commands.py` | canonical | Project actions rebind through SessionManager before reporting. |
| `LEGACY[PRJ-L001]` | `.bago/chat/project_commands.py` | legacy | Local helpers stay importable under direct file loads. |
| `CANON[UI-001]` | `ui-react/CANON_UI_MAPPING.md` | canonical | UI exposes a single visible path per action and stays backend-authoritative. |
| `CANON[UI-002]` | `tests/test_canonical_contract_state.py` | canonical | Fused RC4 + RC5-R1 contract-state coverage protects workspace and model catalog behavior. |

## Rules

- Canonical markers describe current authority.
- Legacy markers describe compatibility or migration code.
- If a marker and the code disagree, the code must be fixed or the marker updated.
- This index is additive; it starts with the first authoritative markers and can grow as more files are canonized.
