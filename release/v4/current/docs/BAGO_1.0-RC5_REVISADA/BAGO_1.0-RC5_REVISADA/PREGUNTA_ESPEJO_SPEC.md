# Especificación canónica de pregunta espejo

## Modelo

`I = f(P, C, O)`

`M* = argmin_M [D_sem(I, decode(M)) + lambda_A A_residual(M) + lambda_S S_ocultos(M)]`

`R_(n+1) = F(R_n; C, E)`

`R* = F(R*; C, E)` sujeto a conservación de objetivo, restricciones, objeto, metaobjeto, incertidumbre y evidencia.

## Lectura de la pregunta de referencia

La petición literal solicita traducir una pregunta a fórmula. La intención pragmática evalúa si el intérprete reconstruye el mecanismo de comprensión. La capa reflexiva convierte ese mismo mecanismo en objeto de la pregunta.

Cadena mínima:

`P -> I(P) -> M(I(P)) -> I(M(I(P)))`

## Regla

Una respuesta puede ser formalmente correcta y, aun así, reflexivamente incompleta. La autorreferencia no equivale a ambigüedad.

## Parada

La recursión debe detenerse por convergencia, presupuesto, contradicción, falta de evidencia o ausencia de información nueva.
