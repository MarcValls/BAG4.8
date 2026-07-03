# Resolución de la auditoría brutal

## Issue 1 - Critical: autoridad sintética en browser-local

**Resolución normativa:** browser-local queda limitado a `DemoMode`. El flujo normal no puede fabricar mensajes del asistente, sesiones, historial, receipts ni ejecuciones.

**Gate:** `DEMO_ISOLATED`.

**Pruebas:** FALSE-051/052, MANAGER-001/003, INC-075.

## Issue 2 - Major: manager_context no consumido

**Resolución normativa:** ManagerContext entra en ContextEnvelope y exige ManagerContextReceipt con campos recibidos, admitidos, rechazados y consumidos, además de referencias al prompt y hash de entrada del modelo.

**Gate:** `MANAGER_CONTEXT_CONSUMED`.

**Pruebas:** INC-071/072, MANAGER-004/006.

## Issue 3 - Major: roster hard-coded

**Resolución normativa:** ModelCatalog distingue instalado, configurado, detectado, instalable, cargado y efectivo. La UI opera en installed-only por defecto.

**Gate:** `MODEL_CATALOG_REAL`.

**Pruebas:** INC-073, FALSE-053/054, MANAGER-007/008.

## Issue 4 - Minor: ready tras refresh fallido

**Resolución normativa:** el refresh fallido fuerza degraded/stale. El snapshot previo se muestra como last-known-good.

**Gate:** `STALE_STATE_VISIBLE`.

**Pruebas:** INC-074, FALSE-055, MANAGER-009/010.
