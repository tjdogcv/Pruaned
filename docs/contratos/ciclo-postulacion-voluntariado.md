# Contrato: ciclo de postulación de voluntariado

**Fecha:** 2026-08-29
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

## BAC → FON | CONTRATO | ficha completa y activación

**Impacto:** el listado conserva todas sus claves históricas y añade
`fichaCompleta` (copia íntegra de `formularioCompleto`), `estadoActivacion`,
`ultimaInvitacionAt` y `activadoAt`. Para mostrar las respuestas extensas, FON
debe leer `fichaCompleta` con respaldo en `formularioCompleto`; no debe inferir
activación desde la sola existencia de una ficha.

`pruaned_get_volunteer_application_detail({ p_application_id })` devuelve el
mismo contrato para un gestor o para la persona titular de la solicitud.
Errores: `42501` y `P0002`.

Tras aprobar, la ficha queda en `estadoActivacion: 'pendienteInvitacion'`. Sólo
un gestor puede llamar la Edge Function autenticada `invite-volunteer` con
`{ volunteerId }`. La función reserva el envío por RPC, limita reintentos a uno
cada cinco minutos y usa `auth.admin.inviteUserByEmail` exclusivamente en el
servidor. Estados: `pendienteInvitacion`, `invitacionEnCurso`, `invitado`,
`pendienteConfirmacion`, `activo`, `errorInvitacion`.

**Acción requerida de FON:** mostrar una acción de envío sólo cuando
`canManageVoluntarios` sea verdadero, mostrar último envío/estado y refrescar
el listado al terminar. El navegador nunca debe llamar a Auth Admin ni manejar
una clave de servicio.

## BAC → FON | ENTREGA | 2026-08-29

- **Archivos:** `20260829_activacion_voluntariado.sql`,
  `supabase/functions/invite-volunteer/index.ts` y este contrato.
- **Prueba de integración:** aplicar la migración; aprobar una solicitud;
  verificar ambas fichas JSON; invocar la función como gestor; aceptar el correo
  y comprobar la transición a `activo` por trigger.
- **Despliegue de operaciones:** publicar la función con JWT validado y definir
  `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` y `ALLOWED_ORIGINS` como secretos de
  Supabase. La service role nunca va en `VITE_*` ni en el repositorio.
- **Compatibilidad:** aditiva. `formularioCompleto` continúa disponible para
  consumidores actuales.
