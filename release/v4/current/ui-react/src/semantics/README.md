# BAGO visual grammar — semantics module

## Propósito

Implementa el contrato semántico del canon `.bago/forma/GRAMATICA_VISUAL.md` §2:
`SemanticDatum` + `selectVisual(task, dataKind, …)` para que el frontend decida
la representación visual basándose en la tarea perceptiva, no solo en el tipo de dato.

## Estructura

| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Tipos del contrato: `DataKind`, `AnalyticTask`, `SemanticDatum`, `VisualSpec`, etc. |
| `datum.ts` | `createDatum()` con validación runtime + `isSemanticDatum()` type guard. |
| `selectVisual.ts` | Tabla `task → VisualKind` del canon §3 + ajustes por cardinalidad y rol. |
| `index.ts` | Barrel export. |

## Tabla de mapeo `task → VisualKind`

| AnalyticTask | VisualKind por defecto | Ajustes |
|---|---|---|
| `identify` | `stat` | → `table` si cardinalidad > 1; → `chips` si nominal + cardinalidad > 3; → `text` si textual |
| `compare` | `dot-plot` | `sharedScale: true`, `directLabels: true`, `showUncertainty` si hay |
| `rank` | `bar` | `ordered: true`, `sharedScale: true` |
| `trend` | `line` | → `bar` si no temporal |
| `distribution` | `histogram` | → `box-plot` si cardinalidad > 1 |
| `composition` | `stacked-bar` | `sharedScale: true` |
| `deviation` | `bullet` | `showTarget` si `target` definido |
| `correlation` | `scatter` | — |
| `trace` | `timeline` | `directLabels: true` |
| `flow` | `sankey` | — |
| `hierarchy` | `tree` | — |
| `inspect` | `inspector` | `exceptionFirst: true` |

## Uso

```ts
import { createDatum, selectVisual } from './semantics';

const datum = createDatum({
  id: 'confidence',
  label: 'Confianza',
  value: 0.82,
  dataKind: 'quantitative',
  task: 'deviation',
  role: 'diagnostic',
  domain: [0, 1],
  target: 0.75,
});

const spec = selectVisual(datum);
// spec.visual === 'bullet'
// spec.showTarget === true
```

## Tests

```
npm run test
```

Cubre los 12 `AnalyticTask` + validación de `createDatum` + edge cases.