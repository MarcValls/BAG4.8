# Auditoría UI BAGO

Raíz: `release\v4\current\ui-react\src`

Archivos JSX/JS: 43 | CSS: 12


## Colores hardcoded en JSX (deben usar var(--*))

- `release\v4\current\ui-react\src\useUiConfig.js:8` `#050813` → `bg: '#050813',`
- `release\v4\current\ui-react\src\useUiConfig.js:9` `#08101f` → `bg2: '#08101f',`
- `release\v4\current\ui-react\src\useUiConfig.js:10` `#0f172a` → `panel: '#0f172a',`
- `release\v4\current\ui-react\src\useUiConfig.js:11` `#121d32` → `panel2: '#121d32',`
- `release\v4\current\ui-react\src\useUiConfig.js:12` `#17233d` → `panel3: '#17233d',`
- `release\v4\current\ui-react\src\useUiConfig.js:13` `#e8eefb` → `text: '#e8eefb',`
- `release\v4\current\ui-react\src\useUiConfig.js:14` `#91a5c0` → `muted: '#91a5c0',`
- `release\v4\current\ui-react\src\useUiConfig.js:15` `#7c8cff` → `brand: '#7c8cff',`
- `release\v4\current\ui-react\src\useUiConfig.js:16` `#4658ff` → `brandStrong: '#4658ff',`
- `release\v4\current\ui-react\src\useUiConfig.js:17` `#22d3ee` → `cyan: '#22d3ee',`
- `release\v4\current\ui-react\src\useUiConfig.js:18` `#34d399` → `ok: '#34d399',`
- `release\v4\current\ui-react\src\useUiConfig.js:19` `#fbbf24` → `warn: '#fbbf24',`
- `release\v4\current\ui-react\src\useUiConfig.js:20` `#fb7185` → `danger: '#fb7185',`
- `release\v4\current\ui-react\src\useUiConfig.js:21` `#c084fc` → `violet: '#c084fc',`
- `release\v4\current\ui-react\src\useUiConfig.js:22` `#fb923c` → `orange: '#fb923c',`

## Imports circulares

- (ninguno) ✔

## Selectores CSS posiblemente sin uso

- `release\v4\current\ui-react\src\App.css` → `.rail-collapsed`
- `release\v4\current\ui-react\src\App.css` → `.workspace`
- `release\v4\current\ui-react\src\App.css` → `.workspace--chat`
- `release\v4\current\ui-react\src\App.css` → `.workspace--manager`
- `release\v4\current\ui-react\src\App.css` → `.workspace--split`
- `release\v4\current\ui-react\src\App.css` → `.manager-panel`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.command-palette-item`
- `release\v4\current\ui-react\src\App.css` → `.command-palette-item`
- `release\v4\current\ui-react\src\App.css` → `.command-palette-item`
- `release\v4\current\ui-react\src\App.css` → `.is-active`
- `release\v4\current\ui-react\src\App.css` → `.workspace--split`
- `release\v4\current\ui-react\src\App.css` → `.workspace--split`
- `release\v4\current\ui-react\src\App.css` → `.workspace`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\App.css` → `.empty-layout`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-led`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-led`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-led`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-led`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-led`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-led`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-led`
- `release\v4\current\ui-react\src\styles.css` → `.state-loading`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-led`
- `release\v4\current\ui-react\src\styles.css` → `.state-loading`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-tab`
- `release\v4\current\ui-react\src\styles.css` → `.overlay-tab`
- `release\v4\current\ui-react\src\styles.css` → `.is-active`
- `release\v4\current\ui-react\src\styles.css` → `.metric-ok`
- `release\v4\current\ui-react\src\styles.css` → `.metric-warn`
- `release\v4\current\ui-react\src\styles.css` → `.metric-muted`
- `release\v4\current\ui-react\src\styles.css` → `.is-ok`
- `release\v4\current\ui-react\src\styles.css` → `.is-ko`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-node`
- `release\v4\current\ui-react\src\styles.css` → `.inspector-node`
- `release\v4\current\ui-react\src\styles.css` → `.is-active`
- `release\v4\current\ui-react\src\styles.css` → `.context-pane-led`
- `release\v4\current\ui-react\src\styles.css` → `.context-pane-led`
- `release\v4\current\ui-react\src\styles.css` → `.is-on`
- `release\v4\current\ui-react\src\styles.css` → `.context-pane-tab`
- `release\v4\current\ui-react\src\styles.css` → `.context-pane-tab`
- `release\v4\current\ui-react\src\styles.css` → `.active`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-method-post`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-method-put`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-method-delete`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-router-item`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-file-item`
- `release\v4\current\ui-react\src\styles.css` → `.active`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-router-item`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-router-item`
- `release\v4\current\ui-react\src\styles.css` → `.unavailable`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-router-item`
- `release\v4\current\ui-react\src\styles.css` → `.selected`
- `release\v4\current\ui-react\src\styles.css` → `.ctx-provider-dot`
- `release\v4\current\ui-react\src\styles.css` → `.on`
- ...y 304 más

## z-index

Total z-index declarados: 10
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
