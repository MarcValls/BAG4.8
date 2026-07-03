# Integración del backend

El foco único de conexión está en:

```text
src/backend/
```

Empieza por [`src/backend/README.md`](src/backend/README.md). Allí se documentan el snapshot, los comandos, los eventos, la autenticación y la sustitución de HTTP por un bridge local.

## Archivos que normalmente se modifican

1. `src/backend/config.js`: URL y rutas.
2. `src/backend/client.js`: transporte real si no se usa REST + SSE.
3. `.env`: valores locales derivados de `.env.example`.

No es necesario modificar `App.jsx` para conectar el backend. La UI renderiza los datos que reciba y no contiene datos simulados.
