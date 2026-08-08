# Ruta Segura — Brand Brief

## What it is
Ruta Segura es un bot de WhatsApp de asistencia vial en Guatemala. El conductor varado (llanta ponchada, batería descargada, cerrajería, grúa) elige su servicio, ve el precio fijo, comparte su ubicación y paga por evento para que un operador le asigne el proveedor más cercano.

## Palette
- Primary: #0B3954 (azul carretera profundo — confianza, seriedad de emergencia)
- Accent: #087E8B — se usa en el precio del servicio, el botón de pago y el badge de "proveedor asignado"
- Background: #F7F7F2

## Fonts
- Headings: Poppins
- Body: Open Sans

## Tone
Rápido, confiable, cercano. Not this: no debe sentirse como un portal de seguros burocrático — nada de letra pequeña, candados de "verificando póliza" ni lenguaje corporativo frío.

## Screens
- Bienvenida (home)

## Stack, pinned
Plain HTML, CSS and JavaScript reading a local JSON file, styled with Bootstrap 5 loaded from a CDN. No framework, no npm, no build step.
Bootstrap 5 — two lines, both required:
```html
<!-- in <head> -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
<!-- just before </body> -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
```