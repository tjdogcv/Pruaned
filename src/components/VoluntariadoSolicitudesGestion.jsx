import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Paperclip,
  Pencil,
  Save,
  X,
  XCircle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatChileanRut, isValidChileanRut } from '../lib/authData';
import {
  APPLICATION_FIELD_GROUPS,
  REGIONES_CHILE,
  VOLUNTEER_OPTIONS,
  applicationForm,
  displayValue,
  extractVolunteerDocuments,
  firstValue,
  hasFieldValue
} from '../lib/volunteerPresentation';
import { VolunteerDocumentsSection } from './VolunteerDocumentsSection';

const statusText = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada'
};

const statusBadgeClass = {
  pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  aprobada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rechazada: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelada: 'bg-slate-100 text-slate-600 border-slate-200'
};

const typeText = {
  ingreso: 'Nueva postulación',
  ascenso_socio: 'Solicitud para ser socio/a',
  derivada_socio: 'Derivada de postulación a socio'
};

const toArrayField = (val) => {
  if (Array.isArray(val)) return val.map((item) => String(item).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const buildDraftFromApplication = (application = {}) => {
  const form = applicationForm(application);
  const docs = extractVolunteerDocuments(form);
  return {
    nombreCompleto: firstValue(form, ['nombreCompleto', 'nombre'], ''),
    rut: firstValue(form, ['rut'], ''),
    fechaNacimiento: firstValue(form, ['fechaNacimiento'], ''),
    email: firstValue(form, ['email'], ''),
    telefono: firstValue(form, ['telefono'], ''),
    region: firstValue(form, ['region'], ''),
    comuna: firstValue(form, ['comuna'], ''),
    domicilio: firstValue(form, ['domicilio', 'direccion'], ''),
    redesSociales: firstValue(form, ['redesSociales', 'instagram'], ''),

    condicionAcademica: firstValue(form, ['condicionAcademica'], ''),
    profesionEspecialidad: firstValue(form, ['profesionEspecialidad', 'profesion', 'especialidad'], ''),
    institucionEstudios: firstValue(form, ['institucionEstudios', 'institucion'], ''),
    nivelEstudios: firstValue(form, ['nivelEstudios'], ''),
    formacionCertificada: toArrayField(firstValue(form, ['formacionCertificada'], [])),
    experiencia: firstValue(form, ['experiencia'], ''),

    certificadoAcademicoNombre: docs.academicCert?.nombre || '',
    certificadoAcademicoUrl: docs.academicCert?.url || '',
    enviaraCertificadoPorCorreo: docs.pendingByEmail,
    certificacionesExtras: docs.extraCerts,

    disponibilidad: firstValue(form, ['disponibilidad', 'tiempoDisponible'], ''),
    disponibilidadRespuesta: firstValue(form, ['disponibilidadRespuesta', 'disponibilidad_respuesta'], ''),
    transportePropio: firstValue(form, ['transportePropio', 'transporte_propio'], ''),
    desplazamientoTerritorial: firstValue(form, ['desplazamientoTerritorial', 'desplazamiento_territorial'], ''),
    labores: toArrayField(firstValue(form, ['labores', 'laboresQuePuedeRealizar', 'labores_que_puede_realizar'], [])),
    especiesComodas: toArrayField(firstValue(form, ['especiesComodas', 'especies_comodas'], [])),
    especiesEvitarRestricciones: firstValue(form, ['especiesEvitarRestricciones', 'especies_evitar_restricciones'], ''),
    areasInteres: toArrayField(firstValue(form, ['areasInteres', 'areas_interes'], [])),
    recursos: toArrayField(firstValue(form, ['recursos', 'recursosPropios', 'recursos_propios'], [])),

    motivacion: firstValue(form, ['motivacion', 'razonesIntegracion'], ''),
    proyeccionSocio: firstValue(form, ['proyeccionSocio', 'proyeccion_socio'], ''),
    antecedentes: firstValue(form, ['antecedentes'], ''),
    observacionRevision: firstValue(form, ['observacionRevision', 'reviewNote'], '')
  };
};

const editInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20';

function EditChipList({ label, options, selected = [], onToggle }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-bold text-slate-700">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                active
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              }`}
            >
              {active && <Check className="h-3 w-3 stroke-[3]" />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VoluntariadoSolicitudesGestion() {
  const {
    canManageVoluntarios,
    postulacionesVoluntariadoList = [],
    updatePostulacionVoluntariadoEstado,
    updatePostulacionVoluntariadoData,
    updateSolicitudIngresoSocioDesdeVoluntariado
  } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!canManageVoluntarios) return <Navigate to="/intranet/socios" replace />;

  const selected = useMemo(
    () => postulacionesVoluntariadoList.find((item) => item.id === selectedId) || null,
    [postulacionesVoluntariadoList, selectedId]
  );

  const pending = useMemo(
    () => postulacionesVoluntariadoList.filter((item) => item.estado === 'pendiente'),
    [postulacionesVoluntariadoList]
  );
  const history = useMemo(
    () => postulacionesVoluntariadoList.filter((item) => item.estado !== 'pendiente').slice(0, 12),
    [postulacionesVoluntariadoList]
  );

  const openApplication = (item) => {
    setSelectedId(item.id);
    setNote(item.observacionRevision || '');
    setError('');
  };

  const handleDecision = async (decision) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    const result = selected.tipo === 'ascenso_socio'
      ? await updateSolicitudIngresoSocioDesdeVoluntariado(selected.id, decision, 'Socio Activo', note)
      : await updatePostulacionVoluntariadoEstado(selected.id, decision, note);
    setSaving(false);
    if (!result.ok) return setError(result.error?.message || 'No se pudo registrar la decisión.');
    setSelectedId(null);
    setNote('');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Solicitudes de ingreso pendientes ({pending.length})</h2>
          <p className="text-xs text-slate-500">
            Revisa antecedentes, certificados y capacidades operativas; edita datos o adjunta archivos enviados por correo antes o después de decidir.
          </p>
        </div>
      </div>

      {!pending.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No hay solicitudes pendientes en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pending.map((item) => {
            const form = applicationForm(item);
            const docs = extractVolunteerDocuments(form);
            const region = firstValue(form, ['region'], '');
            const comuna = firstValue(form, ['comuna'], '');
            const profesion = firstValue(form, ['profesionEspecialidad', 'profesion', 'especialidad'], '');
            const disponibilidad = firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible'], '');
            const condicion = firstValue(form, ['condicionAcademica'], '');

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      {typeText[item.tipo] || 'Postulación'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CL') : ''}
                    </span>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-900">{item.nombreCompleto}</div>
                    <div className="text-xs text-slate-500">
                      {item.rut || 'Sin RUT'} · {item.email}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {profesion && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                        {condicion ? `${condicion} · ${profesion}` : profesion}
                      </span>
                    )}
                    {(comuna || region) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {[comuna, region].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {disponibilidad && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-semibold text-emerald-800">
                        {disponibilidad}
                      </span>
                    )}
                    {docs.totalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-semibold text-blue-800">
                        <FileText className="h-3 w-3" /> {docs.totalCount} documento{docs.totalCount > 1 ? 's' : ''}
                      </span>
                    ) : docs.pendingByEmail ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-semibold text-amber-800">
                        <Mail className="h-3 w-3" /> Cert. por correo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
                        Sin adjuntos
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openApplication(item)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Eye className="h-3.5 w-3.5" /> Revisar / editar ficha
                </button>
              </article>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-bold text-slate-700">
            Ver últimas decisiones ({history.length}) — haz clic en cualquiera para ver, editar o subir archivos
          </summary>
          <div className="mt-3 space-y-2">
            {history.map((item) => {
              const docs = extractVolunteerDocuments(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openApplication(item)}
                  className="w-full flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 px-3 py-2 text-left transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{item.nombreCompleto}</span>
                    <span className="text-slate-400">·</span>
                    <span>{typeText[item.tipo] || 'Postulación'}</span>
                    {docs.totalCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Paperclip className="h-2.5 w-2.5" /> {docs.totalCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                        statusBadgeClass[item.estado] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {statusText[item.estado] || item.estado}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 underline">Abrir</span>
                  </div>
                </button>
              );
            })}
          </div>
        </details>
      )}

      {selected && (
        <ApplicationReviewDialog
          application={selected}
          note={note}
          onNoteChange={setNote}
          saving={saving}
          error={error}
          onSaveData={updatePostulacionVoluntariadoData}
          onClose={() => {
            setSelectedId(null);
            setError('');
          }}
          onDecide={handleDecision}
        />
      )}
    </section>
  );
}

function ApplicationReviewDialog({
  application,
  note,
  onNoteChange,
  saving,
  error,
  onSaveData,
  onClose,
  onDecide
}) {
  const form = applicationForm(application);
  const docs = extractVolunteerDocuments(form);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildDraftFromApplication(application));
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const startEdit = () => {
    setDraft(buildDraftFromApplication(application));
    setEditError('');
    setEditSuccess('');
    setEditing(true);
  };

  const toggleDraftArray = (key, option) => {
    setDraft((previous) => {
      const current = Array.isArray(previous[key]) ? previous[key] : [];
      const exists = current.includes(option);
      const next = exists ? current.filter((item) => item !== option) : [...current, option];
      return { ...previous, [key]: next };
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!draft.nombreCompleto.trim()) return setEditError('El nombre completo no puede estar vacío.');
    if (draft.rut.trim() && !isValidChileanRut(draft.rut)) {
      return setEditError('El RUT ingresado no es válido.');
    }

    setEditSaving(true);
    setEditError('');
    setEditSuccess('');

    const payload = {
      ...draft,
      nombreCompleto: draft.nombreCompleto.trim(),
      rut: draft.rut.trim(),
      email: draft.email.trim().toLowerCase(),
      telefono: draft.telefono.trim(),
      comuna: draft.comuna.trim(),
      domicilio: draft.domicilio.trim(),
      redesSociales: draft.redesSociales.trim(),
      profesionEspecialidad: draft.profesionEspecialidad.trim(),
      institucionEstudios: draft.institucionEstudios.trim(),
      experiencia: draft.experiencia.trim(),
      especiesEvitarRestricciones: draft.especiesEvitarRestricciones.trim(),
      motivacion: draft.motivacion.trim(),
      antecedentes: draft.antecedentes.trim(),
      observacionRevision: draft.observacionRevision.trim()
    };

    const result = await onSaveData(application.id, payload);
    setEditSaving(false);

    if (!result.ok) {
      setEditError(result.error?.message || 'No se pudieron guardar los cambios en la ficha.');
      return;
    }

    if (payload.observacionRevision !== note) {
      onNoteChange(payload.observacionRevision);
    }
    setEditing(false);
    setEditSuccess('Ficha y documentos actualizados correctamente.');
  };

  const condicion = firstValue(form, ['condicionAcademica'], '');
  const disp = firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible'], '');
  const transporte = firstValue(form, ['transportePropio', 'transporte_propio'], '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {typeText[application.tipo] || 'Postulación'}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  statusBadgeClass[application.estado] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {statusText[application.estado] || application.estado}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900">{application.nombreCompleto}</h3>
            <p className="text-xs text-slate-500">
              {application.rut || 'Sin RUT'} · {application.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar ficha / adjuntar archivos
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="flex flex-wrap gap-2 text-xs">
          {condicion && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">{condicion}</span>
          )}
          {disp && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-semibold text-emerald-800">
              Activación: {disp}
            </span>
          )}
          {transporte && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{transporte}</span>
          )}
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-semibold text-blue-800">
            Adjuntos: {docs.totalCount}
          </span>
        </div>

        {editSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
            {editSuccess}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-xs text-emerald-900">
              Estás editando la ficha oficial de postulación. Puedes completar datos faltantes o adjuntar el Certificado de Alumno Regular, Certificado de Título y certificaciones enviadas por correo.
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Identificación y ubicación
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    required
                    value={draft.nombreCompleto}
                    onChange={(e) => setDraft((p) => ({ ...p, nombreCompleto: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">RUT</label>
                  <input
                    type="text"
                    value={draft.rut}
                    onChange={(e) => setDraft((p) => ({ ...p, rut: e.target.value }))}
                    onBlur={() => {
                      if (draft.rut.trim()) setDraft((p) => ({ ...p, rut: formatChileanRut(p.rut) }));
                    }}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de nacimiento</label>
                  <input
                    type="date"
                    value={draft.fechaNacimiento}
                    onChange={(e) => setDraft((p) => ({ ...p, fechaNacimiento: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={draft.telefono}
                    onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Región</label>
                  <select
                    value={draft.region}
                    onChange={(e) => setDraft((p) => ({ ...p, region: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Selecciona región</option>
                    {REGIONES_CHILE.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                    {draft.region && !REGIONES_CHILE.includes(draft.region) && (
                      <option value={draft.region}>{draft.region}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Comuna</label>
                  <input
                    type="text"
                    value={draft.comuna}
                    onChange={(e) => setDraft((p) => ({ ...p, comuna: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Domicilio / sector</label>
                  <input
                    type="text"
                    value={draft.domicilio}
                    onChange={(e) => setDraft((p) => ({ ...p, domicilio: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Formación y certificados (adjuntar documentos enviados por correo)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Condición académica</label>
                  <select
                    value={draft.condicionAcademica}
                    onChange={(e) => setDraft((p) => ({ ...p, condicionAcademica: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Sin especificar</option>
                    {VOLUNTEER_OPTIONS.condicionAcademica.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Profesión o especialidad</label>
                  <input
                    type="text"
                    value={draft.profesionEspecialidad}
                    onChange={(e) => setDraft((p) => ({ ...p, profesionEspecialidad: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Institución de estudios</label>
                  <input
                    type="text"
                    value={draft.institucionEstudios}
                    onChange={(e) => setDraft((p) => ({ ...p, institucionEstudios: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Redes sociales / LinkedIn</label>
                  <input
                    type="text"
                    value={draft.redesSociales}
                    onChange={(e) => setDraft((p) => ({ ...p, redesSociales: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
              </div>

              <VolunteerDocumentsSection
                editable
                compact
                allowDeferredByEmail
                condicionAcademica={draft.condicionAcademica}
                academicName={draft.certificadoAcademicoNombre}
                academicUrl={draft.certificadoAcademicoUrl}
                pendingByEmail={draft.enviaraCertificadoPorCorreo}
                extraCerts={draft.certificacionesExtras}
                onAcademicChange={({ nombre, url, pendingByEmail }) =>
                  setDraft((p) => ({
                    ...p,
                    certificadoAcademicoNombre: nombre,
                    certificadoAcademicoUrl: url,
                    enviaraCertificadoPorCorreo: pendingByEmail
                  }))
                }
                onPendingByEmailChange={(checked) =>
                  setDraft((p) => ({ ...p, enviaraCertificadoPorCorreo: checked }))
                }
                onAddExtraCert={(cert) =>
                  setDraft((p) => ({
                    ...p,
                    certificacionesExtras: [...(p.certificacionesExtras || []), cert]
                  }))
                }
                onRemoveExtraCert={(idOrIndex) =>
                  setDraft((p) => ({
                    ...p,
                    certificacionesExtras: (p.certificacionesExtras || []).filter(
                      (item, idx) => (item.id || idx) !== idOrIndex
                    )
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Capacidades operativas y disponibilidad
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Disponibilidad mensual</label>
                  <select
                    value={draft.disponibilidad}
                    onChange={(e) => setDraft((p) => ({ ...p, disponibilidad: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Sin especificar</option>
                    {VOLUNTEER_OPTIONS.disponibilidadMensual.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {draft.disponibilidad && !VOLUNTEER_OPTIONS.disponibilidadMensual.includes(draft.disponibilidad) && (
                      <option value={draft.disponibilidad}>{draft.disponibilidad}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Activación ante alerta</label>
                  <select
                    value={draft.disponibilidadRespuesta}
                    onChange={(e) => setDraft((p) => ({ ...p, disponibilidadRespuesta: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Sin especificar</option>
                    {VOLUNTEER_OPTIONS.disponibilidadRespuesta.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Transporte propio</label>
                  <select
                    value={draft.transportePropio}
                    onChange={(e) => setDraft((p) => ({ ...p, transportePropio: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Sin especificar</option>
                    {VOLUNTEER_OPTIONS.transportePropio.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alcance territorial</label>
                  <select
                    value={draft.desplazamientoTerritorial}
                    onChange={(e) => setDraft((p) => ({ ...p, desplazamientoTerritorial: e.target.value }))}
                    className={editInputClass}
                  >
                    <option value="">Sin especificar</option>
                    {VOLUNTEER_OPTIONS.desplazamientoTerritorial.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <EditChipList
                label="Labores operativas y de apoyo"
                options={VOLUNTEER_OPTIONS.labores}
                selected={draft.labores}
                onToggle={(opt) => toggleDraftArray('labores', opt)}
              />
              <EditChipList
                label="Especies con las que se siente cómodo/a"
                options={VOLUNTEER_OPTIONS.especiesComodas}
                selected={draft.especiesComodas}
                onToggle={(opt) => toggleDraftArray('especiesComodas', opt)}
              />
              <EditChipList
                label="Áreas de interés"
                options={VOLUNTEER_OPTIONS.areasInteres}
                selected={draft.areasInteres}
                onToggle={(opt) => toggleDraftArray('areasInteres', opt)}
              />
              <EditChipList
                label="Recursos propios"
                options={VOLUNTEER_OPTIONS.recursos}
                selected={draft.recursos}
                onToggle={(opt) => toggleDraftArray('recursos', opt)}
              />

              <div className="grid grid-cols-1 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Experiencia</label>
                  <textarea
                    rows={2}
                    value={draft.experiencia}
                    onChange={(e) => setDraft((p) => ({ ...p, experiencia: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivación</label>
                  <textarea
                    rows={2}
                    value={draft.motivacion}
                    onChange={(e) => setDraft((p) => ({ ...p, motivacion: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Restricciones o antecedentes relevantes
                  </label>
                  <input
                    type="text"
                    value={draft.especiesEvitarRestricciones}
                    onChange={(e) => setDraft((p) => ({ ...p, especiesEvitarRestricciones: e.target.value }))}
                    placeholder="Restricciones / alergias / especies a evitar"
                    className={editInputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Observación interna / de revisión</label>
                  <input
                    type="text"
                    value={draft.observacionRevision}
                    onChange={(e) => setDraft((p) => ({ ...p, observacionRevision: e.target.value }))}
                    className={editInputClass}
                  />
                </div>
              </div>
            </div>

            {editError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {editError}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar cambios en la ficha
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Documentos adjuntos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Documentos y certificados respaldados
                </h4>
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  + Subir documento enviado por correo
                </button>
              </div>
              <VolunteerDocumentsSection
                compact
                editable={false}
                condicionAcademica={condicion}
                academicName={docs.academicCert?.nombre || ''}
                academicUrl={docs.academicCert?.url || ''}
                pendingByEmail={docs.pendingByEmail}
                extraCerts={docs.extraCerts}
              />
            </div>

            {/* Grupos de campos */}
            <div className="space-y-4">
              {APPLICATION_FIELD_GROUPS.map((group) => {
                const visibleFields = group.fields.filter(([, keys, opts]) => {
                  const val = firstValue(form, keys);
                  if (opts?.optional && !hasFieldValue(val)) return false;
                  if (keys[0] === 'labores' && !hasFieldValue(val) && hasFieldValue(firstValue(form, ['areasInteres', 'areas_interes']))) {
                    return false;
                  }
                  return true;
                });
                if (!visibleFields.length) return null;

                return (
                  <div key={group.title} className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{group.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                      {visibleFields.map(([label, keys]) => {
                        const val = firstValue(form, keys);
                        const isLongText = keys.some((k) => ['experiencia', 'motivacion', 'antecedentes', 'labores'].includes(k));
                        return (
                          <div
                            key={label}
                            className={`rounded-xl bg-slate-50 px-3 py-2 ${isLongText ? 'sm:col-span-2' : ''}`}
                          >
                            <div className="text-[11px] font-semibold text-slate-500">{label}</div>
                            <div className="text-slate-900 text-xs font-medium break-words mt-0.5">
                              {displayValue(val)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {application.estado === 'pendiente' ? (
              <>
                <label className="block space-y-1.5 text-sm pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MessageSquareText className="h-4 w-4 text-slate-500" />
                    Observación para la persona (opcional)
                  </span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="Indica motivo si se rechaza, bienvenida si se aprueba o detalle para inducción..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </label>

                {error && <p className="text-sm text-rose-700">{error}</p>}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onDecide('rechazar')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onDecide('aprobar')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar e incorporar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Decisión registrada: <strong className="text-slate-800">{statusText[application.estado] || application.estado}</strong>
                  {application.observacionRevision ? ` — "${application.observacionRevision}"` : ''}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
