# Auditoría UI BAGO

Raíz: `ui-react\src`

Archivos JSX/JS: 42 | CSS: 12


## Colores hardcoded en JSX (deben usar var(--*))

- `ui-react\src\useUiConfig.js:8` `#050813` → `bg: '#050813',`
- `ui-react\src\useUiConfig.js:9` `#08101f` → `bg2: '#08101f',`
- `ui-react\src\useUiConfig.js:10` `#0f172a` → `panel: '#0f172a',`
- `ui-react\src\useUiConfig.js:11` `#121d32` → `panel2: '#121d32',`
- `ui-react\src\useUiConfig.js:12` `#17233d` → `panel3: '#17233d',`
- `ui-react\src\useUiConfig.js:13` `#e8eefb` → `text: '#e8eefb',`
- `ui-react\src\useUiConfig.js:14` `#91a5c0` → `muted: '#91a5c0',`
- `ui-react\src\useUiConfig.js:15` `#7c8cff` → `brand: '#7c8cff',`
- `ui-react\src\useUiConfig.js:16` `#4658ff` → `brandStrong: '#4658ff',`
- `ui-react\src\useUiConfig.js:17` `#22d3ee` → `cyan: '#22d3ee',`
- `ui-react\src\useUiConfig.js:18` `#34d399` → `ok: '#34d399',`
- `ui-react\src\useUiConfig.js:19` `#fbbf24` → `warn: '#fbbf24',`
- `ui-react\src\useUiConfig.js:20` `#fb7185` → `danger: '#fb7185',`
- `ui-react\src\useUiConfig.js:21` `#c084fc` → `violet: '#c084fc',`
- `ui-react\src\useUiConfig.js:22` `#fb923c` → `orange: '#fb923c',`

## Imports circulares

- (ninguno) ✔

## Selectores CSS posiblemente sin uso

- `ui-react\src\App.css` → `.rail-collapsed`
- `ui-react\src\App.css` → `.workspace`
- `ui-react\src\App.css` → `.workspace--chat`
- `ui-react\src\App.css` → `.workspace--manager`
- `ui-react\src\App.css` → `.workspace--split`
- `ui-react\src\App.css` → `.manager-panel`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.workspace--split`
- `ui-react\src\App.css` → `.workspace--split`
- `ui-react\src\App.css` → `.workspace`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\App.css` → `.empty-layout`
- `ui-react\src\styles.css` → `.overlay-led`
- `ui-react\src\styles.css` → `.inspector-led`
- `ui-react\src\styles.css` → `.overlay-led`
- `ui-react\src\styles.css` → `.inspector-led`
- `ui-react\src\styles.css` → `.overlay-led`
- `ui-react\src\styles.css` → `.inspector-led`
- `ui-react\src\styles.css` → `.overlay-led`
- `ui-react\src\styles.css` → `.state-loading`
- `ui-react\src\styles.css` → `.inspector-led`
- `ui-react\src\styles.css` → `.state-loading`
- `ui-react\src\styles.css` → `.overlay-tab`
- `ui-react\src\styles.css` → `.overlay-tab`
- `ui-react\src\styles.css` → `.is-active`
- `ui-react\src\styles.css` → `.metric-ok`
- `ui-react\src\styles.css` → `.metric-warn`
- `ui-react\src\styles.css` → `.metric-muted`
- `ui-react\src\styles.css` → `.is-ok`
- `ui-react\src\styles.css` → `.is-ko`
- `ui-react\src\styles.css` → `.inspector-node`
- `ui-react\src\styles.css` → `.inspector-node`
- `ui-react\src\styles.css` → `.is-active`
- `ui-react\src\styles.css` → `.context-pane-led`
- `ui-react\src\styles.css` → `.context-pane-led`
- `ui-react\src\styles.css` → `.is-on`
- `ui-react\src\styles.css` → `.context-pane-tab`
- `ui-react\src\styles.css` → `.context-pane-tab`
- `ui-react\src\styles.css` → `.active`
- `ui-react\src\styles.css` → `.ctx-method-post`
- `ui-react\src\styles.css` → `.ctx-method-put`
- `ui-react\src\styles.css` → `.ctx-method-delete`
- `ui-react\src\styles.css` → `.ctx-router-item`
- `ui-react\src\styles.css` → `.ctx-file-item`
- `ui-react\src\styles.css` → `.active`
- `ui-react\src\styles.css` → `.ctx-router-item`
- `ui-react\src\styles.css` → `.ctx-router-item`
- `ui-react\src\styles.css` → `.unavailable`
- `ui-react\src\styles.css` → `.ctx-router-item`
- `ui-react\src\styles.css` → `.selected`
- `ui-react\src\styles.css` → `.ctx-provider-dot`
- `ui-react\src\styles.css` → `.on`
- `ui-react\src\styles.css` → `.ctx-provider-dot`
- `ui-react\src\styles.css` → `.off`
- `ui-react\src\styles.css` → `.context-pane-tab`
- `ui-react\src\styles.css` → `.session-kit`
- ...y 300 más

## z-index

Total z-index declarados: 9
Capas acordadas: base=1, dropdown=50, overlay=100, toast=200, modal=300

- todos en capas acordadas ✔

## Contraste WCAG AA (texto normal ≥ 4.5:1)

| Par | FG | BG | Ratio | Estado |
|---|---|---|---|---|
| --text/--panel | #e8eefb | #0f172a | 15.35 | AA OK |
| --muted/--panel | #91a5c0 | #0f172a | 7.1 | AA OK |
| --muted2/--panel (¡alerta!) | #64748b | #0f172a | 3.75 | AA FAIL |
| --text/--bg | #e8eefb | #050813 | 17.18 | AA OK |
| --muted/--bg | #91a5c0 | #050813 | 7.95 | AA OK |
| --muted2/--bg (¡alerta!) | #64748b | #050813 | 4.2 | AA FAIL |
| --text/--panel2 | #e8eefb | #121d32 | 14.47 | AA OK |
| --muted/--panel2 | #91a5c0 | #121d32 | 6.69 | AA OK |
| --muted2/--panel2 (¡alerta!) | #64748b | #121d32 | 3.54 | AA FAIL |
