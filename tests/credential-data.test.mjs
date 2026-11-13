import test from 'node:test';
import assert from 'node:assert/strict';
import { CR80, buildCredentialData, computeValidityDate } from '../src/lib/credentialData.js';

test('Las dimensiones físicas cumplen exactamente el tamaño estándar tarjeta de crédito CR80 (300 DPI)', () => {
  assert.deepEqual(CR80.horizontal, {
    widthMm: 85.6,
    heightMm: 53.98,
    widthPx: 1011,
    heightPx: 638,
    orientation: 'horizontal'
  });
  assert.deepEqual(CR80.vertical, {
    widthMm: 53.98,
    heightMm: 85.6,
    widthPx: 638,
    heightPx: 1011,
    orientation: 'vertical'
  });
});

test('Credencial de Socio preserva nombres extensos sin truncar y genera código PRU-SOC con QR', () => {
  const longName = 'Cristóbal Alejandro Viveros Villablanca del Valle';
  const data = buildCredentialData({
    type: 'socio',
    origin: 'https://pruaned.cl',
    referenceDate: new Date('2026-06-15T12:00:00Z'),
    member: {
      id: '6edd8bd7-1111-2222-3333-444455556666',
      nombre: longName,
      rut: '18768335-1',
      profesion: 'Licenciado en ciencias veterinarias',
      region: 'Biobío',
      categoria: 'Socio Activo',
      estadoCuota: 'Al Día',
      activo: true
    }
  });

  assert.equal(data.type, 'socio');
  assert.equal(data.spec.orientation, 'horizontal');
  assert.equal(data.spec.widthMm, 85.6);
  assert.equal(data.spec.heightMm, 53.98);
  assert.equal(data.fullName, longName);
  assert.ok(!data.fullName.includes('...'));
  assert.equal(data.rut, '18.768.335-1');
  assert.equal(data.code, 'PRU-SOC-18768335-1');
  assert.equal(data.verifyUrl, 'https://pruaned.cl/verificar/PRU-SOC-18768335-1');
  assert.equal(data.isActive, true);
  assert.equal(data.vigencia, '31/12/2026');
});

test('Credencial de Voluntario usa formato vertical diferenciado PRU-VOL y lee ficha datos_postulacion', () => {
  const data = buildCredentialData({
    origin: 'https://pruaned.cl/',
    referenceDate: new Date('2026-06-15T12:00:00Z'),
    member: {
      id: 'vol-99887766',
      nombre: 'Natalia González Contreras',
      rut: '17.673.849-9',
      categoria: 'Voluntario Activo',
      estado: 'activo',
      region: 'Metropolitana de Santiago',
      fechaIngreso: '2026-02-10',
      datosPostulacion: {
        formulario: {
          profesionEspecialidad: 'Médico Veterinaria Fauna Terrestre',
          comuna: 'Ñuñoa'
        }
      }
    }
  });

  assert.equal(data.type, 'voluntario');
  assert.equal(data.spec.orientation, 'vertical');
  assert.equal(data.spec.widthMm, 53.98);
  assert.equal(data.spec.heightMm, 85.6);
  assert.equal(data.code, 'PRU-VOL-17673849-9');
  assert.equal(data.verifyUrl, 'https://pruaned.cl/verificar/PRU-VOL-17673849-9');
  assert.equal(data.roleLabel, 'Voluntario/a');
  assert.equal(data.profession, 'Médico Veterinaria Fauna Terrestre');
  assert.equal(data.isActive, true);
  assert.match(data.vigencia, /^\d{2}\/\d{2}\/2027$/);
});

test('Voluntarios y Socios inactivos o renunciantes quedan marcados sin vigencia', () => {
  const inactiveVol = buildCredentialData({
    type: 'voluntario',
    member: {
      id: 'abc12345',
      nombre: 'Persona Inactiva',
      rut: '11111111-1',
      estado: 'inactivo',
      activo: false
    }
  });

  assert.equal(inactiveVol.isActive, false);
  assert.equal(inactiveVol.vigencia, 'Sin vigencia');
  assert.equal(computeValidityDate({}, {}, false), 'Sin vigencia');
});
