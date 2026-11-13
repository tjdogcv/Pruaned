import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_FIELD_GROUPS,
  REGIONES_CHILE,
  VOLUNTEER_OPTIONS,
  applicationForm,
  displayValue,
  extractVolunteerDocuments,
  firstValue,
  hasFieldValue,
  volunteerForm
} from '../src/lib/volunteerPresentation.js';

test('REGIONES_CHILE y VOLUNTEER_OPTIONS incluyen catálogos completos para voluntariado permanente', () => {
  assert.equal(REGIONES_CHILE.length, 16);
  const expectedKeys = [
    'condicionAcademica',
    'proyeccionSocio',
    'disponibilidadMensual',
    'disponibilidadRespuesta',
    'transportePropio',
    'desplazamientoTerritorial',
    'labores',
    'areasInteres',
    'especiesComodas',
    'formacionCertificada',
    'recursos'
  ];
  for (const key of expectedKeys) {
    assert.ok(Array.isArray(VOLUNTEER_OPTIONS[key]), `Falta arreglo ${key}`);
    assert.ok(VOLUNTEER_OPTIONS[key].length >= 3, `${key} debe tener al menos 3 opciones`);
  }
});

test('hasFieldValue distingue arreglos vacíos y respeta booleanos falsos', () => {
  assert.equal(hasFieldValue(''), false);
  assert.equal(hasFieldValue(null), false);
  assert.equal(hasFieldValue(undefined), false);
  assert.equal(hasFieldValue([]), false);
  assert.equal(hasFieldValue(false), true);
  assert.equal(hasFieldValue(['Botiquín']), true);
  assert.equal(hasFieldValue('Ñuñoa'), true);
});

test('extractVolunteerDocuments soporta formularios nuevos, ficha de voluntario y envío pendiente por correo', () => {
  const fromApp = extractVolunteerDocuments({
    formularioCompleto: {
      certificadoAcademicoNombre: 'alumno_regular.pdf',
      certificadoAcademicoUrl: 'https://cdn.example/alumno_regular.pdf',
      certificacionesExtras: [
        { id: 'c1', nombre: 'sci_100.pdf', url: 'https://cdn.example/sci_100.pdf', tamano: 20480 }
      ]
    }
  });

  assert.deepEqual(fromApp.academicCert, {
    nombre: 'alumno_regular.pdf',
    url: 'https://cdn.example/alumno_regular.pdf'
  });
  assert.equal(fromApp.pendingByEmail, false);
  assert.equal(fromApp.extraCerts.length, 1);
  assert.equal(fromApp.totalCount, 2);

  const pendingEmailDoc = extractVolunteerDocuments({
    datosPostulacion: {
      formulario: {
        enviara_certificado_por_correo: true,
        certificaciones_extras: [{ nombre: 'curso.jpg', url: 'data:image/png;base64,AAA' }]
      }
    }
  });
  assert.equal(pendingEmailDoc.academicCert, null);
  assert.equal(pendingEmailDoc.pendingByEmail, true);
  assert.equal(pendingEmailDoc.extraCerts.length, 1);
  assert.equal(pendingEmailDoc.totalCount, 1);
});

test('applicationForm y volunteerForm conservan compatibilidad con fichas previas sin labors explícitas', () => {
  const legacyApplication = {
    nombreCompleto: 'Natalia González Contreras',
    rut: '17673849-9',
    email: 'nataliagcontreras356@gmail.com',
    telefono: '+56978096657',
    region: 'metropolitana',
    formularioCompleto: {
      comuna: 'Ñuñoa',
      profesionEspecialidad: 'Médico veterinaria',
      disponibilidad: 'Más de 8 horas al mes',
      areasInteres: ['Respuesta en emergencias', 'Bienestar animal'],
      recursos: ['Botiquín o insumos', 'Espacio de acopio'],
      aceptaTerminos: true
    }
  };

  const flattened = applicationForm(legacyApplication);
  assert.equal(firstValue(flattened, ['comuna']), 'Ñuñoa');
  assert.equal(displayValue(firstValue(flattened, ['aceptaTerminos'])), 'Sí');
  assert.equal(firstValue(flattened, ['labores', 'laboresQuePuedeRealizar']), undefined);

  const volFlattened = volunteerForm({
    nombre: 'Natalia',
    datosPostulacion: { formulario: { comuna: 'Ñuñoa', transportePropio: 'Sí, vehículo 4x4 / camioneta' } }
  });
  assert.equal(firstValue(volFlattened, ['transportePropio']), 'Sí, vehículo 4x4 / camioneta');
  assert.ok(APPLICATION_FIELD_GROUPS.length >= 4);
});
