import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Filter,
  GraduationCap,
  Loader2,
  Paperclip,
  Search,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ModalCambioEmail } from '../../components/ModalCambioEmail';
import { VoluntariadoSolicitudesGestion } from '../../components/VoluntariadoSolicitudesGestion';
import { VolunteerProfileDialog } from '../../components/VolunteerProfileDialog';
import { useAuth } from '../../context/AuthContext';
import { courseProgress } from '../../lib/lmsProgress';
import {
  REGIONES_CHILE,
  VOLUNTEER_OPTIONS,
  extractVolunteerDocuments,
  firstValue,
  volunteerForm
} from '../../lib/volunteerPresentation';

function rate(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

const matchesCaseInsensitive = (haystack, needle) =>
  String(haystack || '').toLowerCase().includes(String(needle || '').toLowerCase());

export default function VoluntariadoGestion() {
  const {
    canManageVoluntarios,
    isLmsManager,
    isMasterUser,
    isDirectiva,
    voluntariosList = [],
    updateVoluntarioData,
    lmsCourses = [],
    lmsParticipants = [],
    lmsResults = [],
    lmsModuleProgress = [],
    isLmsLoading
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [transportFilter, setTransportFilter] = useState('');
  const [capabilityFilter, setCapabilityFilter] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [cambioEmailVolunteer, setCambioEmailVolunteer] = useState(null);

  const publishedCourses = useMemo(
    () => lmsCourses.filter((course) => course.status === 'published'),
    [lmsCourses]
  );

  const volunteers = useMemo(() => {
    const participantsByEmail = new Map(
      lmsParticipants.map((participant) => [participant.email?.toLowerCase(), participant])
    );
    return voluntariosList.map((volunteer) => {
      const participant = participantsByEmail.get(volunteer.email?.toLowerCase());
      return {
        ...volunteer,
        id: volunteer.id,
        userId: participant?.userId || null,
        nombre: participant?.displayName || volunteer.nombre,
        email: volunteer.email,
        especialidad: volunteer.especialidad,
        nivelAcreditacion: volunteer.nivelAcreditacion,
        hasAccount: Boolean(participant)
      };
    });
  }, [lmsParticipants, voluntariosList]);

  const courseMetrics = useMemo(() => {
    const volunteerUserIds = new Set(volunteers.map((volunteer) => volunteer.userId).filter(Boolean));
    return publishedCourses.map((course) => {
      const courseResults = lmsResults.filter(
        (result) => result.courseId === course.id && volunteerUserIds.has(result.userId)
      );
      const approved = courseResults.filter((result) => result.status === 'aprobado').length;
      const failed = courseResults.filter((result) => result.status === 'reprobado').length;
      const inProgress = courseResults.filter((result) => result.status === 'en_progreso').length;
      const scores = courseResults.map((result) => Number(result.score)).filter(Number.isFinite);
      const averageScore = scores.length
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : null;
      return { course, approved, failed, inProgress, averageScore };
    });
  }, [lmsResults, publishedCourses, volunteers]);

  const rows = useMemo(() => volunteers.map((volunteer) => {
    const participantResults = lmsResults.filter((result) => result.userId === volunteer.userId);
    const participantProgress = lmsModuleProgress.filter((progress) => progress.userId === volunteer.userId);
    const totalModules = publishedCourses.reduce((total, course) => total + course.modules.length, 0);
    const completedModules = publishedCourses.reduce(
      (total, course) => total + courseProgress(course, participantProgress).completed,
      0
    );
    const approved = participantResults.filter((result) => result.status === 'aprobado').length;
    const form = volunteerForm(volunteer);
    const docs = extractVolunteerDocuments(form);
    const disponibilidad = firstValue(form, ['disponibilidadRespuesta', 'disponibilidad', 'tiempoDisponible'], '');
    const transporte = firstValue(form, ['transportePropio', 'transporte_propio'], '');
    const region = firstValue(form, ['region'], volunteer.region || '');
    const comuna = firstValue(form, ['comuna'], '');
    const condicion = firstValue(form, ['condicionAcademica'], '');
    const laboresText = Array.isArray(form.labores)
      ? form.labores.join(' ')
      : String(firstValue(form, ['laboresQuePuedeRealizar', 'labores_que_puede_realizar', 'areasInteres'], ''));
    const especiesText = Array.isArray(form.especiesComodas) ? form.especiesComodas.join(' ') : '';

    return {
      ...volunteer,
      approved,
      totalModules,
      completedModules,
      percentage: rate(completedModules, totalModules),
      _meta: {
        docs,
        disponibilidad,
        transporte,
        region,
        comuna,
        condicion,
        laboresText,
        especiesText
      }
    };
  }), [lmsModuleProgress, lmsResults, publishedCourses, volunteers]);

  const selectedVolunteer = useMemo(
    () => rows.find((item) => item.id === selectedVolunteerId) || null,
    [rows, selectedVolunteerId]
  );

  const filteredRows = rows.filter((volunteer) => {
    const query = searchTerm.trim().toLowerCase();
    const { region, comuna, disponibilidad, transporte, laboresText, especiesText, condicion } = volunteer._meta;

    const matchesQuery = !query || [
      volunteer.nombre,
      volunteer.rut,
      volunteer.email,
      volunteer.especialidad,
      volunteer.nivelAcreditacion,
      region,
      comuna,
      condicion,
      laboresText,
      especiesText
    ].some((value) => String(value || '').toLowerCase().includes(query));

    if (!matchesQuery) return false;
    if (regionFilter && !matchesCaseInsensitive(region, regionFilter)) return false;
    if (availabilityFilter && !matchesCaseInsensitive(disponibilidad, availabilityFilter)) return false;
    if (transportFilter === 'con_vehiculo' && (!transporte || transporte.toLowerCase().startsWith('no '))) return false;
    if (transportFilter === '4x4' && !matchesCaseInsensitive(transporte, '4x4')) return false;
    if (transportFilter === 'sin_vehiculo' && transporte && !transporte.toLowerCase().startsWith('no ')) return false;
    if (capabilityFilter && !matchesCaseInsensitive(`${laboresText} ${especiesText}`, capabilityFilter)) return false;
    return true;
  });

  if (!canManageVoluntarios) return <Navigate to="/intranet/socios" replace />;

  const hasActiveFilters = Boolean(
    searchTerm.trim() || regionFilter || availabilityFilter || transportFilter || capabilityFilter
  );

  const totalApproved = courseMetrics.reduce((total, metric) => total + metric.approved, 0);
  const totalPossible = volunteers.length * publishedCourses.length;

  return (
    <section className="min-h-screen bg-slate-50 py-2 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Coordinación operativa</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Gestión de voluntariado permanente
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Revisión de postulaciones, fichas vivas con documentación de respaldo, filtros operativos de despliegue y avance en el Aula Virtual.
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {isLmsManager && (
              <Link
                to="/intranet/voluntarios/gestion/aula"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Administrar aula virtual
              </Link>
            )}
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">Buscar voluntario</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, RUT, comuna, labor..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric icon={Users} value={volunteers.length} label="Voluntarios registrados" />
          <Metric icon={GraduationCap} value={totalApproved} label="Aprobaciones vigentes" />
          <Metric icon={TrendingUp} value={`${rate(totalApproved, totalPossible)}%`} label="Aprobación agregada" />
        </div>

        <VoluntariadoSolicitudesGestion />

        <section aria-labelledby="course-metrics-title" className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h3 id="course-metrics-title" className="font-['Outfit'] text-lg font-extrabold">Indicadores por curso</h3>
            {isLmsLoading && <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />}
          </div>
          {courseMetrics.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courseMetrics.map(({ course, approved, failed, inProgress, averageScore }) => (
                <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold text-emerald-700">{course.code || 'Curso'}</p>
                  <h4 className="mt-2 font-['Outfit'] font-extrabold text-slate-950">{course.title}</h4>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <MetricDetail label="Aprobados" value={approved} className="text-emerald-700" />
                    <MetricDetail label="En progreso" value={inProgress} />
                    <MetricDetail
                      label="Reprobados"
                      value={course.hasEvaluation ? failed : 'No aplica'}
                      className={course.hasEvaluation ? 'text-rose-700' : ''}
                    />
                    <MetricDetail
                      label="Nota promedio"
                      value={
                        averageScore === null
                          ? (course.hasEvaluation ? 'Sin intentos' : 'No aplica')
                          : `${averageScore.toFixed(1)}%`
                      }
                    />
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
              No hay cursos publicados. El contenido archivado no forma parte de estos indicadores.
            </p>
          )}
        </section>

        <section
          aria-labelledby="volunteer-list-title"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 id="volunteer-list-title" className="font-['Outfit'] text-lg font-extrabold">
                  Padrón operativo y avance individual
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  Mostrando <strong className="text-slate-900">{filteredRows.length}</strong> de {rows.length}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setRegionFilter('');
                      setAvailabilityFilter('');
                      setTransportFilter('');
                      setCapabilityFilter('');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Filtros operativos para activación territorial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <label className="block">
                <span className="sr-only">Filtrar por región</span>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  >
                    <option value="">Todas las regiones</option>
                    {REGIONES_CHILE.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Filtrar por disponibilidad ante emergencia</span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  <option value="">Cualquier activación / disponibilidad</option>
                  {VOLUNTEER_OPTIONS.disponibilidadRespuesta.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Filtrar por transporte</span>
                <select
                  value={transportFilter}
                  onChange={(e) => setTransportFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  <option value="">Cualquier movilidad</option>
                  <option value="con_vehiculo">Con vehículo propio</option>
                  <option value="4x4">Vehículo 4x4 / camioneta</option>
                  <option value="sin_vehiculo">Sin vehículo propio</option>
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Filtrar por labor o especie</span>
                <select
                  value={capabilityFilter}
                  onChange={(e) => setCapabilityFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  <option value="">Cualquier labor o especie</option>
                  <optgroup label="Labores operativas">
                    {VOLUNTEER_OPTIONS.labores.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Especies">
                    {VOLUNTEER_OPTIONS.especiesComodas.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Voluntario y operatividad</th>
                  <th className="px-5 py-3 font-bold">Acceso</th>
                  <th className="px-5 py-3 font-bold">Acreditación</th>
                  <th className="px-5 py-3 font-bold">Cursos aprobados</th>
                  <th className="px-5 py-3 font-bold">Módulos</th>
                  <th className="px-5 py-3 font-bold">Avance</th>
                  <th className="px-5 py-3 font-bold"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!filteredRows.length ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-500">
                      No se encontraron voluntarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((volunteer) => {
                    const { docs, region, comuna, disponibilidad } = volunteer._meta;
                    return (
                      <tr key={volunteer.id}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-950">{volunteer.nombre}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {volunteer.email}
                            {volunteer.rut ? ` · ${volunteer.rut}` : ''}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                            {(comuna || region) && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                {[comuna, region].filter(Boolean).join(', ')}
                              </span>
                            )}
                            {disponibilidad && (
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-medium text-emerald-800">
                                {disponibilidad}
                              </span>
                            )}
                            {docs.totalCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                <Paperclip className="h-2.5 w-2.5" /> {docs.totalCount} adj.
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              volunteer.hasAccount ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {volunteer.hasAccount ? 'Cuenta activa' : 'Activación pendiente'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {volunteer.nivelAcreditacion || 'Sin nivel registrado'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            {volunteer.approved}/{publishedCourses.length}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {volunteer.completedModules}/{volunteer.totalModules}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-36 items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${volunteer.percentage}%` }} />
                            </div>
                            <span className="font-bold text-slate-700">{volunteer.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(isMasterUser || isDirectiva) && (
                              <button
                                type="button"
                                onClick={() => setCambioEmailVolunteer(volunteer)}
                                className="min-h-10 rounded-xl border border-amber-300 bg-amber-50 px-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
                                title="Cambiar correo de acceso"
                              >
                                Cambiar Correo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedVolunteerId(volunteer.id)}
                              className="min-h-10 rounded-xl border border-emerald-700 px-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                            >
                              Ver ficha
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <VolunteerProfileDialog
          volunteer={selectedVolunteer}
          hasAccount={selectedVolunteer?.hasAccount}
          onClose={() => setSelectedVolunteerId(null)}
          onUpdateVolunteer={updateVoluntarioData}
          onCambiarEmail={
            isMasterUser || isDirectiva
              ? (vol) => setCambioEmailVolunteer(vol)
              : null
          }
        />

        {cambioEmailVolunteer && (
          <ModalCambioEmail
            miembro={cambioEmailVolunteer}
            tipo="voluntario"
            onClose={() => setCambioEmailVolunteer(null)}
            onSuccess={() => {
              setCambioEmailVolunteer(null);
            }}
          />
        )}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, value, label }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="mb-3 h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}

function MetricDetail({ label, value, className = '' }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 font-bold text-slate-900 ${className}`}>{value}</dd>
    </div>
  );
}
