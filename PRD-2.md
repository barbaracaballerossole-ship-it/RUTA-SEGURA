# PRD — Ruta Segura

**Autor:** Bárbara Elizabeth Caballeros Solé (Carné 9714619)
**Fecha:** 17 de julio de 2026
**Actualizado:** 26 de julio de 2026 — alcance revisado tras observaciones
del profesor sobre el Exercise 2.1 (ver `Exercise_2.1_Reconstruccion.md`).

> **Cambio de alcance:** Ruta Segura deja de ser un servicio de despacho
> ligado a una aseguradora y pasa a ser un **producto comercial directo de
> asistencia vial**: el usuario contrata y paga el servicio directamente vía
> WhatsApp, sin verificación de póliza ni dependencia de datos de terceros
> (aseguradoras). Este cambio elimina la dependencia más difícil del
> proyecto original.

## 1. Problema

Cuando a un conductor se le poncha una llanta, se queda varado por batería
descargada o necesita una grúa en carretera, no tiene una forma simple,
rápida y confiable de contratar asistencia vial en el momento: debe buscar
un taller o gruero por su cuenta, negociar precio sin referencia y esperar
sin saber cuándo llegará realmente la ayuda.

## 2. Candidatos de features (backlog inicial)

- Bot de WhatsApp para solicitar el servicio (grúa, cambio de llanta, paso de corriente, cerrajero)
- Captura de ubicación GPS vía pin de WhatsApp
- Cobro del servicio: pago por evento (sin conexión directa a una pasarela de pago; se paga cada solicitud por separado mediante link manual o transferencia, confirmada por un operador)
- Catálogo simple de servicios y precios (pago por evento, sin planes ni membresías)
- Motor de asignación por score (ETA, costo, calificación) que elige proveedor automáticamente
- Notificación automática de "proveedor asignado" con ETA
- Notificaciones de cambio de estatus (en camino / llegó / finalizado)
- Portal/app para que el proveedor actualice su propio estatus
- Encuesta de satisfacción (tNPS) automática al cerrar el servicio
- Panel de KPIs (TMO, SLA de arribo, ventas) para el equipo de operaciones

## 3. Priorización MoSCoW

| # | Feature | Categoría | Justificación (test de remoción) |
|---|---|---|---|
| 1 | Bot de reporte WhatsApp | Must | Sin esto no hay forma de captar la solicitud; el trabajo central no arranca. |
| 2 | Captura de ubicación GPS | Must | Sin ubicación no se puede despachar a ningún proveedor. |
| 3 | Cobro del servicio (pago por evento) | Must | Sin cobro no hay negocio: es un producto comercial, no un beneficio de póliza. |
| 4 | Catálogo simple de servicios y precios | Must | El usuario necesita saber qué está comprando y a qué precio antes de pagar. |
| 5 | Notificación "asignado + ETA" | Must | Es el primer alivio a la incertidumbre; sin ella el cliente no sabe si alguien viene. |
| 6 | Motor de asignación por score | Should | Un operador puede asignar manualmente al inicio; automatizarlo es una optimización, no el core. |
| 7 | Notificaciones de cambio de estatus | Should | El mensaje inicial de ETA ya cubre el job básico de visibilidad. |
| 8 | Portal para que el proveedor actualice su estatus | Should | Al inicio un operador puede actualizar el estatus manualmente. |
| 9 | Encuesta tNPS automática | Could | Se puede medir con seguimiento manual mientras el volumen es bajo. |
| 10 | Panel de KPIs | Won't (have now) | Útil para escalar, pero no se necesita para validar si el modelo comercial funciona. |

### Las tres Musts del MVP

- Bot de WhatsApp para solicitar el servicio + captura de ubicación GPS
- Cobro del servicio: pago por evento, validado manualmente por un operador (sin pasarela de pago conectada)
- Notificación automática de "proveedor asignado" con ETA

## 4. MVP — la versión "vergonzosa"

La primera versión de **Ruta Segura** es un bot de WhatsApp donde el usuario
reporta su ubicación y el tipo de servicio de asistencia vial que necesita
(grúa, cambio de llanta, paso de corriente o cerrajero), paga mediante un
link de pago o confirma su transferencia con un operador humano; ese mismo
operador revisa manualmente una lista corta de proveedores por zona y elige
el más cercano; y el sistema envía automáticamente un mensaje de WhatsApp
con el proveedor asignado y su ETA — sin catálogo de planes o membresías,
sin selección automática de proveedor, sin notificaciones de estatus
intermedias, sin portal de proveedor y sin panel de KPIs.

## 5. Reto de la IA al recorte (challenge del MVP)

Al pedirle a la IA que fuera dura con la crítica sobre este alcance, se
identificaron dos ajustes:

1. **Cobro del servicio (¿necesita una pasarela conectada?):** Ruta Segura
   no integra una pasarela de pago directa; el cobro es **pago por evento**:
   cada solicitud se paga por separado mediante un link de pago genérico (o
   transferencia bancaria) que el operador humano confirma manualmente
   antes de despachar. Esta no es una limitación temporal del MVP, sino una
   decisión de diseño: al no manejar planes ni membresías, no hay beneficio
   claro en integrar una pasarela propia todavía. El requisito de negocio
   ("no se despacha sin pago confirmado") es Must; la validación sigue
   siendo manual por diseño.
2. **Catálogo simple de servicios y precios:** no necesita ser una pantalla
   dinámica en el bot; en el MVP puede ser una lista fija de 4 servicios
   con precio fijo, comunicada como texto simple dentro del propio flujo de
   WhatsApp, sin necesidad de un catálogo administrable.

### Flujo mínimo viable resultante

```
[Cliente] --(WhatsApp Bot: servicio + ubicación)--> [Consola de operador]
                                                        (operador confirma pago
                                                         y busca proveedor)
[Cliente] <--(Mensaje de Texto)-- [Proveedor asignado, ETA]
```

0. **Captura y cotización (Digital):** el cliente elige uno de los 4
   servicios de una lista fija con precio fijo y comparte su ubicación
   (pin de GPS). El bot responde con el precio y el link/instrucciones de
   pago.
1. **Confirmación de pago (Semi-automática):** el cliente paga o
   transfiere; el operador confirma el pago manualmente en la consola antes
   de continuar.
2. **Despacho (Humano):** el operador ve el pin en el mapa, revisa una
   lista corta de proveedores de la zona y llama al más cercano.
3. **Notificación (Automática):** el sistema envía el único mensaje
   crucial: proveedor asignado + ETA.
4. **Cierre (Humano):** el operador cierra el caso manualmente cuando el
   proveedor avisa que terminó.

## 6. Revisión y cambios respecto al corte original

Se eliminó por completo la dependencia de pólizas y aseguradoras, que era
la dependencia más difícil identificada en la revisión del profesor. Ya no
existe una pantalla de "identificación de póliza"; el cliente contrata el
servicio directamente como producto comercial. Se agregó el **cobro** como
feature Must, algo que no existía en la versión ligada al seguro (donde el
servicio ya estaba prepagado por la póliza); tras el reto de la IA, se
definió que el cobro sería **pago por evento**, sin conexión directa a una
pasarela de pago — cada solicitud se cobra y confirma por separado. El motor de
asignación por score y las notificaciones de estatus intermedias se
mantienen como Should: un operador humano puede asignar y actualizar
estatus manualmente mientras se valida el modelo comercial, antes de
invertir en automatización.
