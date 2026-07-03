# Manager Visual Grammar

## Propósito
Definir la interfaz del manager de BAGO como un sistema contractual, legible y operable por chat.

## Principios
- `Chat` es la entrada principal.
- `Panel` es la vista contractual del módulo activo.
- `Topbar` da contexto y cambia de superficie.
- `Status strip` resume salud, contexto y sesión.
- Una acción visible debe ser real, ejecutable y trazable.
- Si una acción se puede hacer por chat, el panel no la duplica con más de un acceso visible.

## Lenguaje visual global

### Simbología
- `B`: núcleo BAGO.
- `dot`: estado vivo.
- `pill`: estado confirmado o modo activo.
- `chip`: atajo de chat o acción corta.
- `card`: bloque de detalle.
- `meter`: carga, salud o presupuesto.
- `rail`: navegación de módulos.

### Estética
- Fondo oscuro, técnico, sobrio.
- Jerarquía corta y clara.
- Pocas superficies, bordes suaves, poco ruido.
- Nada de cajas decorativas vacías.
- Nada de controles visuales que no cambien estado.

### Mecánicas comunes
- `Chat` recibe intención breve.
- `Panel` muestra la entidad o contrato activo.
- `Inspector` solo aparece cuando hay selección útil.
- `Rail` cambia de módulo.
- `Status strip` informa sin interrumpir.

### Alertas comunes
- `confirmed`: dato válido y conectado.
- `loading`: operación en curso.
- `running`: ejecución viva.
- `warn`: estado parcial o atención.
- `blocked`: falta permiso, aprobación o condición.
- `error`: contrato roto o dato ausente.
- `unknown`: estado no confirmado.

## Arquitectura de información

### Capas
- `Shell`: estructura global, navegación, topbar y status strip.
- `Chat`: orquestación por lenguaje natural.
- `Panel`: módulo activo.
- `Inspector`: detalle del elemento seleccionado.
- `Evidence`: trazabilidad y validación.

### Regla de una sola entrada
- Cada destino tiene una entrada visible principal.
- No repetir la misma acción en topbar, rail y panel a la vez.
- Un selector si hace falta.
- Un botón si ejecuta.
- Un detalle si informa.

## Paneles

### 1. Chat
- **Función:** controlar BAGO con texto corto.
- **Simbología:** burbuja, chips, prompt, trace opcional.
- **Estética:** limpia, dominante, sin ruido técnico sobrante.
- **Mecánica:** escribir o pulsar atajos; enviar al backend; recibir respuesta real.
- **Alertas:** `error` si falla el envío, `blocked` si no está habilitado, `running` durante ejecución.
- **Sirve para:** pedir estado, abrir paneles, cambiar contexto, ejecutar acciones, reducir escritura.

### 2. Overview
- **Función:** resumen operativo del sistema.
- **Simbología:** semáforo, resumen, ruta corta.
- **Estética:** compacta, ejecutiva, de cabina.
- **Mecánica:** alternar entre estado, decisiones, restricciones y vista completa.
- **Alertas:** `warn` si el objetivo está incompleto, `error` si no hay snapshot.
- **Sirve para:** entender qué está pasando sin entrar en módulos.

### 3. Workspace
- **Función:** mostrar la autoridad de rutas y el workspace real.
- **Simbología:** raíz, scope, árbol lógico.
- **Estética:** técnica, de infraestructura.
- **Mecánica:** leer project/workspace/scope/id y ver el detalle contractual.
- **Alertas:** `warn` si hay desalineación entre raíces, `error` si la raíz no está confirmada.
- **Sirve para:** saber dónde opera BAGO y con qué alcance.

### 4. Files
- **Función:** navegar archivos reales del proyecto.
- **Simbología:** documento, lista, lupa.
- **Estética:** ordenada, escaneable.
- **Mecánica:** buscar, abrir y leer archivos con selección directa.
- **Alertas:** `warn` si falta índice, `error` si no hay acceso o no hay resultados.
- **Sirve para:** encontrar y abrir contenido sin salir del manager.

### 5. Context
- **Función:** enseñar presupuesto de contexto y límites.
- **Simbología:** batería, barra, recibo.
- **Estética:** contenida, casi de consola.
- **Mecánica:** mostrar configured, occupied, available y reserve; cambiar entre lecturas si hace falta.
- **Alertas:** `warn` si se acerca al límite, `error` si falla la lectura.
- **Sirve para:** decidir cuánto cabe y qué está ocupando el buffer.

### 6. Model
- **Función:** elegir provider y modelo efectivo.
- **Simbología:** proveedor, switch, foco.
- **Estética:** técnica, sin marketing.
- **Mecánica:** seleccionar item, ver nested models y ejecutar cambio contractual.
- **Alertas:** `blocked` si requiere aprobación, `error` si el provider no existe o no está disponible.
- **Sirve para:** controlar el motor de la sesión.

### 7. Tools
- **Función:** exponer herramientas, permisos y disponibilidad.
- **Simbología:** llave, engranaje, permiso.
- **Estética:** utilitaria, clara.
- **Mecánica:** ver herramienta, estado y requisito de aprobación.
- **Alertas:** `blocked` si no se puede usar, `warn` si está limitada, `error` si falta contrato.
- **Sirve para:** saber qué puede ejecutar la sesión y bajo qué condiciones.

### 8. Roadmap
- **Función:** seguir iteraciones, fases y verificación.
- **Simbología:** camino, hitos, check.
- **Estética:** progresiva, legible.
- **Mecánica:** seleccionar una iteración y ver objetivo, fases y verificación.
- **Alertas:** `warn` si la fase no está validada, `error` si la verificación falla.
- **Sirve para:** ver el plan y su estado real.

### 9. Reflexive
- **Función:** formalizar intención desde lenguaje natural.
- **Simbología:** lupa, espejo, fórmula.
- **Estética:** analítica, de auditoría.
- **Mecánica:** escribir pregunta, analizar, revisar historial y reglas.
- **Alertas:** `warn` si hay ambigüedad, `error` si no se puede formalizar.
- **Sirve para:** convertir texto en intención operativa y reducir malentendidos.

### 10. Pipeline
- **Función:** mostrar el flujo de ejecución y el paso activo.
- **Simbología:** secuencia, flecha, nodo.
- **Estética:** lineal, jerárquica.
- **Mecánica:** elegir paso, ver detalle y seguir el estado de ejecución.
- **Alertas:** `running` si está vivo, `blocked` si no avanza, `error` si rompe.
- **Sirve para:** entender cómo progresa una ejecución.

### 11. Evidence
- **Función:** enseñar trazabilidad real.
- **Simbología:** receipt, huella, prueba.
- **Estética:** forense, seca, verificable.
- **Mecánica:** alternar entre último resultado, centro de evidencia y actividad reciente.
- **Alertas:** `error` si no hay evidencia, `warn` si la evidencia es parcial.
- **Sirve para:** comprobar qué hizo el sistema y con qué soporte.

### 12. Sessions
- **Función:** ver sesión activa e historial persistido.
- **Simbología:** archivo, sello, continuidad.
- **Estética:** persistente, documental.
- **Mecánica:** leer sesión actual, persistencia y continuidad.
- **Alertas:** `warn` si no persistió, `error` si no se puede recuperar.
- **Sirve para:** retomar trabajo sin perder estado.

### 13. System
- **Función:** diagnosticar runtime, bridge y salud.
- **Simbología:** diagnóstico, puente, señal.
- **Estética:** de servicio, no decorativa.
- **Mecánica:** mostrar conexión, bridge, modo operativo y pipeline.
- **Alertas:** `warn` si hay degradación, `error` si el bridge falla.
- **Sirve para:** detectar problemas de infraestructura.

### 14. Console
- **Función:** auditar el último evento y el último resultado.
- **Simbología:** log, traza, registro.
- **Estética:** funcional, de depuración.
- **Mecánica:** ver actividad reciente, resultados y eventos.
- **Alertas:** `warn` si falta trazabilidad, `error` si hubo una falla.
- **Sirve para:** revisar qué ocurrió hace un momento.

## Contratos de interacción

### Chat primero
- El usuario debe poder pedir la mayoría de operaciones con frases cortas.
- El panel sólo confirma, selecciona y expone detalle.

### Un control por propósito
- Si un control cambia superficie, debe hacerlo de forma clara.
- Si un control ejecuta, debe mostrar feedback.
- Si un control no altera estado, no debe existir.

### Texto mínimo
- Títulos cortos.
- Subtítulos solo si aportan intención.
- Ayuda textual breve, no explicación redundante.

## Ejemplos de comandos por chat
```text
abre workspace
muéstrame context
cambia a ollama local
ver evidence de este turno
abre roadmap
```

## Antipatrones
- Botones sin efecto.
- Sliders decorativos.
- Vistas duplicadas para la misma acción.
- Textos largos que no cambian decisión.
- Paneles que parecen dashboards pero no exponen contrato.

## Criterio de cierre
- Cada panel debe decir qué hace, qué estado refleja, qué alertas puede emitir y qué acción real permite.
- Si no cumple eso, no está listo.
