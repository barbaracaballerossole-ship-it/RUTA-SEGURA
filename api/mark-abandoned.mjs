// Marca como "abandonado" la solicitud pendiente de un teléfono.
// La dispara el timeout de 20 minutos en pago.html (ver DOCS/FRD-2.md, 3.2.1).
//
// No hay folio ni id guardados en el navegador para identificar la fila
// exacta (ver DOCS/FRD.md, actualización D3: el folio nunca se guarda como
// columna, para no requerir una política de lectura pública sobre la
// tabla). Por eso se ubica por teléfono: se actualiza la solicitud
// "pendiente" más reciente de ese número (order + limit sobre el PATCH).
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'POST, PATCH');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { telefono } = req.body ?? {};

    if (!telefono) {
      return res.status(400).json({ error: 'Missing required field: telefono' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables' });
    }

    const query = new URLSearchParams({
      telefono: `eq.${telefono}`,
      estado: 'eq.pendiente',
      order: 'created_at.desc',
      limit: '1'
    });
    const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/solicitudes_servicio?' + query.toString();

    const resp = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ estado: 'abandonado' })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    // data puede venir vacío si no había ninguna solicitud "pendiente" para
    // ese teléfono (ej. el usuario nunca llegó a pagar) — no es un error.
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
}
