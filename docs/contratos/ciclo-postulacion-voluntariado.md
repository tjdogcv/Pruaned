# Contrato: ciclo de postulación de voluntariado

**Fecha:** 2026-08-23  
**Responsable:** BAC  
**Consumidores:** `AuthContext`, interfaz pública de postulación, intranet de voluntariado y Directiva.

## Estados y origen

`postulaciones_voluntariado.tipo`: `ingreso`, `ascenso_socio` o `derivada_socio`.

`estado`: `pendiente`, `aprobada`, `rechazada` o `cancelada`. Una solicitud derivada desde una postulación de socio rechazada se guarda ya `aprobada`; su ficha de voluntario queda `activo`, con origen `postulacion_socio_rechazada`.

La conversión de socio rechazado a voluntario es una única transacción: nunca se actualiza la postulación de socio sin crear o activar la ficha de voluntario asociada.

## API de `useAuth`

| Método | Permiso del servidor | Resultado |
| --- | --- | --- |
| `addPostulacionVoluntario(payload)` | Público | Crea solicitud `ingreso` pendiente. |
| `addPostulacion(payload)` | Público | Mantiene la postulación de socio compatible, ahora mediante RPC segura. |
| `updatePostulacionVoluntariadoEstado(id, 'aprobar'|'rechazar', observacion)` | Directiva, gestor de voluntariado o gestor LMS | Aprueba/rechaza el ingreso; al aprobar crea/activa ficha. |
| `solicitarIngresoSocioDesdeVoluntariado({ motivacion, antecedentes })` | Voluntario autenticado y activo | Crea solicitud `ascenso_socio` pendiente. |
| `updateSolicitudIngresoSocioDesdeVoluntariado(id, 'aprobar'|'rechazar', categoria, observacion)` | Directiva | Resuelve ascenso; al aprobar crea/actualiza socio sin borrar al voluntario. |
| `updatePostulacionEstado(id, estado, categoria, observacion)` | Directiva | Compatible con la admisión existente; su revisión remota es atómica. |

Todas devuelven `Promise<{ ok: true, data } | { ok: false, error: { code, message } }>`. La lista `postulacionesVoluntariadoList` contiene sólo registros autorizados: los gestores ven todas y el voluntario ve las propias.

## Payload público

El formulario entrega `nombreCompleto`, `rut`, `fechaNacimiento`, `email`, `telefono`, `region`, `comuna`, `profesionEspecialidad`, `experiencia`, `disponibilidad`, `areasInteres`, `recursos`, `motivacion` y `aceptaTerminos`.

El servidor conserva las respuestas y datos complementarios en `formulario_completo JSONB`. Sólo la identidad operativa y los campos necesarios para listar/revisar se materializan como columnas.

## Seguridad y compatibilidad

- El cliente no tiene políticas de escritura directa sobre `postulaciones_voluntariado` ni `postulaciones`; debe usar RPC.
- Las RPC revisan sesión, cargo y transición de estado. Los errores relevantes son `22023` (payload), `23505` (duplicado), `42501` (permiso), `P0002` (no encontrado) y `P0001` (transición inválida).
- La migración `20260823_ciclo_postulacion_voluntariado.sql` es idempotente. Debe aplicarse en Supabase antes de habilitar el flujo en producción.
- Se conserva la firma histórica de `updatePostulacionEstado`, por lo que las pantallas existentes de Socios no requieren migración de llamada.
