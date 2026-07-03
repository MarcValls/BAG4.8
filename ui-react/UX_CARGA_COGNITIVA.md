# B48UI — parche de experiencia de usuario y carga cognitiva

## Alcance exacto

El parche modifica únicamente:

- `src/components/ManagerPanel.jsx`
- `src/components/ManagerPanel.css`
- `src/backend/contracts.js`

No cambia endpoints, comandos, hooks ni la autoridad del backend.

## Aplicación

Desde la raíz de B48UI, en PowerShell:

```powershell
git apply --check .\B48UI_UX_CARGA_COGNITIVA.patch
git apply .\B48UI_UX_CARGA_COGNITIVA.patch
npm ci
npm run build
```

Para revertir el parche antes de confirmar cambios:

```powershell
git apply -R .\B48UI_UX_CARGA_COGNITIVA.patch
```

## Cambios de comportamiento

1. Sustituye la fila universal de texto por presentadores de valor compatibles con:
   - estado;
   - booleano;
   - número y unidad;
   - porcentaje o métrica;
   - identificador;
   - ruta;
   - lista;
   - objeto estructurado;
   - texto.

2. Mantiene compatibilidad con las tuplas antiguas `[label, value, classification]`.

3. Añade copia directa para identificadores y rutas.

4. Evita truncar textos semánticos; solo los identificadores compactos conservan elipsis y muestran el valor completo al pasar el cursor.

5. Reorganiza el Intérprete en esta jerarquía:
   - lectura principal;
   - cuatro métricas de calidad;
   - estructura formal inicialmente visible;
   - datos detectados inicialmente visibles;
   - incógnitas, restricciones, alternativas, evidencia y trazabilidad bajo demanda.

6. Reduce las acciones visibles:
   - una acción principal;
   - hasta dos acciones secundarias;
   - el resto dentro de “Otras acciones”.

7. Elimina la barra de progreso falsa calculada por número de métricas y elementos. La reemplaza por estado, recuentos y alertas explícitas.

8. Eleva tamaños mínimos de texto técnico y reduce el uso de nueve píxeles.

9. Añade al contrato `ValueDescriptor` como extensión opcional y retrocompatible.

## Verificación realizada

- `git apply --check`: correcto.
- Aplicación sobre una copia limpia del ZIP: correcta.
- `npm ci`: correcto, cero vulnerabilidades notificadas.
- `npm run build`: correcto con Vite 8.0.16.

## Criterio de carga cognitiva aplicado

La primera vista responde solo a tres preguntas:

1. ¿Qué ha entendido BAGO?
2. ¿Con qué fiabilidad?
3. ¿Qué estructura propone?

La evidencia, los identificadores, el reporte de terminal y el JSON permanecen disponibles, pero dejan de competir con la lectura principal.
