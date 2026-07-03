# Correspondencia de la UI con CANON BAGO 1.0

Este mapeo asume el canon fusionado RC4 + RC5-R1 y conserva una sola ruta visible por acción.

## Backend único y superficies

La UI implementa la separación de presentación indicada por el canon:

- Terminal y React deben consumir los mismos servicios de aplicación.
- React no accede a base de datos, manifiestos, filesystem, runtime, herramientas, pipeline o certificación como autoridad.
- El transporte se concentra en `src/backend/client.js`.
- Los componentes consumen `useBagoBackend` y no contienen lógica operacional.

## Estado local no autoritativo

Solo se guarda localmente:

- centro seleccionado;
- apertura de rail e inspector;
- pestaña visual;
- borrador de chat;
- búsqueda de comandos;
- argumentos aún no enviados.

Workspace, sesión, modelo, contexto, permisos, acciones, mensajes, pipeline, receipts y certificación proceden del backend.

## Acciones visibles y únicas

- Una acción operativa debe mostrarse una sola vez, aunque aplique a varios elementos.
- La selección múltiple se resuelve en la propia acción, no duplicando botones por elemento.
- Si la operación admite inversión binaria y la selección mezcla estados opuestos, el backend decide la resolución contextual; la UI no inventa un segundo camino.
- Si la acción no puede resolverse de forma segura sobre la selección actual, se bloquea con explicación visible.

## Centros operativos

La navegación incluye:

```text
task
session
workspace
context
model
tools
evidence
system
view
```

Cada vista espera un `CenterViewModel` con `center_id`, `state_revision`, estado, resumen, entidad activa, acciones recomendadas y disponibles, acciones bloqueadas, actividad, evidencias y advertencias.

## Contrato de comando

Toda interacción con efecto usa `BAGO-COMMAND-001` mediante:

```text
POST /api/v1/commands
```

La petición contiene `request_id`, `command_id`, versión, superficie de origen, sesión, workspace, revisión esperada, argumentos, idempotencia, aprobación y fecha.

La UI no presenta una intención como ejecución. El estado visible procede de `CommandResult`, snapshot o eventos.

## Concurrencia

Las acciones utilizan `center.state_revision` o `snapshot.state_revision` como `expected_state_revision`. Un conflicto debe ser rechazado por el backend; React no aplica el cambio localmente.

## Eventos

Los eventos se consumen por SSE. Salvo `state.snapshot`, cada evento provoca una nueva lectura del snapshot autoritativo para evitar una segunda máquina de estados en React.

## Representación segura

Sin backend:

- las autoridades aparecen como no recibidas;
- los centros permanecen en `unknown`;
- no existen acciones operativas;
- el chat está deshabilitado;
- no se muestran mensajes, métricas, modelos, rutas o receipts inventados.
