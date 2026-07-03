# UI Cognitive Load Review

Status: post-Sprint 10 review. Runtime contract is green before UI changes.

## Real Findings

P1 - Duplicate destination navigation.
The same manager modules were visible in `ModuleRail` and again as clickable chips in `ManagerTopBar`. This violates the one-entry-per-destination rule and increases choice count. Sprint 11 removes the topbar module navigation; the rail remains the canonical module navigator.

P1 - Too many peer concepts at once.
The UI exposes Chat, Menu, 14 modules, status meters, command results, actions, JSON details, pipeline visuals, evidence, and context in one mental model. A human has to infer what is primary.

P1 - Node/link mechanics are underused where relationships matter.
Patchbay, Pipeline, Evidence/Claims, Provider/Tool/Skill routing, and Context envelope are relationship-heavy. Lists and cards force the user to mentally reconstruct graph structure.

P2 - Guidance is descriptive, not procedural.
Labels explain what modules are, but not "what should I do next". This raises recall load.

## Cognitive Load Methods Required

- Progressive disclosure: show one primary surface, collapse secondary diagnostics by default.
- Chunking: group modules by user task, not internal subsystem names alone.
- Recognition over recall: show command palette/searchable actions instead of expecting slash-command memory.
- One primary action per view: secondary actions go behind "More" or contextual menus.
- Consistent destination model: exactly one visible navigation entry per module.
- Status summary first: topbar gives health/context only, not another navigator.
- Empty/error states as instructions: each blocked view must say the next concrete action.
- Focus mode: hide rail/details when composing or reading long output.
- Visual hierarchy: stronger headings, fewer simultaneous chips, fewer equal-weight cards.

## VS Code / App Mechanics To Reuse

- Activity Bar: keep the rail as the single destination switcher.
- Command Palette: global `Ctrl+K`/`Ctrl+Shift+P` action finder for modules, commands, docs, tests.
- Quick Open: fuzzy jump to files, sessions, providers, receipts, commands.
- Problems Panel: one consolidated error/warning list instead of scattered warnings.
- Breadcrumbs: show `Workspace > Module > Selected entity` above the active panel.
- Status Bar: compact backend/model/session/version state at the bottom.
- Side Panel / Inspector: details only for the selected entity, never always-on raw dumps.
- Zen/Focus Mode: chat-only or manager-only mode with rail and status collapsed.

## Node/Link Candidates

Use nodes and links for:

- Patchbay: agents, skills, tools, providers, permissions, and data flow.
- Pipeline: steps, validators, repair loops, evidence outputs, blockers.
- Evidence graph: claims, tests, receipts, files, manifests, and release decisions.
- Context graph: workspace, session, model, command, budget, selected entity.
- Provider routing: provider, model, fallback, availability, latency, cost.

Do not use nodes for:

- Simple settings.
- Linear logs.
- Chat transcript.
- Installer defaults.
- Single-object status cards.

## Ordered UI Actions

1. Keep rail as the only module destination navigator. Done in Sprint 11.
2. Add command palette with fuzzy module/action search. Implemented in this follow-up.
3. Add focus mode toggle: Chat, Manager, or Review.
4. Convert Patchbay and Pipeline to node/link canvases.
5. Add Problems panel for errors, warnings, blocked actions, and failed tests.
6. Replace raw JSON-first details with summaries plus expandable receipts.
7. Add breadcrumbs and "next best action" empty states per module.
8. Add keyboard shortcut help overlay.

## Validation Criteria

- No duplicated visible destination navigation.
- User sees at most one primary action per active module.
- Graph views are used only where relationships are the core data.
- Every dense diagnostic section has a collapsed summary first.
- Keyboard and palette access exist for frequent operations.
