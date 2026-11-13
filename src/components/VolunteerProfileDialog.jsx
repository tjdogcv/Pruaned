import { useEffect, useState } from 'react';
import {
  Check,
  KeyRound,
  Loader2,
  MailCheck,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Truck,
  UserRound,
  X
} from 'lucide-react';
import { formatChileanRut, isValidChileanRut } from '../lib/authData';
import {
  APPLICATION_FIELD_GROUPS,
  REGIONES_CHILE,
  VOLUNTEER_OPTIONS,
  accessStatus,
  displayValue,
  extractVolunteerDocuments,
  firstValue,
  formatDate,
  hasFieldValue,
  volunteerForm
} from '../lib/volunteerPresentation';
import { VolunteerDocumentsSection } from './VolunteerDocumentsSection';

const toneClasses = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  slate: 'border-slate-200 bg-slate-50 text-slate-800'
};

const toArrayField = (val) => {
  if (Array.isArray(val)) return val.map((item) => String(item).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const buildDraftFromVolunteer = (volunteer = {}) => {
  const form = volunteerForm(volunteer);
  const docs = extractVolunteerDocuments(form);
  return {
    nombreCompleto: firstValue(form, ['nombreCompleto', 'nombre'], ''),
    rut: firstValue(form, ['rut'], ''),
    fechaNacimiento: firstValue(form, ['fechaNacimiento'], ''),
    telefono: firstValue(form, ['telefono'], ''),
    region: firstValue(form, ['region'], ''),
    comuna: firstValue(form, ['comuna'], ''),
    domicilio: firstValue(form, ['domicilio', 'direccion'], ''),
    redesSociales: firstValue(form, ['redesSociales', 'instagram'], ''),

    estado: volunteer.estado || 'activo',
    nivelAcreditacion: volunteer.nivelAcreditacion || 'Voluntario Base',

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
    proyeccionSocio: firstValue(form, ['proyeccionSocio', 'proyeccion_socio'], ''),
    motivacion: firstValue(form, ['motivacion', 'razonesIntegracion'], ''),
    antecedentes: firstValue(form, ['antecedentes'], '')
  };
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20';

function EditChips({ label, options, selected = [], onToggle }) {
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

export function VolunteerProfileDialog({ volunteer, hasAccount, onClose, onCambiarEmail, onUpdateVolunteer }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildDraftFromVolunteer(volunteer || {}));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setEditing(false);
    setSaveError('');
    setSaveSuccess('');
    if (volunteer) {
      setDraft(buildDraftFromVolunteer(volunteer));
    }
  }, [volunteer?.id]);

  if (!volunteer) return null;

  const form = volunteerForm(volunteer);
  const docs = extractVolunteerDocuments(form);
  const access = accessStatus(volunteer, hasAccount);
  const inviteDate = formatDate(access.sentAt);
  const expiryDate = formatDate(access.expiresAt);
  const hasApplicationData = Boolean(
    volunteer.datosPostulacion?.formulario || volunteer.datos_postulacion?.formulario
  );

  const toggleDraftArray = (key, option) => {
    setDraft((previous) => {
      const current = Array.isArray(previous[key]) ? previous[key] : [];
      const exists = current.includes(option);
      return {
        ...previous,
        [key]: exists ? current.filter((item) => item !== option) : [...current, option]
      };
    });
  };

  const handleStartEdit = () => {
    setDraft(buildDraftFromVolunteer(volunteer));
    setSaveError('');
    setSaveSuccess('');
    setEditing(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!onUpdateVolunteer) return;
    if (!draft.nombreCompleto.trim()) {
      return setSaveError('El nombre completo no puede estar vacío.');
    }
    if (draft.rut.trim() && !isValidChileanRut(draft.rut)) {
      return setSaveError('El RUT ingresado no es válido.');
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const payload = {
      ...draft,
      nombreCompleto: draft.nombreCompleto.trim(),
      rut: draft.rut.trim(),
      telefono: draft.telefono.trim(),
      comuna: draft.comuna.trim(),
      domicilio: draft.domicilio.trim(),
      redesSociales: draft.redesSociales.trim(),
      profesionEspecialidad: draft.profesionEspecialidad.trim(),
      institucionEstudios: draft.institucionEstudios.trim(),
      experiencia: draft.experiencia.trim(),
      especiesEvitarRestricciones: draft.especiesEvitarRestricciones.trim(),
      motivacion: draft.motivacion.trim(),
      antecedentes: draft.antecedentes.trim()
    };

    const result = await onUpdateVolunteer(volunteer.id, payload);
    setSaving(false);

    if (!result?.ok) {
      setSaveError(result?.error?.message || 'No se pudieron guardar los cambios del voluntario.');
      return;
    }

    setEditing(false);
    setSaveSuccess('Ficha de voluntario y documentos actualizados correctamente.');
  };

  const regionLabel = [
    firstValue(form, ['comuna'], ''),
    firstValue(form, ['region'], volunteer.region)
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="volunteer-record-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Ficha viva del voluntariado permanente
            </p>
            <h3 id="volunteer-record-title" className="mt-1 font-['Outfit'] text-2xl font-extrabold text-slate-950">
              {firstValue(form, ['nombreCompleto', 'nombre'], volunteer.email)}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{firstValue(form, ['rut'], volunteer.rut) || 'Sin RUT'}</span>
              <span>·</span>
              <span>{volunteer.email || 'Correo no informado'}</span>
              {onCambiarEmail && (
                <button
                  type="button"
                  onClick={() => onCambiarEmail(volunteer)}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                  title="Cambiar correo de acceso"
                >
                  <KeyRound className="h-3 w-3 text-amber-700" /> Cambiar Correo
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onUpdateVolunteer && !editing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar ficha / adjuntar archivos
              </button>
            )}
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClasses[access.tone]}`}>
              {access.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar ficha"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RecordItem
            icon={UserRound}
            label="Estado y acreditación"
            value={`${volunteer.estadoOperativo || volunteer.estado || 'activo'} · ${volunteer.nivelAcreditacion || 'Voluntario Base'}`}
          />
          <RecordItem icon={MapPin} label="Territorio" value={regionLabel || 'No informado'} />
          <RecordItem
            icon={MailCheck}
            label="Activación / disponibilidad"
            value={firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible'])}
          />
          <RecordItem
            icon={Truck}
            label="Movilidad y acceso LMS"
            value={`${firstValue(form, ['transportePropio', 'transporte_propio'], 'Sin transporte informado')} · ${inviteDate ? `Invitado ${inviteDate}` : access.detail}${expiryDate ? ` (vence ${expiryDate})` : ''}`}
          />
        </div>

        {saveSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            {saveSuccess}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-xs text-emerald-900">
              Actualiza datos personales, nivel de acreditación, disponibilidad operativa o adjunta documentos recibidos por correo electrónico.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={draft.nombreCompleto}
                  onChange={(e) => setDraft((p) => ({ ...p, nombreCompleto: e.target.value }))}
                  className={inputCls}
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
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={draft.fechaNacimiento}
                  onChange={(e) => setDraft((p) => ({ ...p, fechaNacimiento: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado operativo</label>
                <select
                  value={draft.estado}
                  onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))}
                  className={inputCls}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nivel de acreditación</label>
                <select
                  value={draft.nivelAcreditacion}
                  onChange={(e) => setDraft((p) => ({ ...p, nivelAcreditacion: e.target.value }))}
                  className={inputCls}
                >
                  <option value="Voluntario Base">Voluntario Base</option>
                  <option value="En formación LMS">En formación LMS</option>
                  <option value="Voluntario Capacitado">Voluntario Capacitado</option>
                  <option value="Voluntario Líder / Terreno">Voluntario Líder / Terreno</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={draft.telefono}
                  onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Región</label>
                <select
                  value={draft.region}
                  onChange={(e) => setDraft((p) => ({ ...p, region: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecciona región</option>
                  {REGIONES_CHILE.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
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
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Domicilio / sector</label>
                <input
                  type="text"
                  value={draft.domicilio}
                  onChange={(e) => setDraft((p) => ({ ...p, domicilio: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Condición académica</label>
                <select
                  value={draft.condicionAcademica}
                  onChange={(e) => setDraft((p) => ({ ...p, condicionAcademica: e.target.value }))}
                  className={inputCls}
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
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Institución</label>
                <input
                  type="text"
                  value={draft.institucionEstudios}
                  onChange={(e) => setDraft((p) => ({ ...p, institucionEstudios: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Documentos y certificaciones respaldadas
              </h4>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Disponibilidad mensual</label>
                <select
                  value={draft.disponibilidad}
                  onChange={(e) => setDraft((p) => ({ ...p, disponibilidad: e.target.value }))}
                  className={inputCls}
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
                  className={inputCls}
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
                  className={inputCls}
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
                  className={inputCls}
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

            <EditChips
              label="Labores operativas y de apoyo"
              options={VOLUNTEER_OPTIONS.labores}
              selected={draft.labores}
              onToggle={(opt) => toggleDraftArray('labores', opt)}
            />
            <EditChips
              label="Especies con las que trabaja cómodo/a"
              options={VOLUNTEER_OPTIONS.especiesComodas}
              selected={draft.especiesComodas}
              onToggle={(opt) => toggleDraftArray('especiesComodas', opt)}
            />
            <EditChips
              label="Recursos propios"
              options={VOLUNTEER_OPTIONS.recursos}
              selected={draft.recursos}
              onToggle={(opt) => toggleDraftArray('recursos', opt)}
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Proyección futura a Socio/a PRUANED</label>
              <select
                value={draft.proyeccionSocio}
                onChange={(e) => setDraft((p) => ({ ...p, proyeccionSocio: e.target.value }))}
                className={inputCls}
              >
                <option value="">Sin especificar</option>
                {VOLUNTEER_OPTIONS.proyeccionSocio.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {saveError}
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
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar ficha del voluntario
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Certificados y documentación acreditada
                </h4>
                {onUpdateVolunteer && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Adjuntar / actualizar documentos
                  </button>
                )}
              </div>
              <VolunteerDocumentsSection
                compact
                editable={false}
                condicionAcademica={firstValue(form, ['condicionAcademica'], '')}
                academicName={docs.academicCert?.nombre || ''}
                academicUrl={docs.academicCert?.url || ''}
                pendingByEmail={docs.pendingByEmail}
                extraCerts={docs.extraCerts}
              />
            </div>

            {!hasApplicationData && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Este voluntario fue registrado antes de incorporar el historial detallado de ficha. Puedes completarla haciendo clic en «Editar ficha / adjuntar archivos».
              </p>
            )}

            <div className="space-y-5">
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
                  <section key={group.title} className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      {group.title}
                    </h4>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {visibleFields.map(([label, keys]) => {
                        const value = firstValue(form, keys);
                        const isWide = keys.some((k) => ['experiencia', 'motivacion', 'antecedentes', 'labores'].includes(k));
                        return (
                          <div
                            key={label}
                            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 ${
                              isWide ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <dt className="text-xs font-bold text-slate-500">{label}</dt>
                            <dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">
                              {displayValue(value)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecordItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <Icon className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-900 break-words">{value || 'No informado'}</p>
    </div>
  );
}
