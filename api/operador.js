// api/operador.js — backoffice interno (consola de operador).
// Distinta de las demás funciones de esta carpeta: es CommonJS (.js, no
// .mjs — el proyecto no tiene package.json, así que un .js aquí se
// interpreta como CommonJS). Usa SUPABASE_SERVICE_KEY, la misma variable
// que api/submit-solicitud.mjs. Mismo manejo de errores que el resto de api/*.
const ESTADOS_VALIDOS = ['confirmado', 'pago_no_encontrado'];

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables' });
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
  };

  try {
    if (req.method === 'GET') {
      const columns = 'id,telefono,servicio,direccion,banco,numero_transaccion,folio,estado,created_at';
      const query = new URLSearchParams({
        select: columns,
        estado: 'eq.pendiente',
        order: 'created_at.desc'
      });
      const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/solicitudes_servicio?' + query.toString();

      const resp = await fetch(endpoint, { headers: baseHeaders });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        return res.status(resp.status).json({ error: data });
      }

      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { id, nuevoEstado } = req.body ?? {};

      if (!id || !nuevoEstado) {
        return res.status(400).json({ error: 'Missing required fields: id, nuevoEstado' });
      }

      if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
        return res.status(400).json({ error: `nuevoEstado must be one of: ${ESTADOS_VALIDOS.join(', ')}` });
      }

      const query = new URLSearchParams({ id: `eq.${id}` });
      const endpoint = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/solicitudes_servicio?' + query.toString();

      const resp = await fetch(endpoint, {
        method: 'PATCH',
        headers: { ...baseHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        return res.status(resp.status).json({ error: data });
      }

      return res.status(200).json({ success: true, data });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
};
