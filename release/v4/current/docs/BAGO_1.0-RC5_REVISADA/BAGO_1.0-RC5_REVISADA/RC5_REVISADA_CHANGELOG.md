# BAGO 1.0-RC5 revisada (RC5-R1) - Changelog

RC5-R1 sustituye la propuesta RC5 anterior y mantiene la sustitución total de RC1, RC2, RC3 y RC4.

## Correcciones bloqueantes

1. **Demo aislada:** browser-local deja de ser fallback silencioso. Las respuestas y sesiones sintéticas solo pueden existir en `DemoMode`.
2. **ManagerContext verificable:** se añaden `ManagerContext` y `ManagerContextReceipt`; el backend debe demostrar qué campos consumió el modelo.
3. **Catálogo real de modelos:** se separan installed, configured, detected, installable, loaded y effective. El selector operativo es installed-only por defecto.
4. **Estado stale/degraded:** un refresh fallido invalida ready/confirmed; el snapshot previo queda como last-known-good.
5. **Pregunta espejo:** se formalizan objeto, metaobjeto, recursión acotada y punto fijo semántico anclado a evidencia.

## Nuevos contratos

- manager-context
- manager-context-receipt
- demo-state
- presentation-snapshot-state
- reflexive-question-record
- model-catalog revisado

## Nuevas pruebas

- INTERP-021 a INTERP-026
- INC-071 a INC-076
- FALSE-051 a FALSE-055
- MANAGER-001 a MANAGER-010
- MIRROR-001 a MIRROR-008
