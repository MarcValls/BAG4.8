# BAGO UI — Notas de adaptación

## Objetivo

Adaptación de la UI existente al modelo de una sola interfaz: chat central, navegación lateral mínima, inspector contextual y modos Focus/Review.

## Integración de backend preservada

`src/api/client.ts` no ha sido modificado. Se conservan los mismos contratos y endpoints:

- `GET /status`
- `GET /session`
- `GET /providers`
- `GET /models/:provider`
- `GET /menu`
- `GET /routes`
- `GET /history`
- `GET /files/list`
- `GET /files/read/:path`
- `POST /command`
- `POST /chat`
- `POST /chat/stream`

También se conservan:

- `X-Bago-Token`
- `X-Bago-Channel: ui-react`
- configuración mediante `VITE_BAGO_API_BASE`
- configuración mediante `VITE_BAGO_TOKEN`
- fallback local `http://127.0.0.1:8080`
- persistencia existente de API base y token
- fallback de `/chat/stream` a `/chat`

## Cambios principales

- Apertura adaptativa antes de entrar a la aplicación.
- Entrada directa cuando el backend confirma workspace y sesión.
- Home simplificado con Chat, Workspace y Revisión.
- Chat convertido en la superficie principal.
- Modos Live, Trace y Focus.
- Historial breve y contexto bajo demanda.
- Sidebar mínima y colapsable.
- Inspector oculto hasta que existe selección.
- Inspector progresivo: resumen, detalle y raw.
- Workspace con árbol, búsqueda, filtros y organización local.
- Grafo reducido a un subárbol relevante.
- Pipeline sin raw visible por defecto.
- Evidencia principal con comparación bajo demanda.
- Presupuesto de contexto con uso, reserva, disponible y límite.
- Sistema con estado general en la parte superior.
- Configuración de conexión movida a un desplegable secundario.
- Command Palette conservada mediante `Ctrl+K`.

## Protección de estado

- La UI no deriva rutas del proyecto.
- La UI no sustituye el snapshot del backend con datos locales.
- Las preferencias visuales siguen siendo locales.
- Las respuestas de chat sin receipt permanecen en estado `validating`.
- Las acciones de contexto continúan ejecutándose mediante `/command`.
- No se han añadido endpoints nuevos.

## Validaciones realizadas

```text
npm run typecheck
npm run build
```

También se realizó una prueba de montaje con un backend mock que devolvió:

- workspace válido;
- sesión vinculada;
- modelo efectivo;
- contexto certificado;
- historial;
- archivos;
- providers y rutas.

Resultado: `RUNTIME_MOUNT_OK`.

## Ejecución

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```
