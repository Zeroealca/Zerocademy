# DEMY-140–144 — campaña final de aceptación

## Resultado

**ACCEPTED** — tres pasadas consecutivas con el mismo inventario de 46 pruebas
y la misma huella de fuente.

| Pasada | Pruebas | Fallos | Omitidas | Flaky/reintentos | Exit code |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 46 | 0 | 0 | 0 | 0 |
| 2 | 46 | 0 | 0 | 0 | 0 |
| 3 | 46 | 0 | 0 | 0 | 0 |

Total ejecutado: **138** pruebas.

## Inventario

- DEMY-140: 16 desktop/mobile escenarios de estructura, ciclo de vida,
  autorización, respuesta y cuadrícula.
- DEMY-142: 10 escenarios de horario docente desktop.
- DEMY-143: 12 escenarios de estudiantes/representantes, desktop y mobile.
- DEMY-144: 8 escenarios de ClassSession, 4 desktop y 4 Pixel 5.

## Línea base y seguridad

- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Huella congelada: `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144`
- Backend E2E: `postgres` / `zerocademy_e2e`, reloj E2E activo y migración
  `20261026123000_class_session_timetable_origin` aplicada en cada pasada.
- Playwright: 1.64.0; Chromium Desktop Chrome y emulación Pixel 5.

## Limpieza y fixtures históricos

Después de cada pasada: cero instituciones y ClassSession propias de campaña,
y cero JSON temporal. Los nueve fixtures históricos `BROWSER-FIXTURE-*`
registrados antes de la campaña conservaron exactamente los mismos IDs; no se
modificaron ni borraron.

La excepción HTTP de permiso faltante de DEMY-144 permanece documentada en la
verificación enfocada y no se presenta como una prueba HTTP construible.
