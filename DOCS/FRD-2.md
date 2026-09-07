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
**Actualizado (D2, 9 de agosto de 2026):** el prototipo web de D2 implementa
el flujo completo de las Pantallas 1 a 5 sin integración real de WhatsApp.
Dos adaptaciones respecto al FRD original: la Pantalla 3 usa un campo de
texto libre de dirección en vez del pin GPS nativo de WhatsApp (ver 3.1,
que ya contemplaba este camino como fallback), y la Pantalla 4 solicita
banco y número de transacción como campos estructurados en vez de solo un
botón "Ya pagué", para que la validación del operador tenga datos
concretos que revisar. El resto del flujo (selección de servicio,
cotización, confirmación, generación de folio) sigue la especificación
original sin cambios.
**Actualizado (D3, 23 de agosto de 2026):** el prototipo deja de ser una
simulación visual sin backend. La Pantalla 4 (Cobro y confirmación de pago)
ahora inserta de verdad la solicitud en la tabla `solicitudes_servicio` de
Supabase, con las mismas 5 columnas ya documentadas (`telefono, servicio,
direccion, banco, numero_transaccion`), sin cambios de esquema. La
Pantalla 5 (Confirmación y envío a despacho) ya no genera un folio al azar
en pantalla: muestra un folio real (`RS-XXXXXXXX`), generado en el
navegador con `crypto.randomUUID()` justo antes del insert, y solo se
llega a esa pantalla si el insert fue exitoso — si falla, la Pantalla 4
muestra el error y no avanza. El folio no se guarda como columna en
Supabase (para no requerir una política de lectura pública sobre la
tabla), así que el vínculo entre el folio mostrado y la fila insertada
vive únicamente en el navegador de esa sesión, no en la base de datos.
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
## Anexo — Arquitectura de Delivery 4 (7 de septiembre de 2026)

A partir de D4, el flujo deja de insertar directamente a Supabase desde el
navegador (como en D3) y pasa por funciones serverless propias desplegadas
en Vercel, cada una con su llave secreta guardada únicamente como variable
de entorno del servidor.

### Transacción del cliente
La Pantalla 4 (Cobro y confirmación de pago) llama a `POST /api/submit-solicitud`.
Esa función usa `SUPABASE_SERVICE_KEY` (llave de rol de servicio, nunca
expuesta al navegador) para insertar la fila en `solicitudes_servicio`,
generar el folio (`RS-XXXXXXXX`) y devolverlo al cliente junto con el
estado inicial `pendiente`. La política de `INSERT` para el rol `anon`
fue eliminada de la tabla: el navegador ya no tiene permiso de escritura
directa, solo la función con la llave de servicio puede insertar.

### Chatbot fundamentado
Un widget de chat flotante, visible en todas las pantallas del producto,
llama a `POST /api/chatbot`. Esa función usa `ANTHROPIC_API_KEY` (también
solo en el servidor) para llamar al modelo Claude, con un system prompt
que contiene la información real del venture: los 4 servicios y precios
fijos, la política de pago por evento sin pasarela conectada, el flujo de
comprobante cuando el operador no encuentra el pago, y el comando
"cancelar". El modelo responde solo con esa información.

### Consola de operador (backoffice)
Página `operador-9714619.html`, sin enlace desde el producto público,
que llama a una segunda función serverless distinta, `api/operador.js`
(misma llave de servicio). Lista las solicitudes con `estado = pendiente`
y permite al operador cambiar el estado a `confirmado` o
`pago_no_encontrado` — el equivalente digital de la consola descrita en
la Sección 4 del PRD original.

### Tercera transacción (cancelación)
`api/cancel-solicitud.mjs` implementa el comando "cancelar" descrito en
la sección 3.2.3 de este documento, cambiando el estado de una solicitud
a `cancelacion_solicitada`. Construida en la misma arquitectura, pendiente
de validación con evidencia en vivo al momento de este anexo.