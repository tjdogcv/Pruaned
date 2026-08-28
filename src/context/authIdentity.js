/** Normalización del perfil de sesión para el contrato público de useAuth. */
export const resolveUserForEmail = (email, socios = [], voluntarios = []) => {
  const cleanEmail = email.trim().toLowerCase();
  const foundSocio = socios.find((socio) => socio.email?.toLowerCase() === cleanEmail);

  if (foundSocio) {
    return {
      email: foundSocio.email,
      name: foundSocio.nombre,
      role: 'socio',
      rut: foundSocio.rut,
      permisoGestionVoluntarios: foundSocio.permisoGestionVoluntarios || false
    };
  }

  const foundVoluntario = voluntarios.find((voluntario) => voluntario.email?.toLowerCase() === cleanEmail);
  if (foundVoluntario) {
    return {
      email: foundVoluntario.email,
      name: foundVoluntario.nombre,
      role: 'voluntario',
      rut: foundVoluntario.rut,
      permisoGestionVoluntarios: false
    };
  }

  return {
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'socio',
    rut: '15.482.910-K',
    permisoGestionVoluntarios: false
  };
};
