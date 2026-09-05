import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { telefono, servicio, direccion, banco, numero_transaccion } = req.body ?? {};

    if (!telefono || !servicio || !direccion) {
      return res.status(400).json({ error: 'Missing required fields: telefono, servicio, direccion' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables' });
    }

    // El folio se genera aquí, en el servidor, no en el navegador: así el
    // mismo valor que se muestra al usuario es el que queda en la fila.
    const folio = 'RS-' + randomUUID().split('-')[0].toUpperCase();
    const estado = 'pendiente';

    const payload = {
      telefono,
      servicio,
      direccion,
      banco: banco ?? null,
      numero_transaccion: numero_transaccion ?? null,
      estado,
      folio
    };

    const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/solicitudes_servicio';

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    // Devolvemos solo folio y estado (no la fila completa, para no exponer
    // teléfono/dirección en la respuesta); tomamos ambos de la fila que
    // Supabase realmente guardó, no de las variables locales de arriba.
    const insertedRow = Array.isArray(data) && data[0] ? data[0] : {};

    return res.status(200).json({
      success: true,
      folio: insertedRow.folio ?? folio,
      estado: insertedRow.estado ?? estado
    });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
}
