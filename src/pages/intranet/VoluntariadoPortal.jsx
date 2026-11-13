import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { VolunteerDocumentsSection } from '../../components/VolunteerDocumentsSection';
import { useAuth } from '../../context/AuthContext';
import {
  VOLUNTEER_OPTIONS,
  extractVolunteerDocuments,
  firstValue,
  formatDate,
  volunteerForm
} from '../../lib/volunteerPresentation';

const statusLabels = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada'
};

const statusStyles = {
  pendiente: 'bg-amber-50 text-amber-800 border border-amber-200',
  aprobada: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  rechazada: 'bg-rose-50 text-rose-700 border border-rose-200',
  cancelada: 'bg-slate-100 text-slate-600 border border-slate-200'
};

const toArrayField = (val) => {
  if (Array.isArray(val)) return val.map((item) => String(item).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    return val.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const selectCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20';

function ChipToggle({ label, options, selected = [], onToggle }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-bold text-slate-800">{label}</div>
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

export default function VoluntariadoPortal() {
  const {
    currentUser,
    voluntariosList = [],
    postulacionesVoluntariadoList = [],
    updateVoluntarioData,
    solicitarIngresoSocioDesdeVoluntariado
  } = useAuth();

  const volunteer = voluntariosList.find(
    (item) => item.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  const form = useMemo(() => volunteerForm(volunteer || {}), [volunteer]);
  const docs = useMemo(() => extractVolunteerDocuments(form), [form]);

  // Self-service operational availability & documents draft
  const [availabilityDraft, setAvailabilityDraft] = useState({
    telefono: '',
    comuna: '',
    disponibilidad: '',
    disponibilidadRespuesta: '',
    transportePropio: '',
    desplazamientoTerritorial: '',
    especiesEvitarRestricciones: '',
    recursos: [],
    labores: []
  });
  const [availabilityStatus, setAvailabilityStatus] = useState({ state: 'idle', message: '' });

  // Promotion request draft
  const [motivacion, setMotivacion] = useState('');
  const [antecedentes, setAntecedentes] = useState('');
  const [promoDocs, setPromoDocs] = useState({
    condicionAcademica: '',
    profesionEspecialidad: '',
    certificadoAcademicoNombre: '',
    certificadoAcademicoUrl: '',
    enviaraCertificadoPorCorreo: false,
    certificacionesExtras: []
  });
  const [requestState, setRequestState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    if (!volunteer) return;
    setAvailabilityDraft({
      telefono: firstValue(form, ['telefono'], volunteer.telefono || ''),
      comuna: firstValue(form, ['comuna'], ''),
      disponibilidad: firstValue(form, ['disponibilidad', 'tiempoDisponible'], ''),
      disponibilidadRespuesta: firstValue(form, ['disponibilidadRespuesta', 'disponibilidad_respuesta'], ''),
      transportePropio: firstValue(form, ['transportePropio', 'transporte_propio'], ''),
      desplazamientoTerritorial: firstValue(form, ['desplazamientoTerritorial', 'desplazamiento_territorial'], ''),
      especiesEvitarRestricciones: firstValue(form, ['especiesEvitarRestricciones', 'especies_evitar_restricciones'], ''),
      recursos: toArrayField(firstValue(form, ['recursos', 'recursosPropios', 'recursos_propios'], [])),
      labores: toArrayField(firstValue(form, ['labores', 'laboresQuePuedeRealizar', 'labores_que_puede_realizar'], []))
    });
    setPromoDocs({
      condicionAcademica: firstValue(form, ['condicionAcademica'], ''),
      profesionEspecialidad: firstValue(form, ['profesionEspecialidad', 'profesion', 'especialidad'], ''),
      certificadoAcademicoNombre: docs.academicCert?.nombre || '',
      certificadoAcademicoUrl: docs.academicCert?.url || '',
      enviaraCertificadoPorCorreo: docs.pendingByEmail,
      certificacionesExtras: docs.extraCerts
    });
  }, [volunteer?.id, form, docs]);

  const myRequests = useMemo(
    () =>
      postulacionesVoluntariadoList.filter(
        (item) =>
          item.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
          (volunteer?.id && item.voluntarioId === volunteer.id)
      ),
    [postulacionesVoluntariadoList, currentUser?.email, volunteer?.id]
  );

  const membershipRequest = myRequests.find(
    (item) => item.tipo === 'ascenso_socio' && item.estado === 'pendiente'
  );

  const toggleDraftArray = (field, option) => {
    setAvailabilityDraft((previous) => {
      const current = Array.isArray(previous[field]) ? previous[field] : [];
      const exists = current.includes(option);
      let next = exists ? current.filter((item) => item !== option) : [...current, option];
      if (field === 'recursos' && !exists && option === 'Ninguno por ahora') {
        next = ['Ninguno por ahora'];
      } else if (field === 'recursos' && !exists && option !== 'Ninguno por ahora') {
        next = next.filter((item) => item !== 'Ninguno por ahora');
      }
      return { ...previous, [field]: next };
    });
  };

  const handleSaveAvailability = async (event) => {
    event.preventDefault();
    if (!volunteer || !updateVoluntarioData) return;

    setAvailabilityStatus({ state: 'saving', message: '' });
    const result = await updateVoluntarioData(volunteer.id, availabilityDraft);
    if (!result?.ok) {
      setAvailabilityStatus({
        state: 'error',
        message: result?.error?.message || 'No se pudo actualizar tu disponibilidad en este momento.'
      });
      return;
    }
    setAvailabilityStatus({
      state: 'success',
      message: 'Tu disponibilidad, movilidad y recursos quedaron actualizados para Coordinación.'
    });
  };

  const handleSyncDocsToProfile = async (nextDocsPayload) => {
    if (!volunteer || !updateVoluntarioData) return;
    await updateVoluntarioData(volunteer.id, nextDocsPayload);
  };

  const submitMembership = async (event) => {
    event.preventDefault();
    setRequestState({ status: 'loading', message: '' });

    const payload = {
      motivacion: motivacion.trim(),
      antecedentes: antecedentes.trim(),
      condicionAcademica: promoDocs.condicionAcademica,
      profesionEspecialidad: promoDocs.profesionEspecialidad.trim(),
      certificadoAcademicoNombre: promoDocs.certificadoAcademicoNombre,
      certificadoAcademicoUrl: promoDocs.certificadoAcademicoUrl,
      enviaraCertificadoPorCorreo: promoDocs.enviaraCertificadoPorCorreo,
      certificacionesExtras: promoDocs.certificacionesExtras
    };

    const result = await solicitarIngresoSocioDesdeVoluntariado(payload);
    if (result?.ok) {
      setRequestState({
        status: 'success',
        message: 'Tu solicitud y respaldo documental fueron enviados al Directorio para su revisión.'
      });
      setMotivacion('');
      setAntecedentes('');
      return;
    }

    setRequestState({
      status: 'error',
      message: result?.error?.message || 'No pudimos registrar la solicitud. Inténtalo nuevamente.'
    });
  };

  const updatedAtLabel = formatDate(volunteer?.ultimaActualizacionDisponibilidad);

  return (
    <section className="space-y-7 font-['Plus_Jakarta_Sans'] text-slate-900">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> Voluntariado Permanente PRUANED
          </span>
          <h2 className="mt-4 font-['Outfit'] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hola, {currentUser?.name?.split(' ')[0] || 'voluntario/a'}.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Este es tu espacio operativo y formativo permanente en PRUANED: mantén actualizada tu disponibilidad, accede al Aula Virtual y proyecta tu crecimiento dentro de la organización.
          </p>
        </div>
      </header>

      {volunteer ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Info
            icon={UserRoundCheck}
            label="Estado de incorporación"
            value={volunteer.estado === 'inactivo' ? 'Inactivo' : 'Voluntario/a activo/a'}
            tone={volunteer.estado === 'inactivo' ? 'slate' : 'emerald'}
          />
          <Info icon={GraduationCap} label="Acreditación" value={volunteer.nivelAcreditacion || 'En proceso'} />
          <Info
            icon={Clock3}
            label="Activación / disponibilidad"
            value={
              firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible']) ||
              volunteer.disponibilidadRespuesta ||
              'Por actualizar'
            }
          />
        </div>
      ) : (
        <div role="status" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <Clock3 className="mt-0.5 h-5 w-5 flex-none text-amber-700" aria-hidden="true" />
          <p>
            Tu incorporación aún está en revisión. Cuando sea aprobada, se habilitarán tu ficha operativa viva, tu actualización de disponibilidad y el Aula Virtual.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-['Outfit'] text-xl font-extrabold">Aula virtual y acreditación</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Revisa contenidos, completa módulos obligatorios y mantén tu preparación vigente para operativos y despliegues.
              </p>
            </div>
          </div>
          <Link
            to="/intranet/voluntarios/aula"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Ir al aula virtual
          </Link>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 flex-none text-emerald-700 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-['Outfit'] text-xl font-extrabold">Mis certificados y respaldos</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Si obtuviste tu título o completaste nuevos cursos, súbelos aquí para actualizar tu ficha permanente.
              </p>
            </div>
          </div>
          {volunteer ? (
            <VolunteerDocumentsSection
              compact
              editable
              allowDeferredByEmail
              condicionAcademica={firstValue(form, ['condicionAcademica'], '')}
              academicName={docs.academicCert?.nombre || ''}
              academicUrl={docs.academicCert?.url || ''}
              pendingByEmail={docs.pendingByEmail}
              extraCerts={docs.extraCerts}
              onAcademicChange={({ nombre, url, pendingByEmail }) =>
                handleSyncDocsToProfile({
                  certificadoAcademicoNombre: nombre,
                  certificadoAcademicoUrl: url,
                  enviaraCertificadoPorCorreo: pendingByEmail
                })
              }
              onPendingByEmailChange={(checked) =>
                handleSyncDocsToProfile({ enviaraCertificadoPorCorreo: checked })
              }
              onAddExtraCert={(cert) =>
                handleSyncDocsToProfile({
                  certificacionesExtras: [...docs.extraCerts, cert]
                })
              }
              onRemoveExtraCert={(idOrIndex) =>
                handleSyncDocsToProfile({
                  certificacionesExtras: docs.extraCerts.filter((item, idx) => (item.id || idx) !== idOrIndex)
                })
              }
            />
          ) : (
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              Disponible una vez aprobada tu incorporación al voluntariado.
            </p>
          )}
        </article>
      </div>

      {/* Autogestión de disponibilidad y recursos */}
      {volunteer && (
        <section
          aria-labelledby="availability-title"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shrink-0">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Operatividad territorial</p>
                <h3 id="availability-title" className="font-['Outfit'] text-xl font-extrabold text-slate-950">
                  Mi disponibilidad y recursos para emergencias
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Coordinación utiliza esta ficha en tiempo real para convocar equipos según ubicación, movilidad y capacidades.
                </p>
              </div>
            </div>
            {updatedAtLabel && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                Última actualización: {updatedAtLabel}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveAvailability} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={availabilityDraft.telefono}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, telefono: e.target.value }))}
                  className={selectCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comuna actual</label>
                <input
                  type="text"
                  value={availabilityDraft.comuna}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, comuna: e.target.value }))}
                  className={selectCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disponibilidad habitual</label>
                <select
                  value={availabilityDraft.disponibilidad}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, disponibilidad: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Selecciona disponibilidad</option>
                  {VOLUNTEER_OPTIONS.disponibilidadMensual.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activación ante alerta</label>
                <select
                  value={availabilityDraft.disponibilidadRespuesta}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, disponibilidadRespuesta: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Selecciona tiempo de activación</option>
                  {VOLUNTEER_OPTIONS.disponibilidadRespuesta.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transporte propio</label>
                <select
                  value={availabilityDraft.transportePropio}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, transportePropio: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Selecciona movilidad</option>
                  {VOLUNTEER_OPTIONS.transportePropio.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alcance territorial</label>
                <select
                  value={availabilityDraft.desplazamientoTerritorial}
                  onChange={(e) => setAvailabilityDraft((p) => ({ ...p, desplazamientoTerritorial: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">Selecciona alcance</option>
                  {VOLUNTEER_OPTIONS.desplazamientoTerritorial.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ChipToggle
              label="Labores en las que puedo apoyar"
              options={VOLUNTEER_OPTIONS.labores}
              selected={availabilityDraft.labores}
              onToggle={(opt) => toggleDraftArray('labores', opt)}
            />

            <ChipToggle
              label="Recursos propios disponibles"
              options={VOLUNTEER_OPTIONS.recursos}
              selected={availabilityDraft.recursos}
              onToggle={(opt) => toggleDraftArray('recursos', opt)}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restricciones médicas o consideraciones importantes <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={availabilityDraft.especiesEvitarRestricciones}
                onChange={(e) =>
                  setAvailabilityDraft((p) => ({ ...p, especiesEvitarRestricciones: e.target.value }))
                }
                placeholder="Alergias, lesiones temporales u observaciones para despliegues..."
                className={selectCls}
              />
            </div>

            {availabilityStatus.state !== 'idle' && availabilityStatus.state !== 'saving' && (
              <div
                role={availabilityStatus.state === 'error' ? 'alert' : 'status'}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
                  availabilityStatus.state === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {availabilityStatus.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={availabilityStatus.state === 'saving'}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {availabilityStatus.state === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar disponibilidad operativa
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Seguimiento de solicitudes */}
      <section aria-labelledby="requests-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Seguimiento</p>
            <h3 id="requests-title" className="mt-1 font-['Outfit'] text-xl font-extrabold">
              Mis solicitudes
            </h3>
          </div>
        </div>
        {myRequests.length ? (
          <div className="mt-5 divide-y divide-slate-100">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {request.tipo === 'ascenso_socio'
                      ? 'Solicitud para ser socio/a'
                      : request.tipo === 'derivada_socio'
                        ? 'Incorporación derivada de postulación a socio'
                        : 'Postulación de voluntariado'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Enviada {request.createdAt ? new Date(request.createdAt).toLocaleDateString('es-CL') : 'recientemente'}
                    {request.observacionRevision ? ` · ${request.observacionRevision}` : ''}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                    statusStyles[request.estado] || statusStyles.pendiente
                  }`}
                >
                  {statusLabels[request.estado] || request.estado}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No hay solicitudes registradas para esta cuenta.
          </p>
        )}
      </section>

      {/* Proyección a Socio/a PRUANED */}
      {volunteer && (
        <section aria-labelledby="membership-title" className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> Trayectoria en PRUANED
            </p>
            <h3 id="membership-title" className="mt-1 font-['Outfit'] text-xl font-extrabold">
              ¿Quieres proyectarte para postular como Socio/a?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Tu historial, formación LMS y experiencia como voluntario/a permanente respaldan esta solicitud. La ficha viva y tus documentos actuales se enviarán al Directorio para su evaluación; seguirás siendo voluntario/a mientras se resuelve.
            </p>
          </div>

          {membershipRequest ? (
            <p
              role="status"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Ya tienes una solicitud de ingreso a Socio/a en revisión.
            </p>
          ) : (
            <form onSubmit={submitMembership} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Actualización académica / título (si ya egresaste o obtuviste nuevas certificaciones)
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Condición actual</label>
                    <select
                      value={promoDocs.condicionAcademica}
                      onChange={(e) => setPromoDocs((p) => ({ ...p, condicionAcademica: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Selecciona condición actual</option>
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
                      value={promoDocs.profesionEspecialidad}
                      onChange={(e) => setPromoDocs((p) => ({ ...p, profesionEspecialidad: e.target.value }))}
                      className={selectCls}
                    />
                  </div>
                </div>

                <VolunteerDocumentsSection
                  compact
                  editable
                  allowDeferredByEmail={false}
                  condicionAcademica={promoDocs.condicionAcademica}
                  academicName={promoDocs.certificadoAcademicoNombre}
                  academicUrl={promoDocs.certificadoAcademicoUrl}
                  pendingByEmail={promoDocs.enviaraCertificadoPorCorreo}
                  extraCerts={promoDocs.certificacionesExtras}
                  onAcademicChange={({ nombre, url }) =>
                    setPromoDocs((p) => ({
                      ...p,
                      certificadoAcademicoNombre: nombre,
                      certificadoAcademicoUrl: url,
                      enviaraCertificadoPorCorreo: false
                    }))
                  }
                  onAddExtraCert={(cert) =>
                    setPromoDocs((p) => ({
                      ...p,
                      certificacionesExtras: [...(p.certificacionesExtras || []), cert]
                    }))
                  }
                  onRemoveExtraCert={(idOrIndex) =>
                    setPromoDocs((p) => ({
                      ...p,
                      certificacionesExtras: (p.certificacionesExtras || []).filter(
                        (item, idx) => (item.id || idx) !== idOrIndex
                      )
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="text-sm font-bold text-slate-800">
                  Motivación
                  <textarea
                    required
                    value={motivacion}
                    onChange={(event) => setMotivacion(event.target.value)}
                    rows="4"
                    placeholder="Por qué deseas integrarte como Socio/a Activo/a de PRUANED..."
                    className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white p-3 text-sm font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="text-sm font-bold text-slate-800">
                  Antecedentes o aportes relevantes <span className="font-normal text-slate-500">(opcional)</span>
                  <textarea
                    value={antecedentes}
                    onChange={(event) => setAntecedentes(event.target.value)}
                    rows="4"
                    placeholder="Participaciones en emergencias, comisiones o capacitaciones recientes..."
                    className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white p-3 text-sm font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div>
                {requestState.status !== 'idle' && (
                  <p
                    role={requestState.status === 'error' ? 'alert' : 'status'}
                    className={`mb-3 inline-flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                      requestState.status === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {requestState.status === 'success' && <CheckCircle2 className="h-4 w-4" />}
                    {requestState.message}
                  </p>
                )}
                <div>
                  <button
                    type="submit"
                    disabled={requestState.status === 'loading'}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-extrabold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {requestState.status === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                    {requestState.status === 'loading' ? 'Enviando…' : 'Solicitar evaluación del Directorio'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}
    </section>
  );
}

function Info({ icon: Icon, label, value, tone = 'blue' }) {
  const colors = tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className={`h-5 w-5 ${colors.split(' ')[1]}`} aria-hidden="true" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-['Outfit'] text-lg font-extrabold text-slate-950">{value}</p>
    </article>
  );
}
