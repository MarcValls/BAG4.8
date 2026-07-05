# BAGO UI Canonical Contract

This document defines the active UI contract for BAG4.8. The new React shell is the starting point for all interface work.
Layout, visual grammar, and presentation language live in `docs/UI_SYSTEM_VISUAL_GRAMMAR.md`.

## Source Of Truth

- `ui-react/src/app/ControlPlane.tsx`
- `ui-react/src/layout/GlobalHeader.tsx`
- `ui-react/src/layout/MainSidebar.tsx`
- `ui-react/src/layout/WorkspaceShell.tsx`
- `ui-react/src/layout/SelectionInspector.tsx`
- `ui-react/src/layout/StatusBar.tsx`

## Canonical Shell

- `ControlPlane` owns the UI state, backend bootstrap, command palette, workspace picker, selection inspector, and global mode.
- `GlobalHeader` is context and mode chrome, not destination navigation.
- `MainSidebar` is the only visible destination navigator in normal mode.
- `WorkspaceShell` is the active content surface for the current destination.
- `SelectionInspector` appears only in normal mode when there is a selected entity.
- `StatusBar` appears only in normal mode.

## Destinations

The active destinations are:

- `home`
- `chat`
- `workspace`
- `graph`
- `pipeline`
- `evidence`
- `context`
- `system`

These are switched from `MainSidebar` and from the command palette, never duplicated as a second visible destination rail in the header.

## Global Modes

- `normal`
- `focus`
- `review`

Behavioral mode rules are defined in `docs/UI_SYSTEM_VISUAL_GRAMMAR.md` only as presentation guidance; the canonical mode contract is here.

## Command And Shortcut Contract

- `Ctrl+K` and `Cmd+K` open the command palette.
- `Escape` closes the palette and picker dialogs.
- The command palette must include mode switching and the active backend actions exposed by `ControlPlane`.
- The workspace picker remains explicit and manual; no hidden path assumption.

## UI Boundaries

- Do not reintroduce the previous shell entry as the active shell.
- Do not reintroduce the previous top chrome or rail as canonical UI surfaces.
- Keep destination navigation in one place.
- Keep the header for context, search, actions, and mode switching.
