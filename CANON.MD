# CANON OPERATIVO Y DE CERTIFICACIÓN DE BAGO

## Versión 1.0-RC4 + RC5-R1 fusionada

Estado del documento: canon integrado en consolidación.

Procedencia de esta consolidación: base RC4 consolidada con los complementos RC5-R1 que amplían interpretación, evidencia, memoria, contratos UI y resistencia a la falsedad. La fusión no sustituye la base RC4; la extiende donde RC5-R1 aporta contratos más completos.

Objetivo: establecer una base operacional fiable, trazable, verificable y certificable para BAGO.

## Regla de versionado

- `RC4` es la base operacional.
- `RC5-R1` es la extensión complementaria que añade contratos de interpretación, evidencia, memoria, manager y UI.
- `4.8` es la primera versión legítima que cumple la base RC4 más las ampliaciones RC5-R1 de forma verificable.
- `5.0` solo puede usarse para un salto mayor posterior, no para cerrar parcialmente la base fusionada.
- Si una capacidad no cumple la base RC4, no puede declararse `4.8`.
- Si una capacidad cumple solo parcialmente la base fusionada, debe marcarse como pendiente, parcial o `implemented_unverified`, según corresponda.

## Regla de autoridad

- `RC4` no se modifica salvo para detectar un posible `fail`.
- Si se detecta un `fail`, se debe preguntar cómo proceder antes de cambiar nada.
- Las opciones propuestas deben ser concretas y operativas.
- No se aceptan reinterpretaciones, atajos semánticos ni brechas lingüísticas para declarar cumplimiento sin evidencia.

## Regla RC4 de entrada y salida

- Toda entrada del programador debe traducirse primero a restricciones RC4.
- Toda salida del programador debe responder en orden RC4: estado, evidencia, cambio, validación, siguiente paso.
- Si una petición o una respuesta no encaja con RC4, se marca como `fail`, parcial o pendiente, nunca como cumplida.

## Regla de respuesta técnica

- Las respuestas deben usar vocabulario técnico y citar nombres de archivos o contratos cuando aporte precisión.
- Evita fijar la explicación a una línea concreta salvo que el usuario lo pida expresamente.
- Enfoca la respuesta al canon mutable y al archivo de autoridad que lo sostiene.
- Si hay tensión entre una afirmación y el canon, prioriza el canon mutable y marca la brecha.

## Regla de legado

- Todo legado que deba conservarse se archivará comprimido en un `.zip`.
- Fuera del `.zip` debe existir un índice legible del legado archivado.
- El índice debe incluir como mínimo nombre de archivo, última modificación y datos útiles para localizar o valorar su contenido.
- El contenido histórico no debe competir con `RC4` ni con los contratos vigentes.

## Formato de índice de legado

El índice legible puede ser Markdown, JSON o YAML, pero debe mantener esta estructura mínima:

```text
legacy_index:
  corpus_id: "..."
  archive_name: "legacy_bundle.zip"
  archive_path: "ruta/al/zip"
  generated_at: "RFC3339"
  generated_by: "human|ai"
  purpose: "histórico|referencia|auditoría"
  entries:
    - name: "archivo.ext"
      path_in_archive: "carpeta/archivo.ext"
      last_modified: "RFC3339"
      size_bytes: 1234
      sha256: "..."
      kind: "md|json|py|txt|zip|other"
      notes: "qué contiene y por qué importa"
```

Reglas del índice:

- `name` debe ser el nombre visible del archivo.
- `path_in_archive` debe permitir ubicarlo dentro del `.zip`.
- `last_modified` debe ser la última modificación conocida del archivo.
- `size_bytes` y `sha256` son obligatorios cuando el dato exista.
- `notes` debe ser corto y útil para un programador IA.
- El índice debe ser ordenable por `last_modified` descendente.
- Si un archivo es histórico pero no útil, se puede resumir, pero no omitir sin dejar constancia.

---

# 1. PROPÓSITO

El objetivo de BAGO no es aparentar capacidad, sino demostrarla.

BAGO deberá poder identificar de forma verificable:

dónde está operando;

qué instalación del framework está utilizando;

qué proyecto está manejando;

qué workspace está vinculado;

qué alcance de archivos tiene autorizado;

qué sesión está activa;

qué objetivo mantiene;

qué decisiones siguen vigentes;

qué restricciones debe respetar;

qué provider, adapter, runtime y modelo ejecutan cada petición;

qué contexto se entrega al modelo;

qué información se recupera;

qué archivos se utilizan como evidencia;

qué herramientas están disponibles;

qué herramientas están autorizadas;

qué acciones se solicitan;

qué acciones se ejecutan;

qué resultados se validan;

qué límites se han medido;

qué capacidades están implementadas;

qué capacidades están verificadas;

qué capacidades están certificadas;

qué capacidades continúan pendientes.

La prioridad será la certeza por encima de la velocidad.

Ningún componente podrá declarar como verdadero un estado, una capacidad, una ejecución o un resultado que no esté respaldado por evidencia reproducible.

---

# 2. RESULTADO ESPERADO DE ESTA ITERACIÓN

Esta iteración deberá producir una base operacional fiable.

BAGO deberá:

conocer la instalación activa del framework;

conocer el proyecto vinculado;

conocer el workspace operacional del proyecto;

distinguir framework, proyecto, workspace y alcance autorizado;

mantener sesión, objetivo, decisiones y restricciones;

construir contexto explícito antes de cada llamada relevante al modelo;

recuperar información real del proyecto cuando sea necesaria;

emitir receipts verificables;

representar en la interfaz únicamente estados confirmados;

medir inicialmente sus límites reales;

detectar comportamientos falsos o simulados;

evitar afirmaciones no respaldadas;

permitir verificación adversarial;

preservar las funciones existentes;

adaptar la bienvenida y los menús al estado real detectado.

El cierre de esta iteración no significará que todo BAGO esté terminado.

Significará que BAGO dispone de una base fiable sobre la que se pueden construir capacidades posteriores sin confundir apariencia, ejecución, verificación y certificación.

---

# 3. NO OBJETIVOS DE ESTA ITERACIÓN

No serán condiciones obligatorias para cerrar esta iteración:

certificar todos los modelos;

activar todos los providers cloud;

completar toda la autoevolución;

implementar autonomía total;

certificar todas las configuraciones de hardware;

certificar todos los tamaños posibles de contexto;

rediseñar completamente la interfaz;

reescribir BAGO desde cero;

sustituir componentes funcionales por arquitecturas paralelas;

implementar aprendizaje automático complejo cuando una solución más simple y verificable sea suficiente;

cerrar el canon completo.

Solo serán obligatorios los criterios mínimos definidos para la base operacional.

---

# 4. DEFINICIONES CANÓNICAS

## 4.1. Provider

Provider es la fuente lógica o servicio de inferencia registrado en BAGO.

Ejemplos conceptuales:

ollama-local;

ollama-cloud;

anthropic;

openrouter.

## 4.2. Adapter

Adapter es el componente de BAGO que integra un provider o runtime con los contratos internos del framework.

Se encarga de traducir:

mensajes;

parámetros;

herramientas;

errores;

streaming;

respuestas;

metadatos.

## 4.3. Runtime

Runtime es el motor que carga y ejecuta realmente un modelo.

Ejemplos:

Ollama;

llama.cpp;

otro motor local o remoto.

## 4.4. Modelo

Modelo es la implementación concreta utilizada para una petición.

Ejemplo conceptual:

llama3.2:3b.

## 4.5. Configuración efectiva

Configuración efectiva es el conjunto real de parámetros aplicados durante una ejecución.

Puede incluir:

contexto;

cuantización;

batch;

paralelismo;

capas descargadas en GPU;

tipo de caché KV;

tokens máximos de salida;

temperatura;

plantilla de conversación;

prompt del sistema;

herramientas;

políticas operativas.

## 4.6. Framework root

Framework root es la instalación canónica de BAGO.

Su raíz canónica será la carpeta `.bago` de la instalación activa o del repositorio principal de BAGO.

Ejemplo conceptual:

C:...\BAG4.8.bago

Framework root contendrá los componentes genéricos y reutilizables:

runtime interno;

comandos;

dispatcher;

adaptadores;

contratos;

gestión de sesiones;

gestión de contexto;

bridge;

telemetría;

logging;

herramientas genéricas;

agentes genéricos;

benchmarks comunes;

servicios de certificación;

migraciones;

esquemas.

Framework root no contendrá estado específico de un proyecto externo.

## 4.7. Project root

Project root es la raíz real del proyecto o repositorio vinculado.

Contiene normalmente:

código fuente;

documentación;

recursos;

configuración propia;

tests;

archivos funcionales del proyecto.

Project root no es framework root.

Project root tampoco es workspace root.

## 4.8. Workspace

Workspace es la unidad operacional vinculada a un proyecto.

Su estado canónico vive en:

workspace_root = project_root/.gabo

El workspace contiene:

identidad del proyecto;

manifiesto;

estado operacional;

memoria;

índice;

recuperación;

decisiones;

restricciones;

resúmenes;

receipts;

certificaciones;

artefactos específicos del proyecto.

Workspace no contiene código del framework salvo utilidades explícitas de:

migración;

compatibilidad;

siembra;

diagnóstico temporal.

Estas utilidades deberán estar marcadas y no podrán convertirse en autoridad del framework.

## 4.9. Workspace root

Workspace root es la carpeta `.gabo` del proyecto vinculado.

Su forma canónica será:

workspace_root = project_root/.gabo

En `.gabo` vivirán datos y artefactos específicos del proyecto.

No deberá utilizarse `.gabo` para almacenar componentes genéricos que pertenecen al framework.

## 4.10. Workspace scope root

Workspace scope root es el límite autorizado para que BAGO pueda recuperar, leer, modificar o ejecutar archivos del proyecto.

Normalmente:

workspace_scope_root = project_root

Puede definirse un alcance más limitado cuando la política del workspace lo requiera.

Workspace scope root no deberá ampliarse silenciosamente.

## 4.11. Sesión

Sesión es la unidad persistente de conversación y operación.

Debe conservar:

session_id;

workspace_id;

framework_root;

project_root;

workspace_root;

workspace_scope_root;

objetivo;

decisiones;

restricciones;

provider;

adapter;

runtime;

modelo;

modo;

herramientas autorizadas;

context_revision.

## 4.12. Evidencia

Evidencia es un dato observable que permite verificar una afirmación.

Puede proceder de:

efecto real;

respuesta estructurada;

persistencia;

logs;

runtime;

medición;

test;

archivo;

base de datos;

receipt.

## 4.13. Receipt

Receipt es un registro estructurado de una operación.

No es una explicación narrativa.

Debe contener:

identidad;

entrada;

estado;

resultado;

evidencias;

advertencias;

huella;

identificador de ejecución.

## 4.14. Claim

Claim es una afirmación concreta y verificable sobre el comportamiento o estado de BAGO.

Cada claim deberá disponer de:

identificador;

criterio de aceptación;

test;

resultado;

evidencia;

estado de madurez;

estado de certificación.

## 4.15. Manifiesto del workspace

El manifiesto es la fuente canónica de identidad del workspace dentro de `.gabo`.

Deberá contener como mínimo:

workspace_id;

project_root;

workspace_root;

workspace_scope_root;

versión del esquema;

fecha de creación;

estado de migración;

revisión;

política de acceso.

## 4.16. Complementos RC5-R1

RC5-R1 añade contratos que RC4 no formalizaba con suficiente precisión y que deben considerarse parte del canon fusionado cuando el flujo operativo los use:

- `ManagerContext`: contexto consumido realmente por el backend en una acción.
- `ManagerContextReceipt`: receipt estructurado de ese contexto consumido.
- `DemoState`: estado demo aislado, solo permitido en modo demo y nunca como autoridad normal.
- `PresentationSnapshotState`: snapshot de presentación con semántica de `ready`, `stale` y `degraded`.
- `ModelCatalog`: catálogo separado en `installed`, `configured`, `detected`, `installable`, `loaded` y `effective`.
- `ReflexiveQuestionRecord`: registro de pregunta espejo, lectura literal, formalización y evidencia.

## 4.17. Reglas RC5-R1 complementarias

- Una sesión o UI no podrá fingir contexto consumido si no existe `ManagerContextReceipt`.
- Un `snapshot` fallido no podrá seguir presentándose como `ready` si su estado real es `stale` o `degraded`.
- La selección de modelos operativos será `installed-only` por defecto.
- Las respuestas reflexivas deberán declarar qué se interpretó, qué evidencia soporta la interpretación y qué parte queda abierta.
- Los estados demo deberán quedar aislados y etiquetados; nunca podrán competir con la autoridad del backend real.

---

# 5. AUTORIDAD DE RUTAS Y CAPAS

BAGO deberá separar estrictamente:

framework;

proyecto;

workspace;

alcance autorizado;

sesión;

ejecución.

## 5.1. Política canónica

`.bago` representa el framework BAGO.

`project_root` representa la raíz real del proyecto.

`.gabo` representa el estado operacional del workspace.

`workspace_scope_root` representa el alcance autorizado de operaciones.

Los componentes genéricos para todos los workspaces vivirán en framework root.

Los artefactos específicos del proyecto vivirán en workspace root.

El código y los archivos normales del proyecto vivirán en project root.

## 5.2. Componentes de framework

En `.bago` vivirán componentes reutilizables:

comandos;

adaptadores;

contratos;

servicios;

runtime interno;

herramientas genéricas;

telemetría;

certificación;

gestión de contexto;

gestión de sesiones.

Ningún artefacto específico de un proyecto podrá utilizar framework root como almacenamiento canónico.

## 5.3. Componentes del proyecto

En project root vivirán:

código;

documentación;

recursos;

tests;

configuración propia.

Un archivo del proyecto podrá utilizarse como evidencia cuando:

pertenezca al workspace vinculado;

esté dentro de workspace_scope_root;

sea accesible;

su revisión esté vigente.

## 5.4. Componentes del workspace

En `.gabo` vivirán:

manifiesto;

workspace_id;

memoria;

índice;

recuperación;

estado operacional;

receipts;

resúmenes;

decisiones;

certificaciones específicas;

artefactos generados para ese proyecto.

La presencia de una herramienta dentro de `.gabo` no la convertirá en herramienta global del framework.

## 5.5. Regla de ubicación

Si una pieza vive en `.bago` y es específica de un proyecto, está mal ubicada.

Si una pieza vive en `.gabo` y es genérica para todos los workspaces, está mal ubicada.

Si un archivo está fuera de workspace_scope_root, no podrá utilizarse como evidencia del proyecto sin autorización explícita.

## 5.6. Prohibiciones

La UI no podrá convertir una ruta local en autoridad por el hecho de mostrarla.

La terminal no podrá heredar automáticamente un proyecto desde el directorio actual.

La API no podrá aceptar una ruta del cliente como fuente de verdad sin validarla contra la sesión y el manifiesto.

Un workspace no podrá redefinir framework root.

Framework root no podrá contener estado canónico de un proyecto externo.

---

# 6. COMPATIBILIDAD LEGACY

Una carpeta `.bago` situada dentro de un proyecto externo no será el formato canónico del workspace.

Solo podrá reconocerse para:

detección legacy;

lectura durante migración;

conversión a `.gabo`;

compatibilidad temporal;

recuperación controlada de datos antiguos.

Una `.bago` legacy dentro de un proyecto:

no será fuente primaria de estado;

no competirá con `.gabo`;

no podrá convertirse en framework root;

no recibirá nuevos artefactos canónicos;

no sobrescribirá el manifiesto de `.gabo`.

Si `.bago` y `.gabo` existen simultáneamente:

`.gabo` será la autoridad;

`.bago` será considerada legacy;

las discrepancias se registrarán;

no se fusionarán estados silenciosamente.

Después de migrar, la carpeta legacy deberá quedar:

archivada;

marcada como migrada;

ignorada;

o eliminada mediante autorización explícita.

---

# 7. PRINCIPIO FUNDAMENTAL

Toda afirmación operativa deberá seguir esta cadena:

afirmación;

condición verificable;

ejecución;

evidencia;

validación;

conclusión;

receipt.

La fórmula fundamental será:

AFIRMACIÓN VÁLIDA =
CONDICIÓN VERIFICABLE
MÁS EVIDENCIA OBSERVABLE
MÁS VALIDACIÓN REPRODUCIBLE

La existencia de código no demuestra funcionamiento.

La existencia de una interfaz no demuestra ejecución del backend.

La ausencia de excepciones no demuestra corrección.

Una respuesta HTTP satisfactoria no demuestra que la operación interna haya sido válida.

Un test positivo aislado no demuestra resistencia a fallos.

Una captura de pantalla no demuestra el estado real del backend.

Una explicación del modelo no es evidencia suficiente.

---

# 8. PRINCIPIOS OPERATIVOS OBLIGATORIOS

BAGO deberá:

medir antes de optimizar;

diferenciar valores declarados, configurados, aplicados, observados, calculados, estimados y certificados;

mantener una única autoridad de estado;

no inventar rutas, archivos, módulos, herramientas, resultados ni capacidades;

distinguir evidencia, inferencia, propuesta, intención y ejecución;

mantener trazabilidad entre afirmación, fuente, evidencia, cálculo y conclusión;

no modificar configuraciones silenciosamente;

reutilizar la arquitectura existente antes de crear sistemas nuevos;

no certificar con una sola ejecución;

no permitir que una media oculte fallos críticos;

no truncar silenciosamente instrucciones, decisiones o restricciones;

mantener cada sesión vinculada a un workspace real;

validar las autoridades de ruta antes de operar;

fallar de forma segura;

declarar expresamente lo que no conoce;

permitir reversión de cambios importantes;

preservar las capacidades existentes por defecto;

mostrar únicamente acciones coherentes con el estado real.

---

# 9. SEPARACIÓN DE ESTADOS

Nunca se utilizará un único estado para representar ejecución, madurez y certificación.

## 9.1. Estado de ejecución

Estados:

pending;

running;

done;

failed;

blocked.

Done significará:

ejecución terminada;

salida validada;

evidencia presente;

ausencia de error bloqueante.

Done no significará certified.

## 9.2. Estado de madurez

Estados:

not_implemented;

implemented_unverified;

partially_tested;

verified_in_isolation;

verified_in_integration.

## 9.3. Estado de certificación

Estados:

not_requested;

pending;

certified;

rejected;

invalidated.

Certified significará:

verified_in_integration;

separación de roles;

pruebas adversariales;

repeticiones suficientes;

resultado reproducible;

receipt completo;

ausencia de bloqueos críticos.

---

# 10. PROHIBICIÓN DE AUTOCERTIFICACIÓN

El implementador no podrá declarar certificada su propia implementación basándose únicamente en su conclusión.

Podrá declarar:

implementado sin verificar;

probado parcialmente;

verificado en aislamiento;

verificado en integración;

pendiente de certificación.

La certificación exigirá una separación efectiva mediante:

otro modelo;

otro agente;

otra sesión limpia;

otro proceso;

un harness determinista;

una suite adversarial protegida;

una revisión humana reproducible.

No será obligatorio utilizar otro modelo.

Sí será obligatorio que el certificador pueda intentar falsar la afirmación.

---

# 11. REGISTRO CANÓNICO DE CLAIMS

Cada afirmación verificable tendrá un claim_id único.

El registro deberá contener:

claim_id;

capacidad;

afirmación;

criticidad;

componente responsable;

condición de aceptación;

tests asociados;

comandos;

entradas;

resultado esperado;

resultado observado;

código de salida;

evidencias;

CertificationFingerprint;

estado de ejecución;

estado de madurez;

estado de certificación;

fecha;

causa de invalidación.

Una afirmación sin prueba no podrá considerarse aceptada.

Una afirmación sin evidencia no podrá mostrarse como confirmada.

---

# 12. CRITICIDAD

## 12.1. Critical

Puede:

dañar el workspace;

violar permisos;

falsear evidencias;

usar el modelo equivocado;

ejecutar acciones no autorizadas;

inventar resultados;

certificar incorrectamente;

perder restricciones de seguridad.

Bloquea certificación y cierre de iteración.

## 12.2. High

Rompe el flujo principal o produce un estado operacional incorrecto.

Bloquea la capacidad afectada.

## 12.3. Medium

Degrada precisión, rendimiento o experiencia sin perder seguridad o trazabilidad.

Puede quedar pendiente si se documenta.

## 12.4. Low

Problema secundario o visual sin impacto operacional relevante.

Puede quedar como deuda declarada.

---

# 13. FUENTE ÚNICA DE VERDAD

El backend será la autoridad del estado operacional.

Los datos canónicos serán:

framework_version;

framework_root;

project_root;

workspace_id;

workspace_root;

workspace_scope_root;

session_id;

provider;

adapter;

runtime;

model;

operating_mode;

index_status;

context_revision;

configured_context;

occupied_context;

available_context;

pipeline_status.

## 13.1. Framework root

Solo podrá proceder de la instalación activa de BAGO y del backend.

La UI, el workspace o el directorio actual no podrán redefinirlo.

## 13.2. Project root

Deberá proceder del manifiesto del workspace y de la sesión vinculada.

El backend deberá comprobar que:

existe;

es accesible;

corresponde al workspace_id;

contiene o se relaciona con workspace_root;

está dentro de la política autorizada.

## 13.3. Workspace root

Deberá proceder de:

la sesión;

el manifiesto de `.gabo`;

la validación del backend.

No podrá derivarse únicamente de una selección visual.

## 13.4. Workspace scope root

Deberá proceder del manifiesto y de la política del workspace.

No podrá ampliarse sin autorización.

## 13.5. Regla de incoherencia

Cuando exista una contradicción, prevalecerá el backend.

Cuando el backend no pueda demostrar un valor, deberá declarar:

unknown;

invalid;

blocked;

not_available.

Nunca se utilizará una ruta estimada como confirmada.

---

# 14. SESIÓN OPERATIVA

Toda sesión deberá estar vinculada explícitamente a:

session_id;

framework_root;

workspace_id;

workspace_root;

project_root;

workspace_scope_root.

También deberá conservar:

repositorio;

rama;

objetivo;

decisiones;

restricciones;

context_revision;

provider;

adapter;

runtime;

modelo;

modo;

herramientas autorizadas;

estado del índice.

Si no existe workspace_root válido, BAGO no asumirá ninguno.

Si no existe project_root válido, BAGO no operará sobre archivos del proyecto.

Si el usuario cambia de proyecto, la sesión deberá:

suspender o cerrar el vínculo actual;

seleccionar el nuevo proyecto;

localizar o crear `.gabo`;

validar el manifiesto;

registrar workspace_id;

actualizar raíces;

incrementar context_revision;

invalidar contexto y certificaciones incompatibles.

No se heredará un proyecto por abrir BAGO.

El directorio actual solo podrá ser candidato de detección.

Nunca será autoridad final sin validación.

---

# 15. DETECCIÓN Y VINCULACIÓN DEL WORKSPACE

La detección deberá ser consciente del estado real.

BAGO deberá determinar:

si framework_root es válido;

si existe un project_root candidato;

si existe project_root/.gabo;

si el manifiesto de `.gabo` es válido;

si la sesión está vinculada al workspace detectado;

si existe una `.bago` legacy;

si existen incoherencias entre rutas, manifiesto y sesión.

La detección no significará automáticamente vinculación.

La vinculación deberá quedar registrada en la sesión.

## 15.1. `.gabo` válida y sesión vinculada

Si `.gabo` existe, el manifiesto es válido y la sesión está vinculada:

BAGO deberá mostrar el workspace actual;

mostrar el proyecto;

mostrar la sesión;

mostrar el contexto;

permitir continuar, inspeccionar, verificar o cambiar de proyecto;

no ofrecer inicializar `.gabo`;

no crear otra estructura.

## 15.2. `.gabo` válida y sesión no vinculada

Si `.gabo` existe y es válida, pero la sesión no está vinculada:

BAGO deberá informar qué workspace ha detectado;

ofrecer vincular la sesión;

permitir ver detalles;

permitir recuperar una sesión anterior;

permitir seleccionar otro proyecto;

no ofrecer inicializar otro `.gabo`.

## 15.3. `.gabo` existente pero inválida

Si `.gabo` existe, pero el manifiesto es inválido o incoherente:

BAGO deberá mostrar el problema;

bloquear operaciones de proyecto;

ofrecer verificar;

ofrecer reparar;

ofrecer migrar cuando corresponda;

ofrecer modo seguro o solo lectura;

no crear silenciosamente otro `.gabo`.

## 15.4. `.gabo` inexistente

Solo cuando `.gabo` no exista, BAGO podrá ofrecer:

inicializar `.gabo`;

vincular otro proyecto;

abrir una sesión anterior;

examinar en modo de solo lectura;

ejecutar diagnóstico.

## 15.5. `.bago` legacy sin `.gabo`

Si existe una `.bago` legacy dentro del proyecto y no existe `.gabo`:

BAGO deberá informar que ha detectado un formato legacy;

ofrecer inspección;

ofrecer migración explícita;

ofrecer crear `.gabo` sin importar datos;

ofrecer modo de solo lectura;

no tratar la `.bago` legacy como workspace canónico.

## 15.6. Regla canónica

SI `.gabo` EXISTE Y ES VÁLIDA:

mostrar identidad y estado del workspace;

no ofrecer inicialización.

SI `.gabo` EXISTE Y LA SESIÓN NO ESTÁ VINCULADA:

ofrecer vincular la sesión;

no ofrecer inicialización.

SI `.gabo` EXISTE PERO ES INVÁLIDA:

ofrecer verificar, reparar o migrar;

no inicializar silenciosamente.

SI `.gabo` NO EXISTE:

ofrecer inicialización.

SI SOLO EXISTE `.bago` LEGACY:

ofrecer migración explícita.

---

# 16. CONSTRUCCIÓN DEL CONTEXTO

El backend resolverá y validará el workspace activo antes de construir el prompt.

La UI podrá comunicar:

archivo seleccionado;

archivos abiertos;

vista activa;

acción solicitada.

La UI no podrá decidir por sí sola el workspace real.

Antes de llamar al modelo, el backend deberá comprobar:

framework_root válido;

project_root válido;

workspace_root válido;

workspace_scope_root válido;

workspace_id coherente;

sesión vinculada;

revisión vigente;

provider efectivo;

adapter efectivo;

runtime efectivo;

modelo efectivo;

permisos.

Si workspace_id, workspace_root y manifiesto no coinciden, el envío deberá bloquearse.

Si project_root y workspace_scope_root son incoherentes, las operaciones sobre archivos deberán bloquearse.

---

# 17. NIVELES DEL CONTEXTO

## 17.1. Contexto estable

Incluye:

identidad;

framework;

workspace;

objetivo;

restricciones;

decisiones;

permisos;

provider;

modelo.

## 17.2. Contexto dinámico

Incluye:

archivo seleccionado;

archivos abiertos;

rama;

vista activa;

tarea;

procesos;

trabajos;

errores recientes.

## 17.3. Contexto recuperado

Incluye:

fragmentos;

definiciones;

resultados;

evidencias;

decisiones históricas;

información localizada en el proyecto.

Solo se enviará el contenido necesario.

---

# 18. CONTEXTENVELOPE

Toda llamada relevante al modelo deberá derivarse de un ContextEnvelope verificable.

El ContextEnvelope deberá incluir:

session_id;

framework_version;

framework_root;

project_root;

workspace_id;

workspace_root;

workspace_scope_root;

source_of_truth_version;

context_revision;

objetivo;

decisiones;

restricciones;

provider;

adapter;

runtime;

modelo;

modo;

archivos representados;

fragmentos recuperados;

resumen operativo;

herramientas disponibles;

herramientas autorizadas;

presupuesto de tokens;

advertencias;

execution_id.

Antes de enviarlo, BAGO deberá validar:

que framework_root corresponde a la instalación activa;

que workspace_root corresponde al workspace_id;

que project_root corresponde al manifiesto;

que las rutas están dentro de workspace_scope_root;

que no se mezclan archivos de framework y proyecto;

que context_revision sigue vigente.

Una incoherencia producirá:

blocked;

causa estructurada;

evidencia;

ausencia de llamada al modelo.

---

# 19. CONTEXTRECEIPT

Después de la llamada al modelo deberá generarse un ContextReceipt.

Deberá indicar:

session_id;

framework_root;

project_root;

workspace_id;

workspace_root;

workspace_scope_root;

context_revision;

provider efectivo;

adapter efectivo;

runtime efectivo;

modelo efectivo;

tokens enviados;

tokens reservados;

tokens disponibles;

archivos representados;

fragmentos recuperados;

resumen cargado;

herramientas disponibles;

herramientas autorizadas;

advertencias;

reducciones aplicadas;

factor limitante;

execution_id;

estado final.

El ContextReceipt deberá coincidir con la sesión real.

Un clic, un envío, un temporizador o una respuesta HTTP no podrán marcar el paso como done sin un receipt válido.

---

# 20. RECUPERACIÓN DEL WORKSPACE

La recuperación operará dentro de:

workspace_scope_root

Normalmente:

workspace_scope_root = project_root

La recuperación no deberá limitarse a `.gabo`, porque el código del proyecto puede vivir fuera de dicha carpeta.

No podrá leer fuera de workspace_scope_root sin autorización explícita.

Cada fragmento deberá registrar:

ruta absoluta normalizada;

ruta relativa respecto a project_root;

workspace_id;

project_root;

workspace_scope_root;

hash o revisión del archivo;

posición;

método;

puntuación;

execution_id.

El framework no podrá utilizar sus propios archivos como evidencia del proyecto salvo que:

el workspace activo sea BAGO;

la tarea trate expresamente sobre el framework;

el test lo autorice.

Antes de utilizar un fragmento deberá comprobarse:

que el archivo existe;

que pertenece al workspace;

que está dentro del alcance;

que no procede de una sesión anterior;

que su revisión no está obsoleta;

que no está desplazado por una fuente canónica más reciente.

Una ruta fuera del alcance deberá rechazarse y registrarse.

---

# 21. MOTOR DE INTENCIONES

El motor no podrá presentarse como aprendizaje o generalización cuando dependa principalmente de:

coincidencia exacta;

substrings;

palabras clave;

evaluación del dataset contra sí mismo.

El entrenamiento deberá separar:

entrenamiento;

validación;

prueba.

Las pruebas deberán incluir:

frases nuevas;

paráfrasis;

sinónimos;

negaciones;

ambigüedad;

casos fuera de distribución;

intenciones cercanas;

mensajes que deben continuar como chat.

Se medirán:

aciertos;

falsos positivos;

falsos negativos;

cobertura;

confianza;

casos no clasificados.

Una intención insegura no ejecutará automáticamente un comando.

BAGO podrá:

pedir confirmación;

continuar como conversación;

declarar intención desconocida.

La evolución solo podrá declararse cuando exista un cambio:

real;

persistido;

medible;

reversible;

comparado contra una referencia.

---

# 22. MEDICIÓN DEL CONTEXTO

BAGO diferenciará:

contexto declarado;

contexto posicional;

contexto permitido por adapter;

contexto permitido por runtime;

contexto configurado;

contexto aplicado;

contexto máximo verificado por memoria;

contexto cognitivo certificado;

contexto de trabajo;

contexto ocupado;

contexto disponible.

Cada dato deberá clasificarse como:

observado;

calculado;

estimado;

declarado;

no disponible.

Una estimación nunca se mostrará como observación.

---

# 23. LÍMITE TÉCNICO

La fórmula será:

C_técnico = mínimo de:

C_modelo;

C_posicional;

C_adapter;

C_runtime;

C_configurado;

C_aplicado.

El espacio técnico será:

C_entrada_técnica =
C_técnico
− T_sistema
− T_herramientas
− T_salida_reservada
− T_especiales

Los tokens deberán contarse con el tokenizador exacto.

No se utilizarán aproximaciones por palabras o caracteres como resultado certificado.

---

# 24. MEMORIA Y CACHÉ KV

La dimensión de cada cabeza será:

D_cabeza =
H_oculto / N_cabezas_atención

La memoria teórica KV por token será:

M_KV_por_token =
L × N_cabezas_KV × D_cabeza × (B_claves + B_valores)

Cuando claves y valores utilicen el mismo tipo:

M_KV_por_token =
2 × L × N_cabezas_KV × D_cabeza × B_KV

El paralelismo solo se multiplicará cuando se confirme que cada secuencia conserva una caché independiente.

RAM y VRAM se medirán por separado.

La estimación teórica será:

C_memoria_teórico =
floor(M_disponible_KV / M_KV_por_token)

Esta cifra será predictiva, no certificada.

---

# 25. LÍMITE REAL DE MEMORIA

Un contexto solo será válido cuando:

el modelo cargue;

el runtime aplique el valor solicitado;

el prefill termine;

se genere la salida reservada;

no exista OOM;

no exista truncamiento;

no exista reducción silenciosa;

la paginación permanezca dentro del umbral;

la caché se sitúe donde corresponde;

el proceso permanezca estable;

el resultado sea reproducible.

La medición incluirá:

sondeo progresivo;

valor válido;

valor fallido;

búsqueda binaria;

arranque frío;

arranque caliente;

generación corta;

generación máxima;

presión controlada;

paralelismo;

repeticiones.

Se registrarán:

RAM;

VRAM;

paginación;

contexto solicitado;

contexto aplicado;

prefill;

generación;

código de salida;

logs;

errores.

---

# 26. LÍMITE COGNITIVO

El benchmark deberá medir:

seguimiento de instrucciones;

recuperación;

razonamiento;

contradicciones;

herramientas;

código;

continuidad;

fidelidad a evidencia;

resistencia a inventar.

La puntuación podrá expresarse como:

S(C) =
wI × SI(C)

* wR × SR(C)
* wJ × SJ(C)
* wC × SC(C)
* wH × SH(C)

Los pesos sumarán uno.

La información crítica se probará en:

0 %;

25 %;

50 %;

75 %;

100 %.

La puntuación robusta será la peor posición.

El límite inferior de confianza será:

S_inferior(C) =
media(C)
− 1,96 × desviación_estándar(C) / sqrt(N)

No se seleccionará el mejor intento.

No se certificará con una sola semilla.

Una media no podrá ocultar un fallo crítico.

---

# 27. RESERVA OPERATIVA

La reserva derivará de telemetría real.

Considerará:

tokens de salida;

tokens de herramientas;

errores;

reintentos;

crecimiento de sesión;

resúmenes;

evidencias;

respuestas externas.

La fórmula será:

R_operativo(tipo) =
Q0,99(
T_salida

* T_herramientas
* T_reintentos
* T_crecimiento
* T_evidencias
  )

Se diferenciarán al menos:

consulta;

auditoría;

modificación de código;

diagnóstico;

uso intensivo de herramientas;

sesión autónoma prolongada.

No se utilizará un porcentaje fijo como valor certificado.

---

# 28. CONTEXTO DE TRABAJO

La fórmula será:

C_trabajo(tipo) =
mínimo de:

C_técnico;

C_memoria_certificado;

C_cognitivo_certificado(tipo);

menos R_operativo(tipo)

El contexto disponible será:

C_disponible_ahora =
C_trabajo − C_ocupado_actual

BAGO mostrará por separado:

máximo certificado;

contexto de trabajo;

contexto ocupado;

contexto disponible;

factor limitante.

---

# 29. PRIORIDAD DEL CONTEXTO

Prioridad cero:

seguridad, identidad y restricciones inmutables.

Prioridad uno:

objetivo, criterios de aceptación y decisiones.

Prioridad dos:

evidencias, archivos y resultados relevantes.

Prioridad tres:

historial resumido.

Prioridad cuatro:

información auxiliar y recuperable.

Cuando falte espacio, BAGO eliminará primero prioridad cuatro.

No eliminará silenciosamente prioridades cero o uno.

---

# 30. CONTROLADOR DE ADMISIÓN

Antes de añadir contenido:

C_proyectado =
C_actual + T_nuevo + R_operativo

Si supera C_trabajo, BAGO deberá:

resumir contenido prescindible;

recuperar solo fragmentos relevantes;

guardar externamente;

abrir una nueva fase;

rechazar contenido cuando no pueda preservar seguridad y objetivo.

Nunca truncará silenciosamente.

Toda decisión quedará registrada.

---

# 31. INTEGRACIÓN EN BAGO TERMINAL

La nueva capacidad se añadirá sin alterar el propósito principal de BAGO Terminal.

Antes de crear componentes se inspeccionarán:

punto de entrada;

dispatcher;

registro de comandos;

sesiones;

configuración;

adaptadores;

bridge;

persistencia;

telemetría;

herramientas;

trabajos;

UI;

tests.

BAGO Terminal deberá poder:

detectar un proyecto externo;

detectar una `.gabo` existente;

mostrar en qué workspace está;

vincular la sesión cuando corresponda;

localizar `.gabo`;

crear `.gabo` solo cuando no exista y haya autorización;

leer el manifiesto;

registrar el workspace;

validar el alcance;

mostrar las raíces por separado.

El flujo canónico será:

detectar project_root candidato;

comprobar project_root/.gabo;

si existe, validar el manifiesto;

si es válido, identificar el workspace;

comprobar la vinculación de la sesión;

mostrar el estado real;

si no existe, ofrecer inicialización;

definir workspace_scope_root;

incrementar context_revision cuando cambie la vinculación;

construir contexto.

“Inicializar proyecto” no significará crear `.bago` dentro del proyecto.

Los comandos conceptuales de contexto serán:

bago context inspect;

bago context measure;

bago context benchmark;

bago context certify;

bago context status;

bago context history;

bago context invalidate;

bago context calibrate;

bago context tune.

El orden será:

inspect;

measure;

benchmark;

certify;

calibrate;

tune.

Tune no aplicará cambios sin autorización explícita.

---

# 32. BIENVENIDA ADAPTATIVA DE BAGO TERMINAL

La bienvenida no mostrará todas las acciones posibles.

Mostrará únicamente las acciones coherentes con el estado real.

## 32.1. Workspace válido y sesión vinculada

BAGO deberá mostrar:

framework activo;

proyecto actual;

workspace_id;

workspace_root;

sesión vinculada;

modelo;

contexto;

objetivo actual.

Opciones:

continuar la tarea actual;

iniciar una tarea nueva;

ver estado del workspace;

inspeccionar contexto;

cambiar de proyecto.

No mostrará:

inicializar `.gabo`;

crear workspace;

migrar legacy;

vincular el workspace ya vinculado.

Ejemplo:

BAGO 4.8.0

Proyecto:
BAGO

Workspace:
bago-main

Workspace root:
C:...\BAG4.8.gabo

Sesión:
a3f2, vinculada

Modelo:
ollama-local / llama3.2:3b

Contexto:
confirmed

Objetivo actual:
Integrar y certificar la base operacional de BAGO.

Opciones:

1. Continuar la tarea actual.
2. Iniciar una tarea nueva.
3. Ver estado del workspace.
4. Inspeccionar contexto.
5. Cambiar de proyecto.

## 32.2. Workspace detectado y sesión no vinculada

BAGO deberá mostrar:

proyecto detectado;

workspace_id;

workspace_root;

estado del manifiesto;

sesión no vinculada.

Opciones:

vincular esta sesión;

ver detalles;

abrir una sesión anterior;

seleccionar otro proyecto;

verificar el workspace.

No mostrará inicialización.

## 32.3. Workspace existente pero incoherente

BAGO deberá mostrar:

project_root;

workspace_root;

código del error;

causa;

operaciones bloqueadas.

Opciones:

ver diferencias;

verificar workspace;

reparar manifiesto;

abrir en modo seguro;

seleccionar otro proyecto.

No mostrará inicialización automática.

## 32.4. Proyecto sin `.gabo`

Solo en este estado deberá ofrecer:

inicializar `.gabo`;

vincular otro proyecto;

abrir una sesión anterior;

examinar sin modificar;

ejecutar diagnóstico.

## 32.5. `.bago` legacy sin `.gabo`

BAGO deberá ofrecer:

inspeccionar legacy;

migrar de `.bago` a `.gabo`;

crear `.gabo` sin importar;

abrir en solo lectura;

seleccionar otro proyecto.

Deberá indicar claramente que `.bago` no es la autoridad canónica.

## 32.6. Estado bloqueado

Cuando exista una incoherencia crítica, BAGO no deberá abrir un chat aparentemente normal.

Deberá indicar:

qué autoridad no coincide;

qué operación está bloqueada;

si se llamó o no al modelo;

si se ejecutó o no alguna herramienta;

qué acciones permiten resolverlo.

---

# 33. PROMPT OPERACIONAL DE TERMINAL

El prompt deberá ser compacto y reflejar estado real.

Ejemplos:

bago:BAGO [ctx:confirmed] ❯

bago:BAGO [ctx:partial] ❯

bago:BAGO [ctx:stale] ❯

bago [workspace-detected] ❯

bago [no-workspace] ❯

bago:BAGO [blocked] ❯

bago:BAGO [approval] ❯

El prompt no será autoridad.

Representará el estado confirmado por el backend.

---

# 34. MENÚ CANÓNICO “/”

El menú `/` será jerárquico, buscable, contextual y sensible al estado.

No mostrará inicialmente una lista plana de todos los comandos.

Categorías principales:

task;

session;

workspace;

context;

model;

tools;

evidence;

system;

view;

advanced.

## 34.1. Orden contextual

El menú deberá priorizar:

acciones recomendadas;

acciones aplicables;

acciones de recuperación;

categorías restantes.

No deberá destacar acciones incompatibles con el estado.

## 34.2. Workspace válido

Cuando exista una `.gabo` válida, el menú mostrará prioritariamente:

/workspace status

/workspace roots

/workspace verify

/workspace switch

/workspace reindex

/workspace unlink

No mostrará de forma normal:

/workspace init

Si el usuario lo escribe manualmente, BAGO deberá rechazarlo:

ya existe un workspace canónico;

no se creará otro `.gabo`;

se indicará workspace_id y workspace_root;

se ofrecerán status, verify o switch.

## 34.3. Workspace detectado sin sesión vinculada

Mostrará prioritariamente:

/workspace status

/workspace link

/session resume

/workspace verify

/workspace switch

No ofrecerá init.

## 34.4. Workspace inválido

Mostrará prioritariamente:

/workspace verify

/workspace repair

/workspace inspect

/workspace migrate-legacy cuando corresponda

/system safe-mode

/evidence latest

No ofrecerá init como solución automática.

## 34.5. Sin `.gabo`

Mostrará prioritariamente:

/workspace init

/workspace link

/workspace detect

/session resume

/system doctor

## 34.6. Legacy detectado

Mostrará prioritariamente:

/workspace inspect-legacy

/workspace migrate-legacy

/workspace init --without-import

/workspace link

/system safe-mode

---

# 35. MENÚ `/TASK`

Gestiona el objetivo y la ejecución de tareas.

Comandos:

/task status

/task new

/task continue

/task plan

/task run

/task approve

/task cancel

/task retry

/task history

Reglas:

`/task plan` no ejecutará.

`/task run` solo ejecutará acciones autorizadas.

`/task approve` autorizará una propuesta pendiente.

`/task retry` deberá utilizar idempotencia cuando exista riesgo de duplicación.

`/task status` mostrará:

objetivo;

decisiones;

restricciones;

estado;

siguiente paso;

ejecución activa.

---

# 36. MENÚ `/SESSION`

Gestiona persistencia y continuidad.

Comandos:

/session status

/session new

/session list

/session resume

/session save

/session rename

/session close

/session export

`/session status` deberá mostrar:

session_id;

workspace_id;

objetivo;

decisiones;

restricciones;

context_revision;

persistencia;

último guardado;

estado del vínculo.

---

# 37. MENÚ `/WORKSPACE`

Gestiona autoridad, detección y vinculación.

Comandos conceptuales:

/workspace status

/workspace roots

/workspace detect

/workspace link

/workspace switch

/workspace init

/workspace verify

/workspace repair

/workspace scope

/workspace reindex

/workspace inspect-legacy

/workspace migrate-legacy

/workspace unlink

Reglas:

`/workspace init` solo será aplicable cuando `.gabo` no exista.

`/workspace link` vinculará una sesión a un workspace existente.

`/workspace switch` exigirá revinculación explícita.

`/workspace roots` distinguirá:

framework_root;

project_root;

workspace_root;

workspace_scope_root;

workspace_id;

session_id.

`/workspace verify` comprobará:

existencia;

manifiesto;

workspace_id;

alcance;

persistencia;

índice;

legacy;

coherencia con la sesión.

---

# 38. MENÚ `/CONTEXT`

Gestiona contexto, presupuesto y certificación.

Comandos:

/context status

/context inspect

/context envelope

/context receipt

/context budget

/context rebuild

/context measure

/context benchmark

/context certify

/context calibrate

/context history

/context invalidate

/context explain

`/context status` mostrará:

estado;

máximo certificado;

contexto de trabajo;

ocupado;

disponible;

reserva;

factor limitante;

context_revision;

último receipt.

`/context inspect` no modificará configuración.

`/context envelope` mostrará lo preparado antes de la llamada.

`/context receipt` mostrará lo utilizado realmente.

`/context explain` justificará por qué el contexto está confirmado, parcial, degradado o bloqueado.

Los comandos prolongados utilizarán trabajos con progreso y cancelación.

---

# 39. MENÚ `/MODEL`

Gestiona provider, adapter, runtime y modelo.

Comandos:

/model status

/model list

/model select

/model capabilities

/model test

/model auto

/model history

`/model status` mostrará por separado:

provider;

adapter;

runtime;

modelo configurado;

modelo efectivo;

contexto solicitado;

contexto aplicado;

estado.

No existirá más de un selector efectivo de modelo.

---

# 40. MENÚ `/TOOLS`

Gestiona herramientas y permisos.

Comandos:

/tools status

/tools list

/tools allowed

/tools allow

/tools deny

/tools run

/tools cancel

/tools history

Las herramientas distinguirán:

disponible;

autorizada;

no autorizada;

bloqueada;

running;

failed.

Una propuesta no se convertirá en ejecución sin autorización.

---

# 41. MENÚ `/EVIDENCE`

Gestiona trazabilidad y pruebas.

Comandos:

/evidence latest

/evidence claims

/evidence claim

/evidence receipts

/evidence receipt

/evidence logs

/evidence diff

/evidence tests

/evidence mutations

/evidence export

Cada claim deberá mostrar:

afirmación;

ejecución;

madurez;

certificación;

tests;

evidencias;

resultado;

pendientes.

---

# 42. MENÚ `/SYSTEM`

Gestiona instalación y backend.

Comandos:

/system status

/system doctor

/system version

/system roots

/system config

/system bridge

/system logs

/system safe-mode

/system restart

`/system roots` se centrará en framework_root.

`/workspace roots` se centrará en proyecto y workspace.

No deberán mezclarse ambas autoridades.

---

# 43. MENÚ `/VIEW`

Gestiona únicamente la representación visual.

Comandos:

/view compact

/view normal

/view verbose

/view status

/view panels

/view clear

`/view clear` limpiará la presentación, no la sesión.

La vista no modificará el estado del backend.

---

# 44. MENÚ `/ADVANCED`

Las funciones experimentales o internas no aparecerán como acciones principales.

Comandos conceptuales:

/advanced intent status

/advanced intent evaluate

/advanced intent test-novel

/advanced intent evolve

/advanced certification fingerprint

/advanced legacy scan

/advanced benchmark datasets

`intent evolve` no podrá declarar evolución sin cambio real, persistido, medido y reversible.

---

# 45. INTERFAZ

El chat seguirá siendo el centro.

La interfaz representará únicamente estados confirmados por el backend.

Mientras no exista confirmación utilizará:

unknown;

loading;

degraded;

error;

confirmed.

La UI deberá poder mostrar por separado:

framework_root;

project_root;

workspace_root;

workspace_scope_root;

workspace_id;

session_id.

“Contexto vinculado” solo podrá mostrarse cuando:

framework_root sea válido;

project_root sea válido;

workspace_root sea válido;

workspace_scope_root sea válido;

workspace_id coincida con el manifiesto;

la sesión esté vinculada;

context_revision esté vigente;

ContextEnvelope sea coherente;

ContextReceipt confirme la misma identidad;

el backend marque confirmed.

La UI no reconstruirá rutas mediante concatenaciones locales.

Las rutas efectivas procederán del backend.

Permanecerán visibles:

workspace;

modelo;

provider cuando sea necesario;

estado del contexto;

chat;

entrada;

estado básico.

Serán plegables:

explorador;

inspector;

contratos;

herramientas;

agentes;

métricas;

pipeline;

historial.

---

# 46. PIPELINE

Estados:

pending;

running;

done;

failed;

blocked.

Transiciones válidas:

pending a running;

pending a blocked;

running a done;

running a failed;

running a blocked;

blocked a pending;

blocked a running;

failed a pending con reintento autorizado.

No existirá transición directa a done sin ejecución y validación.

Un paso no podrá pasar a done si el workspace activo no está confirmado por el backend.

Antes de ejecutar un paso dependiente del proyecto se validarán:

framework_root;

workspace_id;

workspace_root;

project_root;

workspace_scope_root;

session_id;

context_revision.

Blocked deberá incluir una causa estructurada.

Failed deberá incluir:

error;

evidencia;

punto de fallo.

Done deberá incluir evidencia suficiente.

---

# 47. EJECUCIONES PROLONGADAS

Todo trabajo prolongado deberá disponer de:

execution_id;

timeout;

cancelación;

reintento controlado;

idempotency_key cuando sea necesario;

estado persistido;

punto de recuperación;

limpieza posterior;

receipt final.

Un reintento no deberá duplicar:

modificaciones;

mensajes;

trabajos;

cambios de configuración;

evidencias.

---

# 48. SEGURIDAD DE SECRETOS

Ningún ContextEnvelope, ContextReceipt, log o paquete de evidencias conservará secretos en claro.

Deberán eliminarse o enmascararse:

tokens;

claves API;

cabeceras de autorización;

credenciales;

cookies;

variables sensibles;

contenido marcado como secreto.

La trazabilidad se conservará sin exponer el secreto.

---

# 49. CERTIFICATIONFINGERPRINT

Toda certificación deberá vincularse a una huella exacta.

Incluirá:

commit o hash del código;

hash de configuración;

framework_version;

framework_root;

workspace_id cuando corresponda;

hash del modelo;

tokenizador;

provider;

adapter;

runtime;

versión del runtime;

hardware;

contexto;

cuantización;

caché KV;

paralelismo;

batch;

plantilla;

prompt del sistema;

herramientas;

versión del benchmark;

hash del dataset;

versión de ContextEnvelope;

versión de ContextReceipt.

Dos huellas diferentes no compartirán automáticamente una certificación.

---

# 50. INVALIDACIÓN

Una certificación se invalidará cuando cambie materialmente:

código;

configuración;

framework;

workspace;

modelo;

tokenizador;

provider;

adapter;

runtime;

hardware;

cuantización;

KV;

paralelismo;

batch;

plantilla;

prompt;

herramientas;

benchmark;

dataset;

esquemas.

La causa quedará registrada.

Una certificación invalidada no podrá utilizarse como vigente.

---

# 51. PUERTAS DE ACEPTACIÓN

Cada fase tendrá una puerta de aceptación.

No se avanzará hasta completar:

prueba positiva;

prueba negativa;

prueba de error;

prueba de persistencia;

prueba de regresión;

prueba de mutación cuando corresponda.

El ciclo será:

requisito;

claim;

test inicialmente fallido;

implementación mínima;

test positivo;

test negativo;

test de error;

mutación;

validación;

receipt;

repetición desde entorno limpio.

---

# 52. MUTACIONES OBLIGATORIAS

La suite deberá detectar:

framework_root incorrecto;

workspace_id incorrecto;

workspace_root incorrecto;

project_root incoherente;

workspace_scope_root ampliado;

modelo diferente;

provider diferente;

runtime diferente;

recuperación desactivada;

índice obsoleto;

resumen eliminado;

conteo falso;

ruta fuera del alcance;

pipeline prematuro;

ContextEnvelope incompleto;

ContextReceipt incoherente;

certificación basada en una ejecución;

tune sin autorización;

certificación no invalidada;

estado visual sin backend;

reserva fija;

uso del máximo en lugar del mínimo;

reintento duplicado;

`.bago` legacy usada como autoridad;

opción `/workspace init` mostrada con `.gabo` válida;

creación de un segundo `.gabo`;

vinculación automática sin confirmación;

chat habilitado con workspace incoherente.

Cada mutación deberá provocar un fallo.

Si los tests siguen pasando, la suite será insuficiente.

---

# 53. JERARQUÍA DE EVIDENCIAS

Orden de fiabilidad:

primero, efecto real observado;

segundo, respuesta estructurada del backend;

tercero, persistencia;

cuarto, logs del runtime;

quinto, tests automáticos;

sexto, inspección de código;

séptimo, interfaz;

octavo, explicación del implementador.

Una evidencia inferior no sustituirá una evidencia superior cuando esta sea necesaria.

---

# 54. CONDICIONES QUE BLOQUEAN LA CERTIFICACIÓN

No podrá certificarse una capacidad cuando exista:

fallo critical;

test crítico omitido;

ruta inventada;

ejecución simulada;

framework_root incoherente;

workspace inconsistente;

alcance no validado;

modelo diferente;

provider diferente;

runtime diferente;

ContextEnvelope ausente;

ContextReceipt ausente o incoherente;

estado visual sin respaldo;

verificación solo con mocks;

repeticiones insuficientes;

reducción silenciosa;

cambio sin reversión;

regresión relevante;

evidencia incompleta;

resultado no reproducible;

autocertificación;

certificación no invalidada;

secretos expuestos;

reintentos no idempotentes;

`.bago` legacy utilizada como autoridad;

duplicación de `.gabo`;

acciones de bienvenida incoherentes con el estado;

menú `/` que ofrece operaciones inválidas.

El resultado será:

NOT_CERTIFIED

o:

REJECTED.

---

# 55. CRITERIOS MÍNIMOS PARA CERRAR ESTA ITERACIÓN

La iteración podrá cerrarse cuando se haya demostrado que:

uno, framework_root corresponde a la instalación real de BAGO;

dos, la sesión está vinculada al workspace_root real;

tres, project_root, workspace_root y workspace_scope_root están diferenciados;

cuatro, framework_root y workspace_root son distintos cuando el proyecto no es BAGO;

cinco, workspace_root corresponde a project_root/.gabo;

seis, el vínculo persiste después de reiniciar;

siete, cambiar de proyecto exige revinculación explícita;

ocho, detectar `.gabo` válida muestra el workspace actual;

nueve, detectar `.gabo` válida no ofrece inicialización;

diez, una sesión no vinculada ofrece vinculación, no creación;

once, una `.gabo` inválida ofrece verificación o reparación;

doce, `/workspace init` solo se ofrece cuando `.gabo` no existe;

trece, `.bago` legacy no compite con `.gabo`;

catorce, BAGO conserva objetivo y decisiones;

quince, los mensajes breves se interpretan dentro del contexto;

dieciséis, versión, modelo, provider, sesión, framework y workspace proceden del backend;

diecisiete, el modelo efectivo coincide con el mostrado;

dieciocho, existe ContextEnvelope antes de cada llamada relevante;

diecinueve, ContextEnvelope incluye las autoridades de ruta;

veinte, existe ContextReceipt después de la llamada;

veintiuno, la recuperación utiliza workspace_scope_root;

veintidós, los fragmentos registran workspace y procedencia;

veintitrés, BAGO reconoce lo que desconoce;

veinticuatro, no inventa rutas, archivos, herramientas o resultados;

veinticinco, el pipeline bloquea ejecuciones sin workspace confirmado;

veintiséis, el entrenamiento usa frases no utilizadas para construir el motor;

veintisiete, la evolución no declara cambios inexistentes;

veintiocho, existe una inspección real del contexto;

veintinueve, la interfaz representa estado confirmado;

treinta, el menú `/` adapta sus opciones al estado real;

treinta y uno, las pruebas negativas y de mutación detectan implementaciones rotas;

treinta y dos, no existen regresiones critical conocidas.

Estos requisitos deberán estar, como mínimo, verified_in_integration.

Las capacidades no certificadas deberán declararse como pendientes.

---

# 56. CIERRE DE ESTA ITERACIÓN

La fórmula será:

ITERACIÓN CERRADA =
BASE OPERACIONAL FIABLE
Y CRITERIOS MÍNIMOS DEMOSTRADOS
Y PRUEBAS NEGATIVAS
Y MUTACIONES DETECTADAS
Y AUSENCIA DE REGRESIONES CRÍTICAS
Y PENDIENTES DECLARADOS

Una iteración podrá estar cerrada aunque el canon completo continúe abierto.

---

# 57. CIERRE DEL CANON COMPLETO

La fórmula será:

CANON CERRADO =
TODOS LOS REQUISITOS OBLIGATORIOS CERTIFICADOS
Y RESULTADOS REPRODUCIBLES
Y SIN BLOQUEOS CRÍTICOS
Y SIN INCOHERENCIAS DE ESTADO
Y SIN REGRESIONES CONOCIDAS

Hasta entonces, los estados permitidos serán:

BASE OPERACIONAL VERIFICADA;

CANON PARCIALMENTE CERTIFICADO;

CANON ABIERTO.

---

# 58. ENTREGA OBLIGATORIA DEL PROGRAMADOR

Antes de modificar:

mapa de arquitectura;

rutas verificadas;

autoridades detectadas;

componentes reutilizables;

brechas confirmadas;

riesgos;

plan por fases;

claims afectados;

tests que deben fallar inicialmente.

Después de cada fase:

archivos modificados;

claims;

tests añadidos;

tests ejecutados;

resultados;

evidencias;

fallos;

regresiones;

aspectos no comprobados;

siguiente puerta.

Al finalizar:

diff completo;

comandos;

códigos de salida;

logs;

tests pasados;

tests fallidos;

tests omitidos;

mutaciones;

ContextEnvelope de muestra;

ContextReceipt de muestra;

capturas de las bienvenidas por estado;

salidas del menú `/` por estado;

mediciones observadas;

datos calculados;

datos estimados;

procedimiento de reversión;

riesgo residual;

estado de ejecución;

estado de madurez;

estado de certificación;

estado de iteración;

estado del canon.

---

# 59. ENTREGA OBLIGATORIA DEL CERTIFICADOR

El certificador entregará:

ESTADO FINAL.

AFIRMACIONES COMPROBADAS.

PRUEBAS EJECUTADAS.

ENTORNO Y HUELLA.

EVIDENCIAS.

FALLOS ENCONTRADOS.

MUTACIONES.

REGRESIONES.

ASPECTOS NO COMPROBADOS.

RIESGO RESIDUAL.

CONCLUSIÓN.

Deberá comprobar específicamente:

bienvenida con `.gabo` válida;

bienvenida con `.gabo` válida sin sesión vinculada;

bienvenida con `.gabo` inválida;

bienvenida sin `.gabo`;

bienvenida con `.bago` legacy;

opciones del menú `/` en cada estado;

rechazo de `/workspace init` cuando ya existe `.gabo`.

No utilizará expresiones ambiguas como:

parece funcionar;

debería funcionar;

probablemente está correcto;

todo está bien.

Indicará exactamente qué está demostrado y qué no.

---

# 60. COMPORTAMIENTO FINAL ESPERADO

Cuando BAGO detecte una `.gabo` válida y vinculada, deberá informar inmediatamente:

en qué proyecto está;

qué workspace utiliza;

qué sesión está vinculada;

qué modelo está activo;

qué contexto está confirmado;

qué objetivo mantiene.

No deberá preguntar si el usuario quiere crear o distribuir otro `.gabo`.

Cuando la sesión no esté vinculada, deberá ofrecer vincularla.

Cuando el manifiesto sea incoherente, deberá ofrecer verificar o reparar.

Cuando `.gabo` no exista, podrá ofrecer inicialización.

Cuando exista únicamente `.bago` legacy, deberá ofrecer migración.

Cuando el usuario pregunte si BAGO está terminado, BAGO no responderá simplemente que sí.

Deberá informar:

estado de la iteración;

estado del canon;

capacidades implementadas;

capacidades verificadas;

capacidades certificadas;

capacidades rechazadas;

capacidades pendientes;

riesgos;

límites de la evidencia.

---

# 61. PREGUNTAS QUE BAGO DEBERÁ PODER RESPONDER

BAGO deberá responder con evidencia:

¿Cuál es framework_root?

¿Cuál es project_root?

¿Cuál es workspace_root?

¿Cuál es workspace_scope_root?

¿Qué proyecto estoy manejando?

¿Qué workspace está vinculado?

¿Existe ya una `.gabo`?

¿Es válida?

¿La sesión está vinculada?

¿Cuál es la raíz autorizada?

¿Cuál es el objetivo actual?

¿Qué decisiones siguen vigentes?

¿Qué modelo recibió realmente el mensaje?

¿Qué provider, adapter y runtime se utilizaron?

¿Qué archivos y fragmentos se entregaron?

¿Qué dato no conoce?

¿Qué herramientas están autorizadas?

¿Qué acción se ejecutó?

¿Qué resultado se validó?

¿Cuánto contexto puede utilizar?

¿Cuánto contexto queda?

¿Qué factor limita el contexto?

¿Qué pruebas respaldan la cifra?

¿Qué cambio invalidaría la certificación?

¿Por qué aparece o no aparece `/workspace init`?

¿Qué snapshot de patrones está activo?

¿Qué packs y versiones lo componen?

¿Por qué una definición de patrón resultó efectiva?

¿Qué fuentes, migraciones y reglas de precedencia produjeron cada campo?

¿Cuál fue el resultado de la última carga o recarga de patrones?

¿Se conservó el último snapshot válido después de un fallo?

---

# 62. CLÁUSULA FINAL DE AUTORIDAD

Si una afirmación sobre framework, proyecto, workspace, sesión o estado contradice al backend, prevalecerá el backend.

Si el backend no puede demostrarla, BAGO deberá declarar:

no lo sé;

no está disponible;

no está confirmado;

está bloqueado.

Si un archivo está fuera de workspace_scope_root, no podrá utilizarse como evidencia sin autorización.

Si una pieza vive en `.bago` y es específica del proyecto, está mal ubicada.

Si una pieza vive en `.gabo` y es genérica del framework, está mal ubicada.

Si `.bago` legacy y `.gabo` existen dentro del proyecto, `.gabo` prevalece.

Si la UI muestra una ruta que no coincide con el backend, la UI está equivocada.

Si una sesión no puede demostrar qué workspace utiliza, no podrá actuar sobre el proyecto.

Si `.gabo` existe y es válida, BAGO no podrá ofrecer crear otra.

Si `.gabo` existe pero la sesión no está vinculada, BAGO deberá ofrecer vincular, no inicializar.

Si `.gabo` es inválida, BAGO deberá reparar, verificar o bloquear, no ocultarla creando otra.

La política canónica será:

`.bago` = framework BAGO.

`project_root` = raíz real del proyecto.

`.gabo` = estado operacional del workspace.

`workspace_scope_root` = límite autorizado de operaciones.

Genérico para todos los workspaces = framework root.

Específico de un proyecto = workspace root.

Código y archivos normales = project root.

`.bago` dentro de un proyecto externo = legacy temporal, nunca autoridad.

`.gabo` existente y válida = identificar y utilizar el workspace, nunca volver a inicializarlo.

---

# 63. REGISTRO CANÓNICO DE PATRONES

Este apartado incorpora el bloque suministrado de requisitos 13-43 como contrato del subsistema de patrones. No reconstruye ni inventa requisitos previos no suministrados.

## Reglas de integración obligatorias

El registro de patrones será una capacidad del backend y respetará la autoridad de rutas definida por este canon.

Los componentes genéricos, esquemas, decoders, migraciones y packs reutilizables pertenecerán a framework_root.

Los packs y estados específicos de un proyecto pertenecerán a workspace_root o a fuentes del proyecto declaradas explícitamente, siempre dentro de workspace_scope_root.

La presencia física de un archivo no lo convertirá en fuente autorizada. Toda raíz de descubrimiento deberá proceder de configuración backend validada, del manifiesto aplicable o de una política administrativa explícita.

PatternRegistry será la única autoridad del registro efectivo. React y BAGO Terminal serán adaptadores de presentación separados: ninguno descubrirá archivos, parseará formatos, resolverá precedencias, ejecutará migraciones ni publicará snapshots por su cuenta.

React consumirá contratos de consulta y acción del backend. BAGO Terminal consumirá los mismos contratos mediante sus comandos interactivos y su CLI. Las dos interfaces podrán representar el mismo estado, pero no compartirán lógica específica de presentación ni mantendrán registros locales divergentes.

Los estados del ciclo de vida de un patrón no sustituirán los estados de ejecución, madurez o certificación definidos por este canon. Una carga activa no implicará que el subsistema esté verificado o certificado.

Cada carga o recarga deberá producir evidencia estructurada compatible con el contrato general de receipts, incluyendo execution_id, snapshot anterior, snapshot candidato, resultado, diagnósticos, fuentes, hashes y estado de publicación.

No se creará un segundo sistema de configuración, telemetría, permisos, sesión o certificación para patrones cuando los servicios canónicos existentes puedan ser reutilizados.

## 63.1. Un manifiesto obligatorio para cada pack de patrones

Cada pack deberá declarar, como mínimo:

- identificador único del pack;
- versión del pack;
- versión del esquema canónico requerido;
- dominios incluidos;
- dependencias con otros packs;
- prioridad declarada;
- nivel de confianza;
- archivos que lo componen;
- hashes de integridad;
- compatibilidad mínima y máxima con el runtime;
- carácter obligatorio u opcional.

El sistema no deberá inferir silenciosamente esta información a partir del nombre de las carpetas.

## 63.2. Descubrimiento controlado de fuentes

Deberá definirse explícitamente:

- qué directorios pueden contener packs;
- en qué orden se inspeccionan;
- si se permite búsqueda recursiva;
- qué extensiones están autorizadas;
- cómo se tratan enlaces simbólicos;
- cómo se evita escapar de las raíces permitidas;
- cómo se detecta el mismo archivo cargado desde dos rutas;
- si se permiten fuentes remotas, empaquetadas o generadas.

El loader no deberá recorrer arbitrariamente el sistema de archivos.

## 63.3. Identidad, namespaces y colisiones

Cada patrón deberá tener una identidad canónica estable, por ejemplo:

dominio:categoría:nombre:versión

También deberá definirse:

- sensibilidad a mayúsculas y minúsculas;
- normalización de espacios y caracteres Unicode;
- aliases permitidos;
- política de renombrado;
- tratamiento de identificadores antiguos;
- comportamiento ante dos patrones con el mismo identificador;
- diferencia entre una nueva versión y una redefinición conflictiva.

No se utilizarán nombres de archivo como identidad canónica.

## 63.4. Contrato preciso del modelo canónico

El esquema deberá indicar para cada campo:

- tipo;
- obligatoriedad;
- valor predeterminado;
- posibilidad de valor nulo;
- restricciones;
- estrategia de combinación;
- capacidad de sobreescritura;
- nivel de sensibilidad;
- estado de deprecación.

Los campos desconocidos deberán rechazarse, conservarse como extensiones, o aceptarse solamente bajo un namespace específico según política explícita.

## 63.5. Semántica explícita de combinación

La precedencia por sí sola no basta. Cada campo del esquema deberá declarar su estrategia de combinación.

Las estrategias posibles incluyen:

- reemplazo completo;
- combinación profunda de objetos;
- concatenación de listas;
- unión sin duplicados;
- intersección;
- sustitución por clave;
- eliminación explícita;
- tombstone para impedir que reaparezca un valor inferior;
- herencia sin modificación.

El resolvedor no deberá aplicar una combinación profunda genérica a todos los datos.

## 63.6. Separación entre invariantes y valores configurables

Se distinguirán, como mínimo:

- invariantes del sistema, nunca sobreescribibles;
- políticas administrativas;
- valores predeterminados;
- configuración de workspace;
- configuración de proyecto;
- configuración de sesión;
- preferencias del usuario;
- valores temporales de ejecución.

Una sobreescritura explícita del usuario no podrá invalidar restricciones de seguridad, compatibilidad del esquema, límites operativos, campos de identidad, reglas de integridad ni políticas administrativas bloqueadas.

## 63.7. Orden total y determinista de precedencia

Cuando dos definiciones tengan la misma prioridad, deberá existir una regla de desempate estable.

El desempate podrá considerar:

- nivel de autoridad;
- prioridad declarada;
- dependencia;
- versión;
- orden del manifiesto;
- identificador canónico.

Nunca deberá depender del orden accidental en que el sistema operativo devuelve los archivos. Ante los mismos datos de entrada, el sistema deberá producir siempre el mismo registro efectivo.

## 63.8. Grafo de dependencias y referencias

Las referencias entre patrones deberán clasificarse como obligatorias, opcionales, diferidas o externas.

El sistema deberá detectar:

- dependencias inexistentes;
- dependencias circulares;
- versiones incompatibles;
- referencias ambiguas;
- referencias hacia patrones desactivados;
- cadenas de dependencia excesivamente profundas.

La activación se realizará siguiendo un orden topológico verificable.

## 63.9. Carga transaccional y publicación atómica

La carga completa deberá realizarse en una zona de preparación:

descubrimiento -> parseo -> normalización -> validación -> resolución -> construcción de snapshot

El nuevo registro solo se publicará cuando el conjunto completo haya sido aceptado.

Los consumidores nunca deberán observar un registro parcialmente actualizado, una mezcla entre la versión anterior y la nueva, referencias aún no resueltas, ni patrones cargados antes que sus dependencias.

## 63.10. Snapshots inmutables

Cada estado publicado del registro deberá convertirse en un snapshot inmutable con:

- identificador;
- versión;
- hash global;
- fecha de construcción;
- packs incluidos;
- errores y advertencias;
- reglas de precedencia aplicadas;
- versión del loader;
- versión del esquema;
- versión de las migraciones.

Las consultas del mixin deberán operar contra un snapshot concreto.

## 63.11. Recarga y concurrencia

Deberá definirse si la recarga puede producirse al iniciar, manualmente, mediante vigilancia de archivos, al cambiar de workspace, al cambiar de proyecto o al comenzar una sesión.

La recarga deberá incluir debounce, intercambio atómico del snapshot, lectores concurrentes seguros, cancelación de cargas obsoletas, protección frente a dos recargas simultáneas y conservación del último snapshot válido.

## 63.12. Política de fallo y degradación

Cada error deberá tener una consecuencia explícita:

- impedir el arranque;
- rechazar únicamente el pack afectado;
- poner el patrón en cuarentena;
- mantener el último snapshot válido;
- entrar en modo degradado;
- emitir una advertencia sin desactivar el patrón.

Deberá distinguirse entre error fatal, error recuperable, incompatibilidad, advertencia, deprecación e información diagnóstica.

El sistema no deberá continuar silenciosamente con una configuración parcialmente inválida.

## 63.13. Rollback al último estado válido

Cuando una recarga falle:

- el snapshot activo no será modificado;
- se conservará la evidencia del fallo;
- se indicará qué archivos provocaron el rechazo;
- se mantendrá disponible el último snapshot válido;
- podrá compararse el intento fallido con el estado activo.

El rollback no deberá reconstruirse de memoria; deberá apoyarse en snapshots verificables.

## 63.14. Estados del ciclo de vida de un patrón

Un patrón podrá encontrarse, como mínimo, en uno de estos estados:

- descubierto;
- parseado;
- normalizado;
- validado;
- activo;
- sobreescrito;
- sombreado;
- desactivado;
- deprecado;
- migrado;
- incompatible;
- en cuarentena;
- inválido.

El registro deberá conservar los patrones no activos cuando sean necesarios para explicar una resolución o diagnosticar un conflicto.

## 63.15. Seguridad del parseo

Los parsers deberán operar con límites estrictos de tamaño máximo de archivo, número máximo de registros, profundidad máxima, longitud máxima de cadenas, número máximo de referencias, tiempo máximo de parseo y consumo máximo de memoria.

También deberán rechazarse claves duplicadas, rutas que salgan de la raíz permitida, includes no autorizados, etiquetas YAML ejecutables, constructores personalizados, objetos arbitrarios, expansiones recursivas, referencias o anchors YAML no admitidos, y valores con profundidad abusiva.

Ningún formato podrá provocar ejecución de código.

## 63.16. Definición exacta de YAML simple

YAML simple deberá convertirse en un subconjunto formalmente definido: mapas, listas, cadenas, números, booleanos y valores nulos.

Deberán rechazarse explícitamente tags personalizados, anchors, aliases, merges, tipos ejecutables, referencias complejas, claves no escalares y resoluciones implícitas ambiguas.

No deberá aceptarse parcialmente una característica YAML no soportada.

## 63.17. Contrato específico para Markdown y CSV

Markdown deberá declarar si obtiene datos mediante front matter, bloques delimitados, tablas, encabezados convencionales o bloques de código con formato declarado.

No se inferirá estructura libremente desde texto narrativo.

Para CSV deberá definirse delimitador, codificación, fila de encabezados, nombres de columnas, comillas y escapes, tratamiento de líneas vacías, conversión de tipos, representación de listas, representación de valores nulos e imposibilidad o estrategia para datos anidados.

## 63.18. Normalización de tipos entre formatos

Deberán fijarse reglas para fechas y zonas horarias, enteros y decimales, precisión numérica, booleanos, valores nulos, cadenas vacías, listas, mapas, claves numéricas, valores multilinea, codificación UTF-8, finales de línea y normalización Unicode.

Dos archivos equivalentes escritos en formatos distintos deberán producir el mismo objeto canónico.

## 63.19. Diagnósticos con ubicación exacta

Todo error deberá incluir, cuando sea posible:

- pack;
- archivo;
- línea;
- columna;
- ruta canónica del campo;
- identificador del patrón;
- regla incumplida;
- valor recibido;
- valor esperado;
- severidad;
- posible corrección.

No bastará con mensajes como "patrón inválido" o "error de esquema".

## 63.20. Procedencia completa por campo

Cuando un patrón efectivo combine varias fuentes, cada campo deberá poder explicar:

- de qué archivo procede;
- qué valor tenía originalmente;
- qué normalización recibió;
- qué migración se aplicó;
- qué fuente lo sobreescribió;
- qué regla permitió la sobreescritura;
- cuál es su valor efectivo.

Esto permitirá implementar una operación explain fiable.

## 63.21. API de consulta, explicación y diagnóstico

Además de obtener patrones, la API deberá permitir:

- obtener por identificador;
- listar por dominio;
- filtrar por estado;
- consultar el patrón efectivo;
- consultar todas sus definiciones de origen;
- explicar por qué ganó una definición;
- mostrar conflictos;
- comparar snapshots;
- obtener dependencias;
- comprobar disponibilidad;
- validar sin activar;
- recargar;
- consultar el estado del registro.

Los resultados entregados a los consumidores serán inmutables o copias defensivas.

## 63.22. Límites de responsabilidad de cada componente

La pieza deberá dividirse al menos en:

- SourceResolver: descubre fuentes autorizadas.
- FormatDecoder: convierte bytes en estructura del formato.
- Normalizer: transforma esa estructura al modelo canónico.
- StructuralValidator: valida forma y tipos.
- SemanticValidator: valida significado y referencias.
- MigrationEngine: convierte versiones antiguas.
- PrecedenceResolver: calcula el valor efectivo.
- RegistryBuilder: construye el snapshot.
- PatternRegistry: expone consultas de solo lectura.
- ReloadCoordinator: controla recargas y publicación.
- DiagnosticReporter: registra evidencia y errores.

El nombre loader no deberá utilizarse para ocultar todas estas responsabilidades dentro de una sola clase.

## 63.23. Versiones independientes

Deberán diferenciarse claramente:

- versión del pack;
- versión del patrón;
- versión del formato de origen;
- versión del esquema canónico;
- versión del loader;
- versión de las migraciones;
- versión del snapshot;
- versión mínima del runtime.

Estas versiones no deberán compartir un único campo genérico llamado version.

## 63.24. Migraciones deterministas y auditables

Las migraciones deberán ser explícitas, versionadas, deterministas, probadas, trazables, aplicadas en orden e incapaces de modificar silenciosamente el archivo original.

Cada migración deberá registrar versión de origen, versión de destino, campos modificados, campos eliminados, valores predeterminados añadidos y advertencias generadas.

## 63.25. Integridad y confianza

Cuando los packs puedan proceder de fuentes externas, deberá contemplarse:

- hash por archivo;
- hash global del pack;
- firma opcional;
- autor o emisor;
- nivel de confianza;
- permisos necesarios;
- lista de fuentes autorizadas;
- rechazo de modificaciones no reconocidas.

La integridad deberá verificarse antes de activar el pack.

## 63.26. Caché correctamente invalidable

La clave de caché no deberá depender únicamente de la fecha de modificación.

Deberá incluir, como mínimo:

- hash del contenido;
- versión del decoder;
- versión del normalizador;
- versión del esquema;
- versión de las migraciones;
- dependencias;
- parámetros de carga relevantes.

La caché deberá escribirse atómicamente, detectar corrupción, poder eliminarse completamente, no convertirse en fuente de verdad y producir el mismo resultado que una carga sin caché.

## 63.27. Observabilidad

El sistema deberá emitir logs estructurados, métricas de tiempo de carga, número de patrones descubiertos, aceptados y rechazados, conflictos, migraciones, aciertos y fallos de caché, snapshot activo, motivo de la última recarga y causa del último rollback.

La telemetría no deberá contener secretos ni datos sensibles completos.

## 63.28. Presupuestos operativos

Deberán fijarse límites verificables para tiempo de arranque, tiempo de recarga, memoria máxima, número de packs, número de patrones, profundidad de dependencias, tamaño total de datos, tiempo de consulta y tamaño de la caché.

Estos límites deberán medirse con el runtime y los datos reales.

## 63.29. Herramientas de autoría y mantenimiento

Deberá existir una interfaz de diagnóstico, preferentemente mediante línea de comandos, con operaciones como:

- patterns validate;
- patterns lint;
- patterns list;
- patterns show;
- patterns explain;
- patterns diff;
- patterns migrate;
- patterns reload;
- patterns cache clear;
- patterns snapshot;
- patterns doctor.

La validación deberá poder ejecutarse sin iniciar todo el runtime.

## 63.30. Matriz de pruebas ampliada

Además de las pruebas ya indicadas, deberán incluirse:

- equivalencia entre formatos;
- claves duplicadas;
- colisiones de identidad;
- precedencia determinista;
- estrategias de merge;
- dependencias circulares;
- referencias opcionales y obligatorias;
- rollback;
- recarga concurrente;
- snapshot inmutable;
- corrupción de caché;
- límites de tamaño y profundidad;
- rutas maliciosas;
- migraciones encadenadas;
- compatibilidad hacia atrás;
- pruebas property-based;
- fuzzing de parsers;
- archivos golden;
- repetibilidad del hash;
- mismo resultado en distintos sistemas operativos.

## 63.31. Documentación del contrato

El sistema deberá incluir esquema canónico documentado, ejemplo mínimo por formato, ejemplo de pack completo, reglas de precedencia, estrategias de combinación, tabla de compatibilidad, política de errores, guía de migración, guía para crear nuevos patrones, guía para crear nuevos decoders y ejemplos de explain y diff.

El flujo completo quedará así:

fuente autorizada -> descubrimiento -> lectura segura -> detección explícita de formato -> parseo -> normalización -> migración -> validación estructural -> validación semántica -> resolución de referencias -> resolución de precedencia -> construcción del registro -> generación de snapshot -> publicación atómica -> consumo mediante API de solo lectura.

Ante un fallo durante la carga o la recarga:

intento de carga -> diagnóstico -> rechazo del nuevo snapshot -> conservación del último snapshot válido -> exposición explícita del estado degradado o del error.

El principio arquitectónico será:

Los decoders interpretan formatos.

El normalizador construye el modelo canónico.

Los validadores determinan si una definición es admisible.

El motor de migración adapta versiones antiguas.

El resolvedor calcula qué definición es efectiva.

El registro publica snapshots inmutables.

El mixin solamente consume patrones ya resueltos y nunca conoce archivos, formatos, precedencias, migraciones ni cachés.

## 63.32. Integración contractual de interfaces y comandos

Las operaciones de autoría y diagnóstico se expondrán sobre los mismos servicios de aplicación:

- CLI no interactiva: `bago patterns validate`, `bago patterns lint`, `bago patterns list`, `bago patterns show`, `bago patterns explain`, `bago patterns diff`, `bago patterns migrate`, `bago patterns reload`, `bago patterns cache clear`, `bago patterns snapshot` y `bago patterns doctor`;
- BAGO Terminal interactiva: familia contextual `/patterns` con operaciones equivalentes y visibilidad adaptada al estado;
- React: acciones y vistas que invoquen los mismos contratos backend, sin acceso directo al sistema de archivos ni al motor de resolución.

La lógica de dominio y aplicación será común. Los adaptadores de React, terminal interactiva y CLI permanecerán separados. Ninguna interfaz podrá marcar una carga como publicada si el backend no devuelve un snapshot activo y un receipt válido.

La familia `/patterns` se mostrará únicamente cuando la capacidad esté disponible. Las acciones incompatibles con el estado, los permisos o la autoridad de rutas deberán ocultarse o mostrarse como bloqueadas con causa estructurada.

## 63.33. Alcance de cierre y certificación

La incorporación de este contrato al canon no convierte automáticamente todos sus requisitos en criterios mínimos de cierre de la iteración descrita en la sección 55.

Cuando el subsistema de patrones forme parte del alcance de una iteración, sus claims, pruebas negativas, mutaciones, receipts y evidencias deberán añadirse explícitamente a la puerta de aceptación de esa iteración.

El subsistema no podrá declararse certificado mientras no se demuestren, como mínimo, determinismo, seguridad de parseo, publicación atómica, rollback, procedencia por campo, aislamiento de interfaces, repetibilidad entre sistemas y detección de las mutaciones críticas definidas en este apartado.

---

# 64. INSTRUCCIÓN DEFINITIVA

No construyas otro BAGO paralelo.

No sustituyas componentes funcionales sin necesidad demostrada.

No inventes rutas, módulos, comandos o contratos.

No confundas framework root, project root, workspace root y workspace scope root.

No confundas detección con vinculación.

No confundas una `.gabo` existente con un proyecto sin inicializar.

No muestres acciones incompatibles con el estado real.

No ofrezcas `/workspace init` cuando ya existe una `.gabo` válida.

No confundas una operación terminada con una capacidad verificada.

No confundas una capacidad verificada con una capacidad certificada.

No confundas el cierre de una iteración con el cierre del canon.

No declares que BAGO aprende, evoluciona, recupera, mide, ejecuta o certifica sin evidencia reproducible.

No declares como observado un valor estimado.

No declares como ejecutada una acción propuesta.

No declares como vigente una certificación invalidada.

No permitas que la interfaz muestre un estado que el backend no pueda demostrar.

No permitas que React o BAGO Terminal descubran, parseen, migren o resuelvan packs directamente.

No publiques registros parciales ni sustituyas el último snapshot válido por una carga fallida.

No utilices nombres de archivo como identidad canónica de patrones.

No apliques una combinación profunda genérica cuando el esquema no la autorice campo por campo.

No declares determinismo, integridad, rollback o procedencia sin evidencia reproducible.

El resultado esperado es una base operacional fiable.

BAGO deberá saber:

dónde está;

qué framework utiliza;

qué proyecto maneja;

si existe `.gabo`;

qué workspace está vinculado;

qué sesión está activa;

qué alcance tiene autorizado;

qué tarea mantiene;

qué modelo utiliza;

qué contexto recibió;

qué información recuperó;

qué información desconoce;

qué herramientas puede utilizar;

qué operación ejecutó;

qué resultado validó;

qué límites midió;

qué capacidades verificó;

qué capacidades certificó;

qué partes continúan pendientes;

qué opciones debe mostrar al usuario según el estado real.

qué snapshot de patrones está activo;

qué packs y fuentes lo componen;

por qué una definición es efectiva;

qué procedencia tiene cada campo;

qué ocurrió en la última carga, recarga o rollback de patrones;

La fórmula final será:

BASE OPERACIONAL FIABLE =
AUTORIDAD DE RUTAS
Y DETECCIÓN COHERENTE
Y VINCULACIÓN EXPLÍCITA
Y ESTADO REAL
Y CONTEXTO TRAZABLE
Y RECUPERACIÓN DEMOSTRADA
Y EJECUCIÓN VALIDADA
Y EVIDENCIA REPRODUCIBLE
Y UI FIEL AL BACKEND
Y MENÚ ADAPTADO AL ESTADO
Y AUSENCIA DE AFIRMACIONES FALSAS

ITERACIÓN CERRADA =
BASE OPERACIONAL FIABLE
Y CRITERIOS MÍNIMOS VERIFICADOS
Y SIN REGRESIONES CRÍTICAS
Y PENDIENTES DECLARADOS

CANON CERRADO =
TODOS LOS REQUISITOS OBLIGATORIOS CERTIFICADOS
Y REPRODUCIBLES
Y SIN BLOQUEOS CRÍTICOS

BAGO no será correcto porque lo afirme.

Será correcto únicamente en aquello que pueda demostrar.
