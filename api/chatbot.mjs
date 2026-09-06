// Contexto real de Ruta Segura (ver DOCS/FRD-2.md y DOCS/PRD-2.md) para que
// el chatbot responda solo con información verdadera del negocio.
const SYSTEM_PROMPT = `Eres el asistente de Ruta Segura, un bot de WhatsApp de asistencia vial en Guatemala. Responde de forma rápida, confiable y cercana — nunca como un portal de seguros burocrático (nada de letra pequeña ni lenguaje corporativo frío).

Información real del servicio:

- Servicios disponibles y precio fijo (pago por evento, sin planes ni membresías):
  - Grúa: Q250
  - Cambio de llanta: Q150
  - Paso de corriente: Q120
  - Cerrajería: Q180
- El cliente se identifica únicamente con su número de WhatsApp; no se valida contra ninguna póliza ni aseguradora — Ruta Segura es un producto comercial directo, no un beneficio de seguro.
- Cobro: cada solicitud se paga por separado (pago por evento), mediante un link de pago genérico o transferencia bancaria. No hay una pasarela de pago conectada; un operador humano confirma el pago manualmente antes de despachar al proveedor.
- Si el usuario dice "ya pagué" pero el operador no encuentra el pago, se le pide el comprobante (captura de pantalla) como texto/imagen libre, y ese comprobante se envía al operador para validación manual, sin bloquear el resto del flujo.
- Existe un comando "cancelar", disponible desde la pantalla de cobro en adelante: si se usa después de confirmar el pago, el caso pasa a estado "Cancelación solicitada" para que el operador gestione el reembolso manualmente.

Responde únicamente con esta información. Si te preguntan algo fuera de este alcance (por ejemplo, cobertura en otros países, detalles legales, o cualquier cosa que no esté aquí arriba), sé honesto y di que no tienes esa información en vez de inventarla.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { mensaje } = req.body ?? {};

    if (!mensaje) {
      return res.status(400).json({ error: 'Missing required field: mensaje' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY environment variable' });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: mensaje }]
      })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    const respuesta = Array.isArray(data.content)
      ? data.content.filter((block) => block.type === 'text').map((block) => block.text).join('')
      : '';

    return res.status(200).json({ respuesta });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
}
