# Auditoría UI contra gramática visual

- **Fecha**: 2026-06-29
- **Canon**: `.bago/forma/GRAMATICA_VISUAL.md` (promovido en commit `6913a157`)
- **Ámbito**: `ui-react/src/` — 42 archivos JSX/JS, 10 CSS
- **Auditorías previas consumidas**: `ui-react/ui_audit_report.md` (colores hardcoded, selectores sin uso, contraste WCAG), `ui-react/UX_CARGA_COGNITIVA.md` (parche UX que sustituyó fila universal de texto por presentadores de valor)

---

## §1 Estado por sección del canon

| Sección canon | Estado | Observaciones |
|---|---|---|
| §1 Principio rector | **Cumple parcial** | `DataVisuals.jsx` implementa `inferKind()` que infiere presentación desde el dato — va en la dirección correcta. Pero la selección es por tipo de dato, no por tarea perceptiva (`AnalyticTask`). Falta `selectVisual(task, dataKind, …)`. |
| §2 Contrato semántico | **No implementado** | No existe `SemanticDatum`, `DataKind`, `AnalyticTask` ni `selectVisual` en el código. `DataVisuals.jsx` usa un `inferKind` ad-hoc con `presentation` override. |
| §3 Representación correcta | **Violaciones en ChatStatusMeters** | Cuatro barras con cuatro máximos distintos, sin eje común. El resto de componentes usa listas/tablas/texto — apropiado para sus tareas. |
| §4 Jerarquía perceptiva | **Cumple** | No se encontraron donuts, gauges ni velocímetros. La única excepción es `ChatStatusMeters` que usa barras sin escala compartida. |
| §5 Reglas contra carga cognitiva | **Cumple parcial** | `UX_CARGA_COGNITIVA.md` ya aplicó jerarquía de detalle progresivo en `ManagerPanel`. Pero `ChatStatusMeters` sigue mostrando 4 métricas en tarjetas separadas sin escala compartida (viola §5.3). `SessionKit` muestra 9 atributos como tarjetas independientes. |
| §6 Aplicación a BAGO | **Violación en ChatStatusMeters** | §6.2 "Perfil de calidad" exige dot plot horizontal con cuatro filas sobre eje común 0-100. `ChatStatusMeters` usa cuatro barras independientes con máximos distintos. |
| §7 Estructura recomendada | **Cumple** | `App.jsx` implementa navegación (ModuleRail) + estado resumido (TopBar) + superficie de tarea (Chat/Manager) + strip de estado (StatusStrip). Niveles técnico/analítico bajo demanda. |
| §8 Recuadros | **Cumple** | Los recuadros (`dv-card`) se usan para delimitar campos con comportamiento propio, no para "hacer que el dato parezca componente". |
| §9 Validación | **N/A** | Requiere tests observables con usuarios — fuera del alcance de esta auditoría estática. |
| §10 Regla final | **Cumple parcial** | La mayoría de vistas responden una pregunta dominante. `ChatStatusMeters` mezula "salud del sistema" sin priorizar excepciones sobre inventario. |

---

## §2 Hallazgos por componente

### P0 — ChatStatusMeters.jsx (73 líneas)

**Reglas violadas**: §3 "Desviación respecto a objetivo", §4 jerarquía perceptiva, §5.3 comparación sobre escala compartida, §6.2 perfil de calidad, §10 excepción antes que inventario.

| Hallazgo | Líneas | Regla | Detalle |
|---|---|---|---|
| 4 barras con 4 máximos distintos | 76-79 | §5.3 | Provider max= dinamico, Modelo max=1, Rate max=5, Uptime max=300. No hay eje común. |
| Color como único portador de estado | 6 | §3 "Estado" | `barColor = pct > 60 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171'` — verde/amarillo/rojo sin texto ni símbolo que refuerce. |
| 5 colores hex hardcoded | 6, 76-79 | — | `#4ade80`, `#fbbf24`, `#f87171`, `#60a5fa`, `#a78bfa`. Único archivo JSX con hex crudo. |
| Sin interpretación textual | 10-13 | §6.2 | Cada metro muestra solo `value{unit}` — sin interpretación ("Óptimo", "Atención", "Crítico"). |
| No prioriza excepciones | 48-50 | §10 | Muestra los 4 metros siempre; no destaca cuál está degradado. |

**Corrección mínima**: Reescribir como dot plot horizontal con 4 filas sobre eje 0-100, con nombre · punto · valor · interpretación textual. A3 aborda esto directamente.

### P1 — SessionKit.jsx (238 líneas)

**Reglas violadas**: §5.3 comparación sobre escala compartida (parcial), §5.4 detalle progresivo.

| Hallazgo | Líneas | Regla | Detalle |
|---|---|---|---|
| 9 tarjetas para atributos comparables | ~150 | §5.3 | `KitButton` renderiza installation, model, pipeline, policy, pieces, simulation, catalog, inspector, manager como tarjetas separadas. La mayoría son categóricos (defensible), pero `context %` y `cognitive score` son cuantitativos y deberían compartir escala. |
| `summaryFacts` como texto plano aplanado | ~200 | §5.4 | `·`-joined string sin jerarquía: `ctx 68% · cogn 0.72 · pieces 148 · tools 51`. Valores cuantitativos mezclados con conteos sin distinción visual. |

**Corrección mínima**: Extraer `context %` y `cognitive score` del string aplanado y mostrarlos como dot plot de 2 filas. Dejar el resto categórico en tarjetas.

### P1 — DataVisuals.jsx (250 líneas)

**Reglas violadas**: §2 contrato semántico, §1 principio rector.

| Hallazgo | Líneas | Regla | Detalle |
|---|---|---|---|
| `inferKind` selecciona por tipo de dato, no por tarea | 52-65 | §1 | La selección visual debería ser `task → VisualKind`, no `dataKind → VisualKind`. Un porcentaje puede requerir `deviation` (bullet chart) o `composition` (barra apilada) según la tarea. |
| `MetricVisual` usa barra sin eje compartido | 94-110 | §5.3 | Cada `MetricVisual` es una tarjeta independiente con su propia barra. Cuando se muestran 4 métricas en `MetricDashboard` no comparten escala. |
| `ChipList` para listas sin estructura categórica | 140-152 | §3 | Los chips son apropiados para categorías, pero `ChipList` se aplica a cualquier `list` sin distinguir si la tarea es `compare`, `rank` o `inspect`. |

**Corrección mínima**: A4 introduce `selectVisual(task, dataKind)` que reemplaza `inferKind`. `MetricDashboard` puede evolucionar a dot plot compartido cuando A3 valide el patrón.

### P1 — ManagerInspector.jsx (208 líneas)

**Reglas violadas**: §5.3 comparación sobre escala compartida.

| Hallazgo | Líneas | Regla | Detalle |
|---|---|---|---|
| Tests pass/fail y claims ok/total como texto ratio | ~80 | §5.3 | `12/14 tests · 3/5 claims` son valores comparables mostrados como texto plano, no sobre escala compartida. |

**Corrección mínima**: Mostrar como dot plot de 2 filas (tests, claims) sobre eje 0-max. Baja prioridad — es superficie de inspector, no vista principal.

### P2 — ChatView.jsx, TerminalView.jsx, ContextPane.jsx, SessionKit.jsx

**Regla violada**: §5.4 detalle progresivo, §7 estructura recomendada.

| Hallazgo | Archivo | Detalle |
|---|---|---|
| "Flat fact string" sin jerarquía | ChatView:23, TerminalView:40, ContextPane:380, SessionKit:200 | `framework=… · project=… · workspace=… · scope=… · id=… · estado=… · repo=… · binding=…` concatenado en una línea o stack sin distinguir qué es comparable, qué es identificador, qué es estado. |

**Corrección mínima**: Separar estado (con símbolo + texto) de identificadores (monoespaciado) de rutas. Baja prioridad — son headers informativos, no superficies de decisión.

### P2 — useUiConfig.js (30 líneas)

**Regla violada**: token de color.

| Hallazgo | Líneas | Detalle |
|---|---|---|
| 15 colores hex hardcoded como fallback de tema | 8-22 | `#050813`, `#08101f`, `#0f172a`, etc. Son fallbacks de tema — no llegan al JSX directamente sino via CSS variables. `ui_audit_report.md` ya los catalogó. |

**Corrección mínima**: Migrar a CSS variables puras sin fallback JS. Baja prioridad — funciona, pero acopla tema a JS.

---

## §3 Violaciones sistemáticas

1. **Ausencia de contrato semántico** (§2): No existe `SemanticDatum` ni `selectVisual`. `DataVisuals.inferKind` es un sustituto ad-hoc que selecciona por tipo de dato, no por tarea perceptiva. A4 lo resuelve.

2. **Métricas en tarjetas separadas sin escala compartida** (§5.3): `ChatStatusMeters` (4 barras, 4 máximos), `MetricDashboard` (N tarjetas con N barras), `SessionKit` (context % y cognitive score aplanados en texto). Solo `ChatStatusMeters` es P0; el resto es P1/P2.

3. **Color como único portador de umbral** (§3 "Estado"): `ChatStatusMeters` usa verde/amarillo/rojo sin texto ni símbolo. Es el único caso — el resto de la UI usa glyph + text + class.

4. **Hex crudo en JSX** (§8): Solo `ChatStatusMeters.jsx` (5 ocurrencias). El resto usa clases CSS.

5. **Flat fact strings** (§5.4): 4 componentes concatenan `key: value · key: value` sin jerarquía perceptiva. No es una violación de tipo de gráfico, pero sí de carga cognitiva.

---

## §4 Checklist priorizado P0/P1/P2

### P0 — Corrección mínima inmediata (alimentan A3)

- [ ] **P0-1** `ChatStatusMeters.jsx` → reescribir como dot plot horizontal 0-100 con 4 filas (Provider, Modelo, Rate, Uptime). Cada fila: nombre · punto sobre escala · valor exacto · interpretación textual. Eliminar hex crudo. Usar `var(--ok)`, `var(--warn)`, `var(--danger)`. **= Acción A3**
- [ ] **P0-2** `ChatStatusMeters.jsx` → añadir texto de estado ("Operativo", "Degradado", "Crítico") con símbolo redundante (`●`, `▲`, `■`) además del color. **= parte de A3**

### P1 — Corrección estructural (post-A3, pasada futura)

- [ ] **P1-1** `DataVisuals.jsx` → reemplazar `inferKind` por `selectVisual(task, dataKind, …)` una vez A4 entregue los tipos.
- [ ] **P1-2** `MetricDashboard` → evolucionar a dot plot compartido cuando múltiples métricas compiten en la misma vista.
- [ ] **P1-3** `SessionKit.jsx` → extraer `context %` y `cognitive score` del `summaryFacts` aplanado a un mini dot plot de 2 filas.
- [ ] **P1-4** `ManagerInspector.jsx` → tests pass/fail y claims ok/total como dot plot de 2 filas sobre eje compartido.
- [ ] **P1-5** `DataVisuals.jsx` → `ChipList` solo para datos categóricos con tarea `identify`; para `rank` usar barras ordenadas.

### P2 — Pulido (backlog)

- [ ] **P2-1** Separar estado / identificador / ruta en los "flat fact strings" de ChatView, TerminalView, ContextPane, SessionKit.
- [ ] **P2-2** Migrar `useUiConfig.js` a CSS variables puras sin fallback JS.
- [ ] **P2-3** Limpiar selectores CSS sin uso (189+ según `ui_audit_report.md`).
- [ ] **P2-4** Corregir contraste WCAG AA de `--muted2` (#64748b sobre #0f172a = 3.75:1, falla).

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Archivos auditados | 42 JSX/JS |
| Archivos con violaciones P0 | 1 (`ChatStatusMeters.jsx`) |
| Archivos con violaciones P1 | 3 (`DataVisuals.jsx`, `SessionKit.jsx`, `ManagerInspector.jsx`) |
| Archivos con violaciones P2 | 5 (flat fact strings + `useUiConfig.js`) |
| Donuts/gauges/velocímetros | 0 |
| Hex crudo en JSX | 5 ocurrencias, todas en `ChatStatusMeters.jsx` |
| Color como único portador | 1 caso (`ChatStatusMeters.jsx` línea 6) |
| Contrato semántico implementado | No — A4 lo introduce |

La UI está en mejor estado de lo que el canon podría sugerir: no hay donuts, ni gauges, ni JSON crudo como salida principal, ni chips para datos no categóricos. La violación principal es `ChatStatusMeters` — exactamente el componente que A3 reescribe. La ausencia de contrato semántico (`SemanticDatum` + `selectVisual`) es la deuda estructural que A4 paga.