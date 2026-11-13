import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatChileanRut, isValidChileanRut } from '../lib/authData';
import {
  sendPostulacionVoluntarioEmail,
  sendVolunteerConfirmationEmail
} from '../lib/emailConfig';
import { REGIONES_CHILE, VOLUNTEER_OPTIONS } from '../lib/volunteerPresentation';
import { VolunteerDocumentsSection } from './VolunteerDocumentsSection';

const INITIAL_FORM = {
  // Bloque 1: Identificación y contacto
  nombreCompleto: '',
  rut: '',
  fechaNacimiento: '',
  email: '',
  telefono: '',
  region: '',
  comuna: '',
  domicilio: '',
  redesSociales: '',

  // Bloque 2: Formación, condición y certificados
  condicionAcademica: '',
  profesionEspecialidad: '',
  institucionEstudios: '',
  nivelEstudios: '',
  formacionCertificada: [],
  experiencia: '',
  certificadoAcademicoNombre: '',
  certificadoAcademicoUrl: '',
  enviaraCertificadoPorCorreo: false,
  certificacionesExtras: [],

  // Bloque 3: Capacidades operativas, disponibilidad y proyección
  disponibilidad: '',
  disponibilidadRespuesta: '',
  transportePropio: '',
  desplazamientoTerritorial: '',
  labores: [],
  especiesComodas: [],
  especiesEvitarRestricciones: '',
  areasInteres: [],
  recursos: [],
  motivacion: '',
  proyeccionSocio: VOLUNTEER_OPTIONS.proyeccionSocio[0],
  trabajoProtocolosSCI: false,
  respetoLimitesProfesionales: false,
  dispuestoCapacitarseLMS: false,
  aceptaTerminos: false
};

const STEPS = [
  { id: 1, title: 'Identificación y ubicación', subtitle: 'Datos personales y territorio', icon: UserCheck },
  { id: 2, title: 'Formación y certificados', subtitle: 'Perfil académico y respaldos', icon: GraduationCap },
  { id: 3, title: 'Capacidades y disponibilidad', subtitle: 'Operación, especies y compromiso', icon: ShieldCheck }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20';

function ToggleChipGroup({ label, hint, options, selected = [], onToggle, columns = 'sm:grid-cols-2' }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-bold text-slate-800">{label}</div>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className={`grid grid-cols-1 ${columns} gap-2`}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                active
                  ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <span className="leading-snug">{option}</span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? 'border-white/60 bg-white text-emerald-700' : 'border-slate-300 bg-slate-50'
                }`}
              >
                {active && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PostulacionVoluntariado() {
  const { addPostulacionVoluntario } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    if (error) setError('');
  };

  const toggleArrayValue = (fieldName, option) => {
    setForm((previous) => {
      const current = Array.isArray(previous[fieldName]) ? previous[fieldName] : [];
      const exists = current.includes(option);
      let next = exists ? current.filter((item) => item !== option) : [...current, option];

      if (fieldName === 'recursos' && !exists && option === 'Ninguno por ahora') {
        next = ['Ninguno por ahora'];
      } else if (fieldName === 'recursos' && !exists && option !== 'Ninguno por ahora') {
        next = next.filter((item) => item !== 'Ninguno por ahora');
      }

      return { ...previous, [fieldName]: next };
    });
    if (error) setError('');
  };

  const validateStep = (targetStep) => {
    if (targetStep === 1) {
      if (!form.nombreCompleto.trim()) return 'Ingresa tu nombre completo.';
      if (!form.rut.trim() || !isValidChileanRut(form.rut)) {
        return 'Ingresa un RUT chileno válido (ej: 17.673.849-9).';
      }
      if (!form.fechaNacimiento) return 'Ingresa tu fecha de nacimiento.';
      if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
        return 'Ingresa un correo electrónico válido.';
      }
      if (!form.telefono.trim()) return 'Ingresa un teléfono de contacto (idealmente WhatsApp).';
      if (!form.region) return 'Selecciona tu región de residencia.';
      if (!form.comuna.trim()) return 'Ingresa tu comuna.';
      return '';
    }

    if (targetStep === 2) {
      if (!form.condicionAcademica) return 'Selecciona tu condición académica o profesional actual.';
      if (!form.profesionEspecialidad.trim()) return 'Indica tu profesión, carrera o especialidad.';
      if (!form.certificadoAcademicoUrl && !form.enviaraCertificadoPorCorreo) {
        return 'Adjunta tu Certificado de Alumno Regular o Certificado de Título, o marca la opción de envío posterior por correo.';
      }
      return '';
    }

    if (targetStep === 3) {
      if (!form.disponibilidad) return 'Selecciona tu disponibilidad horaria mensual.';
      if (!form.disponibilidadRespuesta) return 'Selecciona tu tiempo estimado de activación ante emergencias.';
      if (!form.transportePropio) return 'Indica si cuentas con transporte propio.';
      if (!form.desplazamientoTerritorial) return 'Indica tu alcance máximo de desplazamiento territorial.';
      if (!form.labores.length) return 'Selecciona al menos una labor operativa o de apoyo.';
      if (!form.especiesComodas.length) return 'Indica al menos una categoría de especies o rol de apoyo con el que te sientas cómodo/a.';
      if (!form.motivacion.trim()) return 'Cuéntanos brevemente tu motivación para sumarte al voluntariado permanente.';
      if (!form.respetoLimitesProfesionales) {
        return 'Debes confirmar el compromiso de respeto a las competencias legales del ejercicio profesional.';
      }
      if (!form.dispuestoCapacitarseLMS) {
        return 'Debes confirmar tu disposición para completar la capacitación inicial en el Aula Virtual (LMS).';
      }
      if (!form.aceptaTerminos) {
        return 'Debes aceptar el reglamento de voluntariado y tratamiento de datos personales.';
      }
      return '';
    }

    return '';
  };

  const goToStep = (nextStep) => {
    if (nextStep > step) {
      const validationError = validateStep(step);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError('');
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateStep(1) || validateStep(2) || validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      ...form,
      nombreCompleto: form.nombreCompleto.trim(),
      rut: form.rut.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim(),
      comuna: form.comuna.trim(),
      domicilio: form.domicilio.trim(),
      redesSociales: form.redesSociales.trim(),
      profesionEspecialidad: form.profesionEspecialidad.trim(),
      institucionEstudios: form.institucionEstudios.trim(),
      experiencia: form.experiencia.trim(),
      especiesEvitarRestricciones: form.especiesEvitarRestricciones.trim(),
      motivacion: form.motivacion.trim()
    };

    const result = await addPostulacionVoluntario(payload);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error?.message || 'No se pudo registrar tu postulación.');
      return;
    }

    Promise.allSettled([
      sendPostulacionVoluntarioEmail(payload),
      sendVolunteerConfirmationEmail(payload)
    ]).catch(() => null);

    setSent(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sent) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-14 sm:py-16">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              Voluntariado Permanente PRUANED
            </span>
            <h1 className="text-2xl font-black text-slate-900">Postulación registrada correctamente</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gracias, <strong className="text-slate-900">{form.nombreCompleto}</strong>. Tu ficha ya ingresó a la Coordinación Nacional de Voluntariado de PRUANED A.G. y te enviamos un respaldo por correo.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900">Próximos pasos de tu recorrido</div>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>Coordinación evaluará tus antecedentes, formación y capacidades operativas en terreno o apoyo remoto.</li>
              {!form.certificadoAcademicoUrl && (
                <li>
                  Recuerda enviar tu certificado académico a{' '}
                  <a href="mailto:ag.pruaned@gmail.com" className="font-bold text-emerald-700 underline">
                    ag.pruaned@gmail.com
                  </a>{' '}
                  indicando tu nombre y RUT si marcaste envío posterior.
                </li>
              )}
              <li>De ser aprobada tu postulación, recibirás acceso al Aula Virtual (LMS) para tu inducción inicial y acreditación como voluntario/a permanente.</li>
              <li>Con tu experiencia activa y cumplimiento estatutario, en el futuro podrás proyectar tu ingreso como Socio/a Activo/a de PRUANED.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Volver al inicio
            </Link>
            <button
              type="button"
              onClick={() => {
                setForm(INITIAL_FORM);
                setStep(1);
                setSent(false);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Enviar otra postulación
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <HeartHandshake className="h-3.5 w-3.5" />
            Voluntariado Permanente PRUANED A.G.
          </div>
          <Link
            to="/postulacion-socio"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 underline underline-offset-4"
          >
            ¿Buscas postular directamente como Socio/a?
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Postulación a Voluntariado Permanente
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Buscamos estudiantes y profesionales comprometidos con la preparación, bienestar animal y respuesta organizada ante emergencias. Este equipo conforma la base operativa permanente de PRUANED y constituye el camino formativo para quienes a futuro deseen proyectarse como Socios/as Activos/as.
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Progreso del formulario" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {STEPS.map((item) => {
          const Icon = item.icon;
          const isCurrent = step === item.id;
          const isCompleted = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id < step) goToStep(item.id);
              }}
              disabled={item.id > step}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                isCurrent
                  ? 'border-emerald-700 bg-emerald-50/70 shadow-sm'
                  : isCompleted
                    ? 'border-emerald-200 bg-white hover:bg-emerald-50/40 cursor-pointer'
                    : 'border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed'
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isCurrent
                    ? 'bg-emerald-700 text-white'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Paso {item.id} de 3
                </div>
                <div className="text-xs font-extrabold text-slate-900 truncate">{item.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">1. Identificación, contacto y territorio</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Estos datos permiten ubicarte en las redes regionales de coordinación ante emergencias y validar tu identidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="vol-nombre" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nombre completo <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-nombre"
                  type="text"
                  required
                  value={form.nombreCompleto}
                  onChange={(e) => setField('nombreCompleto', e.target.value)}
                  placeholder="Nombre y dos apellidos"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-rut" className="block text-xs font-bold text-slate-800 mb-1.5">
                  RUT <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-rut"
                  type="text"
                  required
                  value={form.rut}
                  onChange={(e) => setField('rut', e.target.value)}
                  onBlur={() => {
                    if (form.rut.trim()) setField('rut', formatChileanRut(form.rut));
                  }}
                  placeholder="12.345.678-9"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-nacimiento" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Fecha de nacimiento <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-nacimiento"
                  type="date"
                  required
                  value={form.fechaNacimiento}
                  onChange={(e) => setField('fechaNacimiento', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-email" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Correo electrónico <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="tu.correo@ejemplo.cl"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-telefono" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Teléfono / WhatsApp <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-telefono"
                  type="tel"
                  required
                  value={form.telefono}
                  onChange={(e) => setField('telefono', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-region" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Región de residencia <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-region"
                  required
                  value={form.region}
                  onChange={(e) => setField('region', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona una región</option>
                  {REGIONES_CHILE.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vol-comuna" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Comuna <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-comuna"
                  type="text"
                  required
                  value={form.comuna}
                  onChange={(e) => setField('comuna', e.target.value)}
                  placeholder="Ej: Ñuñoa, Concepción, Valdivia..."
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-domicilio" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Sector o dirección referencial <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="vol-domicilio"
                  type="text"
                  value={form.domicilio}
                  onChange={(e) => setField('domicilio', e.target.value)}
                  placeholder="Solo para coordinación logística territorial"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-rrss" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Red profesional o LinkedIn <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="vol-rrss"
                  type="text"
                  value={form.redesSociales}
                  onChange={(e) => setField('redesSociales', e.target.value)}
                  placeholder="@usuario o enlace a perfil"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">2. Formación, condición académica y certificados</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cuéntanos cuál es tu formación actual y respalda tu condición con tu certificado correspondiente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vol-condicion" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Condición académica o profesional <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-condicion"
                  required
                  value={form.condicionAcademica}
                  onChange={(e) => setField('condicionAcademica', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona tu condición actual</option>
                  {VOLUNTEER_OPTIONS.condicionAcademica.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vol-profesion" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Profesión, carrera o especialidad <span className="text-rose-600">*</span>
                </label>
                <input
                  id="vol-profesion"
                  type="text"
                  required
                  value={form.profesionEspecialidad}
                  onChange={(e) => setField('profesionEspecialidad', e.target.value)}
                  placeholder="Ej: Médico/a Veterinario/a, Est. 4° año Med. Vet., Técnico Vet..."
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-institucion" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Universidad / Instituto <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="vol-institucion"
                  type="text"
                  value={form.institucionEstudios}
                  onChange={(e) => setField('institucionEstudios', e.target.value)}
                  placeholder="Nombre de tu casa de estudios"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vol-nivel" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nivel de estudios <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <select
                  id="vol-nivel"
                  value={form.nivelEstudios}
                  onChange={(e) => setField('nivelEstudios', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona un nivel</option>
                  <option value="Estudiante de pregrado / técnico">Estudiante de pregrado / técnico</option>
                  <option value="Egresado/a o titulado/a técnico">Egresado/a o titulado/a técnico</option>
                  <option value="Profesional universitario titulado/a">Profesional universitario titulado/a</option>
                  <option value="Postítulo / Diplomado / Especialidad">Postítulo / Diplomado / Especialidad</option>
                  <option value="Otro / apoyo operativo">Otro / apoyo operativo</option>
                </select>
              </div>
            </div>

            <ToggleChipGroup
              label="Formación o certificaciones complementarias que ya poseas (opcional)"
              hint="Marca las capacitaciones que hayas completado previamente."
              options={VOLUNTEER_OPTIONS.formacionCertificada}
              selected={form.formacionCertificada}
              onToggle={(opt) => toggleArrayValue('formacionCertificada', opt)}
            />

            <div>
              <label htmlFor="vol-experiencia" className="block text-xs font-bold text-slate-800 mb-1.5">
                Experiencia previa en clínica, terreno o voluntariados
              </label>
              <textarea
                id="vol-experiencia"
                rows={3}
                value={form.experiencia}
                onChange={(e) => setField('experiencia', e.target.value)}
                placeholder="Describe brevemente tu experiencia en terreno, clínicas, albergues, campañas sanitarias o emergencias previas..."
                className={inputClass}
              />
            </div>

            <VolunteerDocumentsSection
              editable
              showGuidance
              allowDeferredByEmail
              condicionAcademica={form.condicionAcademica}
              academicName={form.certificadoAcademicoNombre}
              academicUrl={form.certificadoAcademicoUrl}
              pendingByEmail={form.enviaraCertificadoPorCorreo}
              extraCerts={form.certificacionesExtras}
              onAcademicChange={({ nombre, url, pendingByEmail }) => {
                setForm((previous) => ({
                  ...previous,
                  certificadoAcademicoNombre: nombre,
                  certificadoAcademicoUrl: url,
                  enviaraCertificadoPorCorreo: pendingByEmail
                }));
                if (error) setError('');
              }}
              onPendingByEmailChange={(checked) => setField('enviaraCertificadoPorCorreo', checked)}
              onAddExtraCert={(cert) => {
                setForm((previous) => ({
                  ...previous,
                  certificacionesExtras: [...(previous.certificacionesExtras || []), cert]
                }));
              }}
              onRemoveExtraCert={(idOrIndex) => {
                setForm((previous) => ({
                  ...previous,
                  certificacionesExtras: (previous.certificacionesExtras || []).filter(
                    (item, idx) => (item.id || idx) !== idOrIndex
                  )
                }));
              }}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">3. Capacidades operativas, disponibilidad y proyección</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Necesitamos conocer cómo puedes aportar de manera segura, sostenible y coordinada dentro de la red.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vol-disp-mensual" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Disponibilidad horaria habitual <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-disp-mensual"
                  required
                  value={form.disponibilidad}
                  onChange={(e) => setField('disponibilidad', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona tu disponibilidad</option>
                  {VOLUNTEER_OPTIONS.disponibilidadMensual.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vol-disp-resp" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tiempo de activación ante emergencia <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-disp-resp"
                  required
                  value={form.disponibilidadRespuesta}
                  onChange={(e) => setField('disponibilidadRespuesta', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona capacidad de respuesta</option>
                  {VOLUNTEER_OPTIONS.disponibilidadRespuesta.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vol-transporte" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Movilidad / transporte propio <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-transporte"
                  required
                  value={form.transportePropio}
                  onChange={(e) => setField('transportePropio', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona una opción</option>
                  {VOLUNTEER_OPTIONS.transportePropio.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="vol-alcance" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Alcance de desplazamiento territorial <span className="text-rose-600">*</span>
                </label>
                <select
                  id="vol-alcance"
                  required
                  value={form.desplazamientoTerritorial}
                  onChange={(e) => setField('desplazamientoTerritorial', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona tu alcance</option>
                  {VOLUNTEER_OPTIONS.desplazamientoTerritorial.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ToggleChipGroup
              label="Labores en las que puedes aportar *"
              hint="Puedes combinar roles clínicos, logísticos, administrativos o de apoyo remoto según tu perfil."
              options={VOLUNTEER_OPTIONS.labores}
              selected={form.labores}
              onToggle={(opt) => toggleArrayValue('labores', opt)}
            />

            <ToggleChipGroup
              label="Especies con las que te sientes cómodo/a o habilitado/a *"
              hint="Esta información evita asignarte situaciones para las cuales no cuentas con experiencia o seguridad."
              options={VOLUNTEER_OPTIONS.especiesComodas}
              selected={form.especiesComodas}
              onToggle={(opt) => toggleArrayValue('especiesComodas', opt)}
            />

            <div>
              <label htmlFor="vol-restricciones" className="block text-xs font-bold text-slate-800 mb-1.5">
                Restricciones médicas, alergias o especies que prefieres evitar <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="vol-restricciones"
                type="text"
                value={form.especiesEvitarRestricciones}
                onChange={(e) => setField('especiesEvitarRestricciones', e.target.value)}
                placeholder="Ej: Alergia a equinos, lesión lumbar, prefiero labores sin exposición a fuego/humo..."
                className={inputClass}
              />
            </div>

            <ToggleChipGroup
              label="Áreas estratégicas de interés en PRUANED (opcional)"
              options={VOLUNTEER_OPTIONS.areasInteres}
              selected={form.areasInteres}
              onToggle={(opt) => toggleArrayValue('areasInteres', opt)}
              columns="sm:grid-cols-3"
            />

            <ToggleChipGroup
              label="Recursos propios o equipamiento que podrías aportar en operativos (opcional)"
              options={VOLUNTEER_OPTIONS.recursos}
              selected={form.recursos}
              onToggle={(opt) => toggleArrayValue('recursos', opt)}
              columns="sm:grid-cols-3"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="vol-motivacion" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Motivación para integrarte al Voluntariado Permanente <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="vol-motivacion"
                  rows={3}
                  required
                  value={form.motivacion}
                  onChange={(e) => setField('motivacion', e.target.value)}
                  placeholder="Cuéntanos por qué te motiva formar parte estable del equipo de PRUANED y qué esperas aportar..."
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  Proyección a largo plazo dentro de PRUANED A.G.
                </div>
                <label htmlFor="vol-proyeccion" className="block text-[11px] text-emerald-900">
                  Los voluntarios permanentes activos que completan su formación y trayectoria pueden postular más adelante para convertirse en Socios/as Activos/as. ¿Cuál es tu interés actual?
                </label>
                <select
                  id="vol-proyeccion"
                  value={form.proyeccionSocio}
                  onChange={(e) => setField('proyeccionSocio', e.target.value)}
                  className={inputClass}
                >
                  {VOLUNTEER_OPTIONS.proyeccionSocio.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-extrabold text-slate-900">
                <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                Compromisos operativos, éticos y de capacitación
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.trabajoProtocolosSCI}
                  onChange={(e) => setField('trabajoProtocolosSCI', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  Comprendo y acepto trabajar bajo cadena de mando institucional y lineamientos del Sistema de Comando de Incidentes (SCI) durante activaciones y terreno.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.respetoLimitesProfesionales}
                  onChange={(e) => setField('respetoLimitesProfesionales', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  <strong className="text-slate-900">Respeto estricto de competencias legales *:</strong> me comprometo a desempeñar únicamente tareas acordes a mi formación acreditada y supervisión asignada (sin ejercer actos médico-veterinarios exclusivos si soy estudiante o personal de apoyo).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dispuestoCapacitarseLMS}
                  onChange={(e) => setField('dispuestoCapacitarseLMS', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  <strong className="text-slate-900">Compromiso formativo en Aula Virtual (LMS) *:</strong> me comprometo a cursar la inducción y capacitaciones obligatorias antes de ser acreditado/a para despliegues.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.aceptaTerminos}
                  onChange={(e) => setField('aceptaTerminos', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  <strong className="text-slate-900">Declaración de veracidad y privacidad *:</strong> declaro que los datos y documentos entregados son fidedignos y autorizo a PRUANED A.G. a utilizarlos para evaluación, registro y coordinación operativa conforme a sus reglamentos internos.
                </span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Award className="h-4 w-4 text-emerald-700" /> Voluntariado permanente con ruta formativa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 shadow-sm"
              >
                Continuar al paso {step + 1} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 shadow-sm"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar postulación
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
