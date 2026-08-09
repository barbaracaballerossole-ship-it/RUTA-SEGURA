# Ruta Segura

Bot de WhatsApp de asistencia vial en Guatemala. El conductor varado (llanta ponchada, batería descargada, cerrajería, grúa) elige su servicio, ve el precio fijo, comparte su ubicación y paga por evento para que un operador le asigne el proveedor más cercano.

Proyecto del curso Emprenegocios Tecnológico.

## Prototipo en vivo

<https://barbaracaballerossole-ship-it.github.io/RUTA-SEGURA/>

## Flujo completo

El prototipo simula la conversación de WhatsApp dentro de un mockup de teléfono, pantalla por pantalla:

1. **Bienvenida** ([index.html](index.html)) — El bot saluda, muestra los cuatro servicios disponibles (grúa, cambio de llanta, paso de corriente, cerrajería) e identifica al usuario automáticamente por su número de WhatsApp. Botón **Comenzar**.
2. **Selección de servicio y cotización** ([seleccion-servicio.html](seleccion-servicio.html)) — El usuario elige un servicio de la lista (cargada desde [services.json](services.json)) y el bot responde con la cotización de precio fijo correspondiente.
3. **Confirmación de servicio** ([confirmacion-servicio.html](confirmacion-servicio.html)) — Resumen del servicio elegido y su precio antes de continuar; recuerda que un operador confirmará el pago antes de despachar al proveedor.
4. **Dirección** ([direccion.html](direccion.html)) — El usuario escribe la dirección donde necesita el servicio, la ve reflejada como mensaje propio en el chat y la confirma (Sí/No).
5. **Pago** ([pago.html](pago.html)) — Se muestra el monto a pagar; el usuario selecciona su banco y captura el número de transacción de su transferencia. El bot simula la validación del pago por parte de un operador.
6. **Confirmación final** ([confirmacion-final.html](confirmacion-final.html)) — Pago confirmado y folio generado (formato `RS-XXXXX`) para dar seguimiento a la asistencia mientras se busca al proveedor más cercano.

## Documentación

- [/DOCS/PRD-2.md](DOCS/PRD-2.md) — Product Requirements Document
- [/DOCS/FRD-2.md](DOCS/FRD-2.md) — Feature Requirements Document
- [/DOCS/FLOW.md](DOCS/FLOW.md) — Flujo de navegación

## Stack

HTML, CSS y JavaScript planos, leyendo un archivo JSON local (`services.json`), estilizados con Bootstrap 5 vía CDN. Sin framework, sin npm, sin build step.
