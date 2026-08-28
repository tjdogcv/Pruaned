/**
 * Reglas puras de presentación de capacidades. La autorización efectiva se
 * aplica en Supabase mediante RLS/RPC; estas reglas sólo mantienen el
 * contrato de flags que consume la interfaz, incluido el modo offline.
 */
export const resolvePermissions = ({ currentUser, sociosList, directorioCargos, isLmsManager, serverPermissions }) => {
  const isMasterUser = Boolean(
    serverPermissions.isMasterUser || currentUser?.role === 'master' || currentUser?.role === 'admin'
  );
  const currentUserSocio = sociosList.find((socio) => socio.email === currentUser?.email);
  const isDirectiva = Boolean(
    serverPermissions.isDirectiva || currentUser?.role === 'directiva' || isMasterUser ||
    (currentUserSocio && [
      directorioCargos.presidenteId,
      directorioCargos.vicepresidenteId,
      directorioCargos.secretarioId,
      directorioCargos.tesoreroId
    ].includes(currentUserSocio.id))
  );
  const socioPermisoVoluntarios = Boolean(
    currentUserSocio?.permisoGestionVoluntarios || currentUser?.permisoGestionVoluntarios
  );

  return {
    isMasterUser,
    isDirectiva,
    canManageCategoriesAndCargos: Boolean(serverPermissions.canManageCategoriesAndCargos || isMasterUser || isDirectiva),
    canManageVoluntarios: Boolean(serverPermissions.canManageVoluntarios || isMasterUser || isDirectiva || socioPermisoVoluntarios || isLmsManager),
    canManageFinances: Boolean(serverPermissions.canManageFinances || isMasterUser || isDirectiva),
    canPublishCMS: Boolean(serverPermissions.canPublishCMS || isMasterUser || isDirectiva)
  };
};
