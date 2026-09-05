-- Ruta Segura — agrega la columna folio a solicitudes_servicio
-- Correr manualmente en el SQL Editor de Supabase (proyecto awidrebfaiqmiqfwzclk).
-- El folio ahora lo genera api/submit-solicitud.mjs (formato RS-XXXXXXXX)
-- y queda guardado en la misma fila que inserta, en vez de vivir solo en
-- el navegador (ver DOCS/FRD.md, D3, que documentaba esa limitación).

alter table solicitudes_servicio
  add column if not exists folio text unique;
