# Documento de Implementacion: Interprete Reflexivo

Status: implementation_started
Owner: BAGO core

## 1. Objetivo

Construir un sistema que reciba una pregunta en lenguaje natural, la descomponga, detecte ambiguedad, formalice su estructura, evalua alternativas de interpretacion y devuelva una respuesta auditada con trazabilidad, confianza y limites.

El sistema debe poder:

- Leer una pregunta y su contexto.
- Separar datos, incognitas, restricciones y objetivo.
- Detectar ambiguedad y presuposiciones.
- Generar interpretaciones alternativas.
- Elegir una interpretacion principal justificada.
- Formalizar la pregunta en una estructura logica o matematica.
- Registrar evidencia y decisiones.
- Explicar como llego a la interpretacion.
- Detectar falsa comprension y autorreferencia.

## 1.1 Complemento operativo CAPTAR

El metodo CAPTAR queda aceptado como complemento pedagogico y operativo del
interprete reflexivo. No sustituye `ReflexiveQuestionRecord`, `ContextEnvelope`
ni `ContextReceipt`; define una secuencia previa para convertir una pregunta en
contrato de respuesta antes de producir la respuesta final.

Referencia: `docs/CAPTAR_INTERPRETATION_MAPPING.md`.

## 2. Alcance

### Incluye

- Parser de preguntas.
- Motor de ambiguedad.
- Formalizador.
- Capa metacognitiva.
- Detector de autorreferencia.
- Registro de evidencia y auditoria.
- UI minima de inspeccion.
- Suite de pruebas.

### No incluye

- Entrenamiento de modelos base.
- Integraciones externas no necesarias.
- Despliegue cloud.
- Funciones no auditables.

## 3. Contrato de entrada

```json
{
  "question_id": "Q-0001",
  "text": "string",
  "context": {
    "domain": "string",
    "conversation_history": [],
    "constraints": [],
    "user_profile": {},
    "metadata": {}
  }
}
```

## 4. Contrato de salida

```json
{
  "question_id": "Q-0001",
  "literal_reading": "string",
  "intent": "string",
  "data": [],
  "unknowns": [],
  "context_factors": [],
  "assumptions": [],
  "alternatives": [],
  "selected_interpretation": {
    "summary": "string",
    "reason": "string",
    "confidence": 0.0
  },
  "formalization": {
    "type": "logic|math|hybrid",
    "variables": [],
    "relations": [],
    "constraints": [],
    "objective": "string"
  },
  "evidence": [],
  "audit_trail": [],
  "self_reference": {
    "detected": false,
    "depth": 0,
    "stop_reason": ""
  },
  "final_answer": "string",
  "limits": [],
  "confidence": 0.0
}
```

## 5. Arquitectura funcional

El sistema debe dividirse en estas capas:

1. Parser de texto.
2. Detector de contexto.
3. Motor de ambiguedad.
4. Formalizador.
5. Capa metacognitiva.
6. Detector de autorreferencia.
7. Validador de evidencia.
8. Finalizador de respuesta.
9. Auditoria persistente.

## 6. Modulos a implementar

### 6.1 Parser de preguntas

Responsabilidad:

- Identificar datos explicitos.
- Identificar incognitas.
- Identificar restricciones.
- Identificar objetivo.
- Detectar intencion literal e implicita.

Entrega:

- Funcion `analyzeQuestion(text, context)`.
- Estructura JSON normalizada.

Criterio de aceptacion:

- Ninguna pregunta entra al sistema sin una lectura estructurada.

### 6.2 Motor de ambiguedad

Responsabilidad:

- Generar interpretaciones alternativas.
- Calcular compatibilidad con contexto.
- Puntuar parsimonia, utilidad y fidelidad semantica.
- Elegir interpretacion principal solo si esta justificada.

Entrega:

- Lista de interpretaciones con score.
- Justificacion de la elegida.

Criterio de aceptacion:

- Si hay ambiguedad real, el sistema no fuerza una unica lectura.

### 6.3 Formalizador

Responsabilidad:

- Traducir la pregunta a logica, formula o esquema hibrido.
- Representar variables, relaciones, restricciones y objetivo.
- Mantener trazabilidad entre texto y formalizacion.

Entrega:

- Objeto `formalization`.
- Mapeo entre fragmentos del texto y variables formales.

Criterio de aceptacion:

- La formalizacion conserva intencion y no solo sintaxis.

### 6.4 Capa metacognitiva

Responsabilidad:

- Explicar por que se eligio esa interpretacion.
- Explicar por que se descartaron otras.
- Registrar incertidumbre remanente.
- Registrar nivel de confianza.

Entrega:

- Resumen metacognitivo.
- `confidence score`.

Criterio de aceptacion:

- El sistema puede explicar su proceso de interpretacion.

### 6.5 Detector de autorreferencia

Responsabilidad:

- Detectar preguntas que hablan de si mismas.
- Detectar bucles recursivos.
- Evitar regresion infinita.
- Aplicar regla de parada por suficiencia.

Entrega:

- Marca `self_reference.detected`.
- Motivo de parada.

Criterio de aceptacion:

- El sistema no entra en bucles infinitos al analizar preguntas espejo.

### 6.6 Evidencia y auditoria

Responsabilidad:

- Vincular cada afirmacion con su evidencia.
- Separar observacion, inferencia y conclusion.
- Guardar trazabilidad completa.

Entrega:

- `audit_trail`.
- `evidence`.

Criterio de aceptacion:

- Toda conclusion importante puede auditarse.

### 6.7 Respuesta final

Responsabilidad:

- Construir la respuesta final.
- Incluir limites y confianza.
- No mezclar la hipotesis de trabajo con la conclusion verificada.

Entrega:

- `final_answer`.
- `limits`.
- `confidence`.

Criterio de aceptacion:

- La salida final es clara, util y auditada.

## 7. Orden de implementacion

1. Definir contrato de datos.
2. Implementar parser.
3. Implementar motor de ambiguedad.
4. Implementar formalizador.
5. Implementar capa metacognitiva.
6. Implementar detector de autorreferencia.
7. Implementar auditoria.
8. Implementar respuesta final.
9. Implementar UI minima.
10. Implementar tests y metricas.

## 8. Requisitos funcionales

- RF1: el sistema debe aceptar texto libre y contexto opcional.
- RF2: el sistema debe devolver una interpretacion estructurada.
- RF3: el sistema debe generar alternativas cuando proceda.
- RF4: el sistema debe formalizar la pregunta.
- RF5: el sistema debe registrar evidencia.
- RF6: el sistema debe mostrar confianza y limites.
- RF7: el sistema debe detectar preguntas autorreferenciales.
- RF8: el sistema debe ser auditable.

## 9. Requisitos no funcionales

- RNF1: trazabilidad obligatoria.
- RNF2: salida reproducible para entrada y contexto equivalentes.
- RNF3: no inventar evidencia.
- RNF4: no ocultar incertidumbre.
- RNF5: diseno modular.
- RNF6: tests obligatorios por modulo.
- RNF7: la UI debe mostrar proceso, no solo resultado.

## 10. UI minima

La interfaz debe mostrar:

- Pregunta original.
- Lectura literal.
- Intencion estimada.
- Interpretaciones alternativas.
- Formalizacion.
- Evidencia.
- Nivel de confianza.
- Auditoria.
- Respuesta final.

## 11. Pruebas obligatorias

El sistema debe probarse con:

- Preguntas claras.
- Preguntas ambiguas.
- Preguntas enganosas.
- Preguntas autorreferenciales.
- Preguntas tecnicas.
- Preguntas con ruido contextual.

Metricas minimas:

- Fidelidad.
- Coherencia.
- Trazabilidad.
- Robustez.
- Capacidad de detectar ambiguedad.
- Capacidad de evitar falsa comprension.

## 12. Criterios de aceptacion global

El proyecto se considera implementado cuando:

- La pregunta se descompone correctamente.
- La ambiguedad se detecta.
- La formalizacion conserva intencion.
- La respuesta incluye evidencia y limites.
- La autorreferencia no bloquea el sistema.
- Los tests pasan.
- La UI muestra el proceso completo.

## 13. Definicion de hecho terminado

Terminado significa:

- Entrada estructurada.
- Interpretacion justificada.
- Formalizacion trazable.
- Auditoria completa.
- Respuesta final verificable.
- Sin bucles, sin evidencias inventadas y sin falsa seguridad.

## 14. Nota de implementacion

El sistema debe tratar la comprension como una cadena unica:

Pregunta -> interpretacion -> contrato -> plan -> autorizacion -> ejecucion -> evidencia -> verificacion -> conclusion -> receipt final -> certificacion.

Si una de estas etapas falla o no puede auditarse, la respuesta debe declararlo en lugar de fingir certeza.

## 15. Estado de implementacion

### Implementado en fase 1

- Contrato determinista de salida en `.bago/core/reflexive_interpreter.py`.
- Funcion `analyze_question(text, context)` para texto libre y contexto opcional.
- Lectura literal, intencion, datos, incognitas, contexto, restricciones y objetivo.
- Formalizacion hibrida `Q = D + X + C + R + O`.
- Deteccion basica de ambiguedad por referentes ausentes, multiobjetivo y pregunta implicita.
- Deteccion de autorreferencia y criterio de parada.
- Punto fijo semantico `F(R*) ~= R*`.
- Evidencia y audit trail enlazados por ids.
- Render compacto para terminal con `format_reflexive_report`.
- Comando terminal `/interpret <pregunta>`.
- Entrada visible en menu/help y catalogo de comandos.
- Mapping natural hacia `/interpret` en `.bago/core/command_intents.json`.
- Tests en `tests/test_reflexive_interpreter.py`.

### Implementado en fase 2

- `SessionManager` construye contexto reflexivo desde la sesion con `build_reflexive_context`.
- Cada turno puede generar analisis reflexivo serializable con `analyze_reflexive_turn`.
- `ContextReceipt.metadata.reflexive_interpretation` conserva lectura, intencion, formalizacion, evidencia, auditoria, autorreferencia y confianza del turno.
- La respuesta guardada en `ContextReceipt.response_content` coincide con la respuesta final entregada al usuario, incluyendo avisos de claims o fallback de workspace.
- Los metadatos de respuesta persistida incluyen `reflexive_interpretation`, `claim_warning` y `workspace_fallback_used`.
- `/interpret <pregunta>` usa el contexto real del `SessionManager` cuando esta disponible.

### Implementado en fase 3

- Ledger append-only de auditorias reflexivas en `.bago/core/reflexive_audit_ledger.py`.
- Archivo de evidencia: `state/evidence/reflexive_interpretations.jsonl`.
- Cada turno LLM enlaza `ContextReceipt.metadata.reflexive_audit`.
- Cada comando `/interpret <pregunta>` persiste tambien su propia auditoria.
- Vista terminal `/interpret history [n]` para inspeccionar los ultimos registros.
- Mapping natural hacia `/interpret` tambien para historial/auditorias reflexivas.

### Implementado en fase 4

- Metricas reproducibles en cada interpretacion: `fidelity`, `coherence`, `traceability`, `ambiguity`, `self_reference_depth`, `invention_risk`.
- El reporte terminal muestra fidelidad, trazabilidad y ambiguedad.
- Los tests obligan a que las metricas viajen en receipts y auditorias.

### Implementado en fase 5

- Endpoint backend `POST /interpret`.
- Endpoint backend `GET /interpret/history?limit=n`.
- Handler modular `.bago/api/handlers_interpret.py`.
- Rutas registradas en `api_dispatch.ROUTE_META`.
- `/routes` y `bago api list-routes --json` exponen las rutas del Interprete Reflexivo.
- La API devuelve `analysis`, `report`, `audit`, `session_id`, `provider` y `model`.
- La API delega en `SessionManager` cuando existe, manteniendo backend como autoridad.

### Implementado en fase 6

- Contrato configurable de reglas en `.bago/core/reflexive_rules.json`.
- Carga de reglas versionadas desde el core del Interprete Reflexivo.
- Cada analisis incluye `rules.contract_version`, `rules.source` y contadores de reglas activas.
- Reporte terminal muestra el contrato de reglas usado.
- Endpoint backend `GET /interpret/rules`.
- `/routes` y `bago api list-routes --json` exponen tambien `/interpret/rules`.

### Implementado en fase 7

- Validador de esquema para `reflexive_rules.json`.
- Si el archivo de reglas no valida, el core cae a reglas builtin y marca el origen como fallback invalido.
- `rules_contract_info()` expone validacion, errores y avisos.
- `/interpret rules` muestra version, origen, ruta, conteos y validacion desde terminal.
- `GET /interpret/rules` devuelve la misma informacion por API.

### Implementado en fase 8

- Cliente frontend real para `POST /interpret`, `GET /interpret/history` y `GET /interpret/rules`.
- Hook `useBagoBackend()` expone analisis, historial y reglas sin estado inventado.
- Modulo visible `Interprete` en el rail del manager.
- Vista unica en `ManagerPanel`: entrada, ejemplo, ultimo turno, analizar, historial, reglas, resultado, formalizacion, evidencia y reporte terminal.
- La UI conserva backend como autoridad: no simula respuestas ni genera analisis local.
- Ajuste visual de contraste real para `--muted2`.
- Ajuste de capa movil de `ModuleRail` a la escala acordada `dropdown=50`.

### Validacion ejecutada

- `python -m py_compile .bago\core\reflexive_interpreter.py .bago\chat\commands.py`
- `python -m pytest tests\test_reflexive_interpreter.py tests\test_task_response_contract.py -q`
- `python bago_core\launcher.py exec /interpret Como formalizo esta pregunta para conservar la intencion?`
- Clasificador natural: `interpreta esta pregunta` -> `/interpret`.
- `python -m py_compile .bago\core\reflexive_interpreter.py .bago\core\session_turn_mixin.py .bago\chat\commands.py`
- `python -m pytest tests\test_reflexive_interpreter.py tests\test_task_response_contract.py tests\test_context_receipt_validator.py -q`
- `python bago_core\launcher.py exec /interpret Que falta aqui para responder bien?`
- `python -m py_compile .bago\core\reflexive_interpreter.py .bago\core\reflexive_audit_ledger.py .bago\core\session_turn_mixin.py .bago\chat\commands.py`
- `python bago_core\launcher.py exec /interpret history 5`
- `python bago_core\launcher.py exec /interpret Como formalizo esta pregunta para conservar la intencion?`
- `python -m py_compile .bago\api\handlers_interpret.py .bago\api\api_dispatch.py .bago\api\api_routes.py .bago\core\reflexive_interpreter.py .bago\core\reflexive_audit_ledger.py .bago\core\session_turn_mixin.py .bago\chat\commands.py`
- `python -m pytest tests\test_reflexive_interpreter.py tests\test_task_response_contract.py tests\test_context_receipt_validator.py tests\test_api_dispatch_route_meta.py -q`
- `python bago_core\launcher.py api list-routes --json`
- `python -m pytest tests\test_reflexive_interpreter.py tests\test_api_dispatch_route_meta.py -q`
- `python bago_core\launcher.py exec /interpret Como formalizo esta pregunta para conservar la intencion?`
- `python bago_core\launcher.py exec /interpret rules`
- `npm run manager:build-ui`
- `python -m pytest tests\test_reflexive_interpreter.py tests\test_task_response_contract.py tests\test_context_receipt_validator.py tests\test_api_dispatch_route_meta.py -q`
- `python bago_core\launcher.py api list-routes --json`
- `python bago_core\launcher.py exec /interpret "¿Como traducirias esta pregunta a una formula matematica para entender lo que te estoy preguntando?"`
- `python -c "<contraste #8492ad contra fondos principales>"`

### Pendiente fase 9

- Unificar el contrato moderno `/api/v1/ui/bootstrap` con el modulo `Interprete` para que el snapshot backend tambien publique su estado como centro nativo.
