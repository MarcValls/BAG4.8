# Informe de validación RC5-R1

- Markdown: 6836 líneas.
- PDF: 89 páginas A4, renderizado y revisado.
- Pruebas nominales: 249.
- Contratos JSON Schema: 6, todos válidos Draft 2020-12.

## Pruebas por suite

- `COGSEC`: 15
- `EVID`: 20
- `FALSE`: 55
- `FIXED`: 12
- `HUMAN`: 12
- `INC`: 76
- `INTERP`: 26
- `MANAGER`: 10
- `MEMORY`: 15
- `MIRROR`: 8

## Comprobaciones

- Sin duplicados en la numeración de encabezados.
- PDF sin páginas recortadas observadas en portada, contratos, UI, pregunta espejo y cierre.
- El paquete no incluye caches, node_modules, logs ni datos de sesión.
- Los contratos revisados se encuentran en `contracts/ui/v1/`.

Este informe valida el artefacto documental y sus esquemas; no certifica la implementación de BAGO.
