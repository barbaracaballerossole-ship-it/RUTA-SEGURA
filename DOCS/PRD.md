# PRD — Ruta Segura

**Autor:** Bárbara Elizabeth Caballeros Solé (Carné 9714619)
**Fecha:** 17 de julio de 2026

## 1. Problema

Cuando un asegurado sufre una avería o accidente en carretera, necesita saber
en tiempo real quién lo va a atender y cuándo llegará, para no tener que
llamar repetidamente y con ansiedad a la cabina de su aseguradora.

## 2. Candidatos de features (backlog inicial)

- Bot de WhatsApp de reporte (identificación de póliza + tipo de servicio)
- Captura de ubicación GPS vía pin de WhatsApp
- Motor de asignación por score (ETA, costo, calificación) que elige proveedor automáticamente
- Notificación automática de "proveedor asignado" con ETA
- Página web de tracking en tiempo real (sin necesidad de app)
- Notificaciones de cambio de estatus (en camino / llegó / finalizado)
- Portal/app para que el proveedor actualice su propio estatus
- Fallback automático a segundo proveedor si el primero no responde en 60s
- Encuesta de satisfacción (tNPS) automática al cerrar el folio
- Panel de KPIs (TMO, SLA de arribo) para supervisores de cabina

## 3. Priorización MoSCoW

| # | Feature | Categoría | Justificación (test de remoción) |
|---|---|---|---|
| 1 | Bot de reporte WhatsApp | Must | Sin esto no hay forma de captar la solicitud, el trabajo central no arranca. |
| 2 | Captura de ubicación GPS | Must | Sin ubicación no se puede despachar a ningún proveedor. |
| 3 | Motor de asignación por score | Should* | Sin esto, alguien busca manualmente en cartilla, exactamente el problema que se quiere resolver. |
| 4 | Notificación "asignado + ETA" | Must | Es el primer alivio a la ansiedad; sin ella el asegurado sigue sin saber si alguien viene. |
| 5 | Notificaciones de cambio de estatus | Must** | Es el corazón del job (dar visibilidad); quitarlo mata el problema, aunque la asignación siga funcionando. |
| 6 | Página de tracking en vivo | Should | Mejora la experiencia, pero las notificaciones de texto ya cubren el job básico. |
| 7 | Portal para que el proveedor actualice su estatus | Should | Necesario a mediano plazo; al inicio un operador puede actualizarlo manualmente. |
| 8 | Fallback automático en cascada | Could | Un supervisor humano puede reasignar manualmente al inicio. |
| 9 | Encuesta tNPS automática | Could | Se puede medir con pocas llamadas de seguimiento manuales al inicio. |
| 10 | Panel de KPIs para supervisores | Won't (have now) | Útil para escalar, pero no se necesita para validar si el modelo resuelve el problema del cliente. |

\* Reclasificado de Must a Should tras el reto de la IA (ver sección 5).
\** En el MVP se envía únicamente el primer mensaje de asignación; los estados intermedios ("en camino", "llegó") se consideran Should/Could para la primera versión.

### Las tres Musts del MVP

- Bot de reporte por WhatsApp (identificación de póliza + tipo de servicio)
- Captura de ubicación GPS vía pin de WhatsApp
- Notificación automática de "proveedor asignado" con ETA

## 4. MVP — la versión "vergonzosa"

La primera versión de **Ruta Segura** es un bot de WhatsApp donde el
asegurado reporta su ubicación y tipo de servicio; un operador humano revisa
manualmente una lista corta de proveedores por zona y elige el más cercano;
y el sistema envía automáticamente 3 mensajes de WhatsApp (asignado con ETA,
en camino, llegó), sin app de proveedor, sin mapa de tracking en vivo, sin
fallback automático y sin panel de KPIs.

## 5. Reto de la IA al recorte (challenge del MVP)

Al pedirle a la IA (Gemini) que fuera dura con la crítica, identificó que dos
funciones catalogadas como Must en realidad son opcionales para una primera
versión real:

1. **Motor de asignación por score** (de Must a Should): con un piloto de
   pocos servicios diarios, un operador de cabina puede asignar manualmente
   con un mapa abierto en una segunda pantalla en menos de un minuto.
   Automatizar la asignación antes de validar si el bot reduce la ansiedad
   del cliente es una inversión prematura.
2. **Notificaciones de cambio de estatus automatizadas** (de Must a
   Should/Could): el núcleo de la ansiedad se mitiga con el primer mensaje
   ("Tu grúa viene en camino, llega a las 4:15 PM"); los estados intermedios
   son un extra de experiencia, no indispensables para el MVP.

### Flujo mínimo viable resultante

```
[Asegurado] --(WhatsApp Bot)--> [Consola / Email de Cabina]
                                   (Humano busca en lista y llama)
[Asegurado] <--(Mensaje de Texto)-- [Proveedor]
   "Tu grúa va en camino (ETA: 30m)"
```

0. **Captura (Digital):** el asegurado interactúa con el bot de WhatsApp y
   manda su ubicación (pin de GPS) y placas. Esto queda guardado en una base
   de datos o llega como ticket/correo a la cabina (elimina el error de
   captura telefónica).
1. **Procesamiento (Humano):** el operador recibe el ticket, ve el pin en
   Google Maps, abre un Excel de proveedores de esa zona, ve quién está de
   turno y lo llama por teléfono.
2. **Confirmación (Semi-automática):** el operador escribe en la consola el
   tiempo que le prometió el proveedor y el sistema dispara al cliente el
   único mensaje crucial de ETA.
3. **Ejecución:** la grúa llega; el operador humano cierra el ticket
   manualmente cuando el proveedor le avisa por radio/teléfono que terminó.

## 6. Revisión y cambios respecto al corte original

Se bajó el **motor de asignación por score** de Must a Should: en el MVP, el
operador humano elige manualmente al proveedor más cercano de una lista
corta por zona, en lugar de un algoritmo automático. La razón es que el
problema central que se quiere validar es si la visibilidad y las
notificaciones reducen la ansiedad y las llamadas repetitivas; eso se puede
probar con asignación manual. Automatizar la asignación es una optimización
de eficiencia que tiene sentido añadir después de validar que el modelo de
notificación funciona, no antes.
