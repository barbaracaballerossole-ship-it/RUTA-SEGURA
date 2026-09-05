-- Ruta Segura — agrega seguimiento de estado a solicitudes_servicio
-- Correr manualmente en el SQL Editor de Supabase (proyecto awidrebfaiqmiqfwzclk).
-- Ver DOCS/FRD-2.md (3.2) para los estados del flujo de cobro/cancelación.

alter table solicitudes_servicio
  add column if not exists estado text not null default 'pendiente',
  add column if not exists created_at timestamptz not null default now();

-- Restringe estado a los valores que el flujo realmente usa (ver FRD-2 3.2):
-- pendiente            -> recién insertada, esperando confirmación de pago
-- confirmado           -> el operador validó el pago, pasa a despacho
-- pago_no_encontrado   -> el operador no encontró el pago, pide comprobante
-- abandonado           -> 20 min sin confirmar pago (api/mark-abandoned)
-- cancelacion_solicitada -> el usuario canceló desde Dirección en adelante (api/cancel-solicitud)
alter table solicitudes_servicio
  add constraint solicitudes_servicio_estado_check
  check (estado in ('pendiente', 'confirmado', 'pago_no_encontrado', 'abandonado', 'cancelacion_solicitada'));

-- Acelera el PATCH de mark-abandoned/cancel-solicitud, que busca por
-- teléfono la solicitud "pendiente" más reciente (no hay folio/id en el
-- navegador para identificar la fila directamente — ver DOCS/FRD.md, D3).
create index if not exists solicitudes_servicio_telefono_estado_created_at_idx
  on solicitudes_servicio (telefono, estado, created_at desc);
