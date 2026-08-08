# Reino Diferencial v3.9

Tower Defense matemático SCORM 1.2 para Brightspace.

## Corrección espacial de esta versión
- Dos portales y dos rutas independientes.
- Cada enemigo queda bloqueado a la ruta asignada desde que aparece.
- La trayectoria sigue el centro visual del único camino de cada lado.
- Entrada, recorrido y salida de la rotonda son obligatorios.
- Después de la rotonda, la unidad recorre el trayecto largo inferior y llega a la puerta de su castillo.
- No hay navegación libre, atajos, cambio de ruta ni persecución directa del castillo.
- El castillo visible pertenece al fondo del mapa; no se dibuja una segunda imagen encima.
- Las 24 posiciones de construcción coinciden con las plataformas octagonales visibles.
- Las torres se anclan por la base al centro de su plataforma y los enemigos por los pies al centro del camino.

## Dinámica
- 10 oleadas.
- Preguntas básicas para construir y preguntas avanzadas para mejorar o reparar.
- Errores académicos liberan saboteadores.
- Jefes con dos validaciones matemáticas.
- Calculadora ECOMAT disponible en todas las preguntas.
- Informe HTML automático con preguntas, tiempos, pistas, calculadora, línea temporal y plan de mejora.

## Nota
`N = 5(0.65 Dm + 0.25 De + 0.10 C) - Pi`.

## Integridad
En evaluación: primera advertencia sin descuento; incidencias 2 a 4 descuentan 0.05; la quinta anula el intento. En entrenamiento se registran sin descuento.

La contraseña docente dinámica es `DDHHMM`: día del mes + hora militar + minutos del dispositivo.

## Validación
- Abra `index.html#rutas` para ver las rutas superpuestas durante una prueba.
- Ejecute `TDRouteAudit()` y `TDSlotAudit()` en la consola para consultar las auditorías internas.
- La imagen `assets/validacion_rutas_fijas.png` documenta el trazado y los anclajes.

## Brightspace
Importar el ZIP como paquete SCORM 1.2. La nota se reporta sobre 5.00 y se aprueba desde 3.00.


## Ajuste responsive v3.9
La barra lateral fue eliminada. Los selectores de torres y el acceso al estado de campaña se encuentran en la banda superior. El tablero usa toda el área útil en orientación horizontal y conserva proporción en pantallas verticales.


## Sistema de calificación v3.9
- 0.50 puntos por cada oleada completada.
- 2.50 al completar 5 oleadas.
- 5.00 al completar 10 oleadas.
- Bono temporal por bajas: máximo 0.10 durante la oleada activa; no se acumula.
- El guardado SCORM se sincroniza de forma periódica y en eventos importantes para evitar bloqueos.


## Corrección integral v3.9

- Se corrigió la interrupción del bucle de animación causada por funciones ausentes en los nuevos atlas de ataque.
- Los enemigos muertos se eliminan correctamente incluso durante ataques, retornos y asedios.
- Las entidades con coordenadas inválidas o fuera del tablero regresan automáticamente a su ruta.
- Los cambios de resolución remapean enemigos, proyectiles y efectos sin hacerlos desaparecer.
- Se incorporó un vigilante de estados bloqueados y recuperación del ciclo de animación.
- Se limitaron proyectiles, efectos, sonidos simultáneos y eventos repetitivos para evitar sobrecarga.
- Los enemigos pendientes de una pregunta de jefe siguen contando como activos y no cierran la oleada antes de tiempo.
- Si un castillo ya fue destruido, los atacantes se redirigen al castillo superviviente en lugar de quedar atrapados.

## Pistas y retroalimentación matemática (v3.9.1)
Todas las preguntas presentan una pista matemática opcional y, después de responder, retroalimentación conceptual y solución guiada. El contenido matemático se procesa con MathJax local en salida SVG para conservar nitidez en PC, tablet y celular. El informe final registra también la pista disponible, la retroalimentación y la solución.


### Ajuste integrado
- Se integraron nuevas imágenes diferenciadas para jefe de oleada y jefe superior: una pose de carrera y otra de ataque para cada uno.
