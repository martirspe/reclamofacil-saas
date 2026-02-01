# Dataset UBIGEO (Perú)

Contiene el dataset de **1,893 distritos del Perú** en formato JSON.

## Archivo
- `ubigeo.json` - Dataset completo con código UBIGEO INEI, distrito, provincia y departamento.

## Formato
```json
[
  {
    "ubigeo": "150101",
    "district": "LIMA",
    "province": "LIMA",
    "department": "LIMA",
    "active": true
  },
  {
    "ubigeo": "150102",
    "district": "ANCON",
    "province": "LIMA",
    "department": "LIMA",
    "active": true
  }
]
```

## Carga a BD
Ejecuta:
```bash
npm run seed:locations
```

El script `src/scripts/seed-locations.js` lee `ubigeo.json` e inserta/actualiza todos los registros en la tabla `locations`.

## Notas
- Todos los valores están en **mayúsculas**.
- El código UBIGEO tiene **6 dígitos** (código oficial INEI).
- Cobertura nacional completa: 1,893 distritos.
- Fuente: INEI - Instituto Nacional de Estadística e Informática.

