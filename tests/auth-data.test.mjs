import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidChileanRut, toPostulacionInsert } from '../src/lib/authData.js';
import { resolvePermissions } from '../src/context/authPermissionRules.js';

const noPermissions = {
  isMasterUser: false,
  isDirectiva: false,
  canManageCategoriesAndCargos: false,
  canManageVoluntarios: false,
  canManageFinances: false,
  canPublishCMS: false
};

test('mantiene la validación modular de RUT chileno', () => {
  assert.equal(isValidChileanRut('12.345.678-5'), true);
  assert.equal(isValidChileanRut('12.345.678-0'), false);
});

test('persiste la postulación ampliada en JSONB y sólo columnas base', () => {
  const formularioCompleto = { comuna: 'Ñuñoa', consentimientoDatos: true };
  const insert = toPostulacionInsert({
    id: 'post-local',
    nombreCompleto: 'Ada Lovelace',
    rut: '10.102.304-5',
    fechaNacimiento: '1990-01-01',
    email: 'ada@example.org',
    telefono: '+56912345678',
    profesion: 'Ingeniera',
    razonesIntegracion: 'Aportar',
    formularioCompleto
  });

  assert.deepEqual(insert, {
    fecha_envio: insert.fecha_envio,
    estado: 'Pendiente Revisión Directorio',
    nombre_completo: 'Ada Lovelace',
    rut: '10.102.304-5',
    fecha_nacimiento: '1990-01-01',
    email: 'ada@example.org',
    telefono: '+56912345678',
    profesion: 'Ingeniera',
    razones_integracion: 'Aportar',
    formulario_completo: formularioCompleto
  });
  assert.equal('id' in insert, false);
  assert.equal('comuna' in insert, false);
});

test('no concede permisos sólo por un perfil de socio sin capacidad explícita', () => {
  const permissions = resolvePermissions({
    currentUser: { email: 'socio@example.org', role: 'socio' },
    sociosList: [{ id: 's-1', email: 'socio@example.org', permisoGestionVoluntarios: false }],
    directorioCargos: {},
    isLmsManager: false,
    serverPermissions: noPermissions
  });

  assert.equal(permissions.isMasterUser, false);
  assert.equal(permissions.isDirectiva, false);
  assert.equal(permissions.canManageFinances, false);
  assert.equal(permissions.canManageVoluntarios, false);
});
