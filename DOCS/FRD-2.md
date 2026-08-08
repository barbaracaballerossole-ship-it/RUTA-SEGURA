# FRD — Ruta Segura: Bot de WhatsApp de reporte y cobro

**Autor:** Bárbara Elizabeth Caballeros Solé (Carné 9714619)
**Fecha:** 17 de julio de 2026
**Actualizado:** 26 de julio de 2026 — alcance revisado: se elimina la
validación de póliza/aseguradora y se agrega el flujo de cotización y
confirmación de pago, conforme al nuevo scope comercial directo (ver
`Exercise_2.1_Reconstruccion.md` y `PRD.md`). El cobro se maneja como
**pago por evento**: cada solicitud se paga por separado mediante un link
de pago genérico o transferencia, sin conexión directa a una pasarela de
pago.

## 1. Feature seleccionada

Del venture **Ruta Segura** se elige el feature #1: **Bot de WhatsApp de
reporte, cotización y cobro**. Es el flujo por el cual el cliente selecciona
el servicio de asistencia vial que necesita, conoce el precio, comparte su
ubicación y confirma el pago. Es el punto de entrada de todo el venture; sin
ese flujo, ningún otro feature Must puede arrancar.

> **Nota de cambio:** la pantalla original de "Bienvenida e identificación"
> (que validaba número de póliza contra una base de aseguradora) se elimina.
> En su lugar, la Pantalla 1 ahora identifica al cliente por su número de
> teléfono (sin validación externa) y lo dirige directo a la selección del
> servicio.

## 2. Especificación — pantallas, entradas y salidas

| Pantalla | Objetivo | ¿Qué ve / hace el usuario? | Data In (Entradas) | Data Out (Salidas del sistema) |
|---|---|---|---|---|
| **Bienvenida** | Identificar al cliente y dar la bienvenida. | El usuario recibe un mensaje de bienvenida. El sistema registra su número de teléfono como identificador (sin validar contra ninguna base externa). | Número de teléfono (automático) | Mensaje de bienvenida (ej.: "Hola, bienvenido a Ruta Segura. ¿Qué servicio necesitas?"); Avanza a Pantalla 2 |
| **Selección de servicio y cotización** | Identificar el tipo de asistencia requerida y mostrar el precio. | El usuario selecciona un servicio de una lista fija mediante botones interactivos; el bot responde con el precio fijo de ese servicio. | Grúa; Cambio de llanta; Paso de corriente; Cerrajero | Confirmación del servicio y precio (ej.: "Grúa: Q250. ¿Deseas continuar?"); Avanza a Pantalla 3 |
| **Captura de ubicación** | Obtener la ubicación exacta del incidente. | El sistema solicita compartir la ubicación mediante el pin nativo de WhatsApp. | Ubicación GPS (latitud y longitud) | El sistema identifica la dirección aproximada y pregunta: "¿Estás en Km 14 Carretera a El Salvador?" con botones **Sí / No**; Si confirma, avanza a Pantalla 4 |
| **Cobro y confirmación de pago** | Cobrar el servicio como pago por evento (sin pasarela conectada) y validarlo antes de despachar. | El sistema envía un link de pago genérico (o instrucciones de transferencia) y solicita al usuario avisar cuando haya pagado. | Confirmación del usuario "Ya pagué"; Comprobante (opcional, imagen) | Mensaje: "Estamos validando tu pago"; El caso pasa a estado "Pago pendiente de confirmación" para revisión del operador; Avanza a Pantalla 5 solo tras confirmación del operador |
| **Confirmación y envío a despacho** | Validar la información antes de generar el servicio. | El usuario recibe la confirmación de que su pago fue validado y su solicitud fue enviada a despacho. | (Ninguna — pantalla informativa) | Generación del número de folio; Mensaje: "Tu pago fue confirmado. Estamos buscando el proveedor más cercano."; El caso queda listo para asignación del operador |

## 3. Estados de error / edge cases

### 3.1 Falta de respuesta al PIN de ubicación (se mantiene del FRD original)

Si el bot no recibe el PIN dentro de 60 segundos, reenvía la solicitud UNA
vez con instrucciones simplificadas. Si transcurren 2 minutos en total sin
recibir el pin, el bot ofrece un botón alterno "escriba mi dirección" que
abre un campo de texto libre; ese texto se envía directamente a un operador
humano en cabina para geolocalizar manualmente y continuar el despacho, sin
bloquear el resto del flujo.

### 3.2 Nuevos edge cases derivados del flujo de cobro

1. **Pago nunca confirmado por el usuario.** Si el usuario no responde
   "Ya pagué" dentro de 10 minutos de haber recibido el link de pago, el
   bot envía un recordatorio único. Si transcurren 20 minutos totales sin
   respuesta, el caso se marca como "Abandonado" y el flujo se cierra sin
   generar folio.
2. **Usuario dice "Ya pagué" pero el operador no encuentra el pago.** El
   operador tiene un botón en su consola para marcar "Pago no encontrado",
   lo que dispara al bot un mensaje pidiendo el comprobante (captura de
   pantalla) como campo de texto/imagen libre; ese comprobante se envía al
   operador para validación manual, sin bloquear el resto del flujo.
3. **Usuario cambia de opinión después de pagar (cancelación).** Se define
   un comando "cancelar" disponible desde la Pantalla 4 en adelante; si se
   usa después de la confirmación de pago, el caso pasa a estado
   "Cancelación solicitada" para que el operador gestione el reembolso
   manualmente (fuera del alcance de automatización del MVP).

### 3.3 Vacíos lógicos heredados del flujo original (siguen vigentes)

1. **"Falso No" en la validación de dirección (Pantalla 3):** si el usuario
   presiona **No**, se reabre la pantalla pidiendo reenviar el PIN o
   escribir la dirección manualmente.
2. **Límite de inactividad del usuario (en cualquier pantalla):** no hay
   una ventana de expiración general de sesión distinta a las reglas ya
   definidas para el PIN y el pago; queda pendiente definir una expiración
   general de sesión (ej. 24 horas) para limpiar casos abandonados.

## 4. Los tres gaps más importantes y cómo se cierran

1. **Sin validación de identidad del cliente (ya no hay póliza que lo
   respalde).**
   *Cierre:* el número de teléfono de WhatsApp se usa como identificador
   único; no se requiere validación adicional para el MVP, dado que el pago
   previo ya funciona como filtro natural contra solicitudes no serias.

2. **No existe un comando de cancelar/corregir disponible durante el
   flujo.**
   *Cierre:* se agrega un comando persistente visible en cada mensaje que
   interrumpe el flujo en cualquier pantalla; antes del pago reinicia desde
   la Pantalla 2, después del pago dispara el estado de "Cancelación
   solicitada" descrito en 3.2.

3. **Riesgo de despachar sin pago realmente confirmado (falso positivo del
   operador).**
   *Cierre:* el operador debe adjuntar en su consola una referencia de pago
   (número de transacción o captura del comprobante) antes de poder mover
   el caso a "Confirmado"; sin esa referencia, el sistema no permite avanzar
   a la Pantalla 5.
