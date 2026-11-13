import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, ExternalLink, Scale, ShieldCheck, 
  ArrowLeft, ArrowRight, Send, AlertCircle, FileText, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
import { sendPostulacionEmail } from '../lib/emailConfig';
import { createAntiSpamSession, validateSubmission } from '../lib/antiSpam';

const OPTIONS = {
  formacionCertificada: [
    'Manejo animal', 
    'Rescate técnico animal', 
    'Primeros auxilios humanos', 
    'Primeros auxilios veterinarios', 
    'Gestión del riesgo / emergencias', 
    'Otra'
  ],
  tiempoDisponible: [
    'Menos de 4 horas', 
    '4–8 horas', 
    '8–12 horas', 
    'Más de 12 horas'
  ],
  areasParticipacion: [
    'Capacitaciones', 
    'Actividades comunitarias', 
    'Activación en emergencias', 
    'Apoyo administrativo', 
    'Difusión y comunicaciones', 
    'Otra'
  ],
  habilidadesEquipo: [
    'Comunicación clara', 
    'Empatía y escucha activa', 
    'Liderazgo', 
    'Resolución de conflictos', 
    'Trabajo bajo presión', 
    'Organización y planificación', 
    'Adaptabilidad', 
    'Otra'
  ],
  manejoEstres: [
    'Mantengo la calma', 
    'Necesito estabilizarme primero', 
    'Prefiero tareas estructuradas', 
    'Prefiero evitar situaciones de alta presión', 
    'A veces me bloqueo', 
    'Otra'
  ],
  comodidadProcedimientos: [
    'Completamente cómodo/a', 
    'Cómodo/a con apoyo', 
    'Prefiero roles sin protocolos estrictos'
  ],
  rolesEmergencia: [
    'Operativo terreno', 
    'Logística', 
    'Coordinación', 
    'Apoyo técnico', 
    'Comunicaciones', 
    'Bienestar animal / registro', 
    'Evaluación rápida', 
    'Otro'
  ],
  interesesRecuperacion: [
    'Seguimiento de animales atendidos', 
    'Gestión de donaciones', 
    'Evaluación de daños y pérdidas', 
    'Apoyo psicosocial comunitario básico', 
    'Registros y bases de datos', 
    'No me interesa esta fase'
  ],
  rolesNoOperativos: [
    'Registro y bases de datos', 
    'Logística sin desplazamiento', 
    'Difusión/comunicaciones', 
    'Gestión administrativa', 
    'Apoyo comunitario local'
  ],
  animalesComodos: [
    'Perros', 
    'Gatos', 
    'Animales de granja', 
    'Equinos', 
    'Fauna silvestre', 
    'Aves', 
    'Sin preferencia', 
    'Prefiero evitar ciertas especies'
  ],
  reaccionConflictos: [
    'Busco mediar', 
    'Prefiero seguir indicaciones', 
    'Prefiero evitar conflictos', 
    'Puedo gestionarlos si es necesario', 
    'Otro'
  ],
  conocimientoNormativo: [
    'Ley 21.020', 
    'Protocolos SAG', 
    'Normas SENAPRED', 
    'Reglamentos municipales', 
    'No tengo conocimiento'
  ],
  funcionesSinAnimales: [
    'Logística', 
    'Centro de acopio', 
    'Comunicaciones oficiales', 
    'Registro de fichas', 
    'Coordinación administrativa', 
    'No me siento cómodo/a'
  ],
  comodidadFamilias: [
    'Muy cómodo/a', 
    'Con apoyo', 
    'Prefiero roles técnicos', 
    'Prefiero evitar interacción directa'
  ],
  accionCritica: [
    'Mantengo la calma y aporto soluciones', 
    'Necesito orientación', 
    'Prefiero instrucciones claras', 
    'Prefiero roles sin presión'
  ]
};

const initialFormData = {
  // Sección 1
  aceptaEstatutos: '',

  // Sección 2
  nombreCompleto: '',
  rut: '',
  fechaNacimiento: '',
  domicilio: '',
  comuna: '',
  telefono: '',
  email: '',
  redesSociales: '',
  profesion: '',
  nivelEstudios: '',
  experienciaPrevia: '',
  formacionCertificada: [],
  razonesIntegracion: '',
  aporteEsperado: '',
  haParticipadoOrgs: '',
  tiempoDisponible: '',
  areasParticipacion: [],
  experienciasComplejas: '',
  descripcionExperiencias: '',
  necesitaApoyoBienestar: '',
  tipoApoyoUtil: '',
  cartaIntencion: '',
  cartaIntencionArchivo: null,
  declaracionVeracidad: '',
  autorizacionDatos: '',
  aceptaLeyDatos: '',

  // Sección 3 (Orden exacto Google Forms)
  habilidadesEquipo: [],
  manejoEstres: '',
  participacionDiagnosticoRiesgo: '',
  descripcionDiagnosticoRiesgo: '',
  experienciaAmenazas: '',
  descripcionAmenazas: '',
  participacionPlanes: '',
  tipoPlan: '',
  comodidadProcedimientos: '',
  participacionSimulacros: '',
  rolSimulacros: '',
  trabajoSCI: '',
  rolSCI: '',
  rolesEmergencia: [],
  experienciaRecuperacion: '',
  descripcionRecuperacion: '',
  interesesRecuperacion: [],
  transportePropio: '',
  desplazamientoFueraComuna: '',
  rolesNoOperativos: [],
  animalesComodos: [],
  especiesEvitar: '',
  liderazgoEquipos: '',
  experienciaLiderazgo: '',
  reaccionConflictos: '',
  trabajoInstituciones: '',
  institucionesContexto: '',
  manejoProtocolos: '',
  conocimientoNormativo: [],
  dispuestoCapacitarse: '',
  experienciaRegistros: '',
  funcionesSinAnimales: [],
  trabajoComunidadesRurales: '',
  experienciaComunidades: '',
  comodidadFamilias: '',
  accionCritica: '',
  bienestarAnimalEmergencias: '',
  trabajoEticoDesastres: '',
  limitesProfesionales: '',
  areaValorPRUANED: ''
};

// Componente para una tarjeta de pregunta estilo Google Forms
const QuestionCard = ({ label, required = false, error, children, description }) => (
  <div className={`bg-white rounded-2xl border transition-all p-6 sm:p-7 shadow-sm ${
    error ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
  }`}>
    <div className="mb-4">
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
        {label}
        {required && <span className="text-rose-500 font-bold ml-1" title="Esta pregunta es obligatoria">*</span>}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      )}
    </div>

    {children}

    {error && (
      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-fade-in">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Esta pregunta es obligatoria</span>
      </div>
    )}
  </div>
);

// Componente para Radio vertical (estilo Google Forms)
const RadioGroup = ({ name, options, value, onChange }) => (
  <div className="space-y-1">
    {options.map((opt) => {
      const isChecked = value === opt;
      return (
        <label
          key={opt}
          className="flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer hover:bg-slate-50 transition group"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={isChecked}
              onChange={() => onChange(name, opt)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isChecked ? 'border-indigo-600 bg-white' : 'border-slate-400 group-hover:border-slate-600 bg-white'
            }`}>
              {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
            </div>
          </div>
          <span className={`text-sm select-none ${isChecked ? 'text-slate-950 font-medium' : 'text-slate-700'}`}>
            {opt}
          </span>
        </label>
      );
    })}
  </div>
);

// Componente para Checkbox vertical (estilo Google Forms)
const CheckboxGroup = ({ name, options, value = [], onChange }) => (
  <div className="space-y-1">
    {options.map((opt) => {
      const isChecked = Array.isArray(value) && value.includes(opt);
      return (
        <label
          key={opt}
          className="flex items-center gap-3.5 py-2.5 px-2 rounded-xl cursor-pointer hover:bg-slate-50 transition group"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              name={name}
              value={opt}
              checked={isChecked}
              onChange={(e) => onChange(name, opt, e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              isChecked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400 group-hover:border-slate-600 bg-white'
            }`}>
              {isChecked && (
                <svg className="w-3.5 h-3.5 text-white stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className={`text-sm select-none ${isChecked ? 'text-slate-950 font-medium' : 'text-slate-700'}`}>
            {opt}
          </span>
        </label>
      );
    })}
  </div>
);

// Componente de Texto Corto (Línea o input limpio Google Forms)
const ShortTextInput = ({ name, value, onChange, placeholder = "Tu respuesta", type = "text" }) => (
  <div className="pt-1">
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm text-slate-900 border-b-2 border-slate-300 hover:border-slate-400 focus:border-indigo-600 pb-2 pt-1 bg-transparent outline-none transition-colors placeholder:text-slate-400"
    />
  </div>
);

// Componente de Texto Largo (Google Forms "Texto de respuesta largo")
const LongTextArea = ({ name, value, onChange, placeholder = "Texto de respuesta largo", rows = 3 }) => (
  <div className="pt-1">
    <textarea
      rows={rows}
      value={value || ''}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm text-slate-900 border border-slate-300 rounded-xl p-3 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 leading-relaxed resize-y"
    />
  </div>
);

export const PostulacionSocio = () => {
  const { addPostulacion } = useAuth();
  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [antiSpamSession, setAntiSpamSession] = useState(createAntiSpamSession);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection, formSubmitted]);

  const updateField = (name, value, isChecked) => {
    setFormData((current) => {
      if (typeof isChecked === 'boolean') {
        const currentArr = Array.isArray(current[name]) ? current[name] : [];
        const nextArr = isChecked 
          ? [...currentArr, value] 
          : currentArr.filter((item) => item !== value);
        return { ...current, [name]: nextArr };
      }
      return { ...current, [name]: value };
    });

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const openEstatutos = () => window.open('/Estatutos-v-3.pdf', '_blank', 'noopener,noreferrer');

  // Validaciones por sección
  const validateSection = (sectionNumber) => {
    const errors = {};

    if (sectionNumber === 1) {
      if (!formData.aceptaEstatutos) {
        errors.aceptaEstatutos = true;
      }
    } else if (sectionNumber === 2) {
      const requiredInputs = [
        'nombreCompleto', 'rut', 'fechaNacimiento', 'domicilio', 'comuna',
        'telefono', 'email', 'profesion', 'experienciaPrevia',
        'razonesIntegracion', 'aporteEsperado', 'haParticipadoOrgs',
        'tiempoDisponible', 'experienciasComplejas', 'necesitaApoyoBienestar',
        'cartaIntencion', 'declaracionVeracidad', 'autorizacionDatos'
      ];

      requiredInputs.forEach((field) => {
        if (!formData[field] || !formData[field].toString().trim()) {
          errors[field] = true;
        }
      });

      if (!formData.formacionCertificada?.length) {
        errors.formacionCertificada = true;
      }
      if (!formData.areasParticipacion?.length) {
        errors.areasParticipacion = true;
      }

      if (formData.experienciasComplejas === 'Sí' && !formData.descripcionExperiencias?.trim()) {
        errors.descripcionExperiencias = true;
      }

      if (formData.necesitaApoyoBienestar === 'Sí' && !formData.tipoApoyoUtil?.trim()) {
        errors.tipoApoyoUtil = true;
      }

      if (formData.aceptaLeyDatos !== 'Sí, acepto') {
        errors.aceptaLeyDatos = true;
      }

    } else if (sectionNumber === 3) {
      if (!formData.habilidadesEquipo?.length) errors.habilidadesEquipo = true;
      if (!formData.manejoEstres) errors.manejoEstres = true;
      if (!formData.participacionDiagnosticoRiesgo) errors.participacionDiagnosticoRiesgo = true;
      if (!formData.experienciaAmenazas) errors.experienciaAmenazas = true;
      if (!formData.participacionPlanes) errors.participacionPlanes = true;
      if (formData.participacionPlanes === 'Sí' && !formData.tipoPlan?.trim()) errors.tipoPlan = true;
      if (!formData.comodidadProcedimientos) errors.comodidadProcedimientos = true;
      if (!formData.participacionSimulacros) errors.participacionSimulacros = true;
      if (!formData.trabajoSCI) errors.trabajoSCI = true;
      if (formData.trabajoSCI === 'Sí' && !formData.rolSCI?.trim()) errors.rolSCI = true;
      if (!formData.rolesEmergencia?.length) errors.rolesEmergencia = true;
      if (!formData.experienciaRecuperacion) errors.experienciaRecuperacion = true;
      if (!formData.interesesRecuperacion?.length) errors.interesesRecuperacion = true;
      if (!formData.transportePropio) errors.transportePropio = true;
      if (!formData.desplazamientoFueraComuna) errors.desplazamientoFueraComuna = true;
      if (!formData.rolesNoOperativos?.length) errors.rolesNoOperativos = true;
      if (!formData.animalesComodos?.length) errors.animalesComodos = true;
      if (!formData.liderazgoEquipos) errors.liderazgoEquipos = true;
      if (formData.liderazgoEquipos === 'Sí' && !formData.experienciaLiderazgo?.trim()) errors.experienciaLiderazgo = true;
      if (!formData.reaccionConflictos) errors.reaccionConflictos = true;
      if (!formData.trabajoInstituciones) errors.trabajoInstituciones = true;
      if (formData.trabajoInstituciones === 'Sí' && !formData.institucionesContexto?.trim()) errors.institucionesContexto = true;
      if (!formData.manejoProtocolos) errors.manejoProtocolos = true;
      if (!formData.conocimientoNormativo?.length) errors.conocimientoNormativo = true;
      if (!formData.dispuestoCapacitarse) errors.dispuestoCapacitarse = true;
      if (!formData.experienciaRegistros) errors.experienciaRegistros = true;
      if (!formData.funcionesSinAnimales?.length) errors.funcionesSinAnimales = true;
      if (!formData.trabajoComunidadesRurales) errors.trabajoComunidadesRurales = true;
      if (formData.trabajoComunidadesRurales === 'Sí' && !formData.experienciaComunidades?.trim()) errors.experienciaComunidades = true;
      if (!formData.comodidadFamilias) errors.comodidadFamilias = true;
      if (!formData.accionCritica) errors.accionCritica = true;
      if (!formData.bienestarAnimalEmergencias?.trim()) errors.bienestarAnimalEmergencias = true;
      if (!formData.trabajoEticoDesastres?.trim()) errors.trabajoEticoDesastres = true;
      if (!formData.limitesProfesionales?.trim()) errors.limitesProfesionales = true;
      if (!formData.areaValorPRUANED?.trim()) errors.areaValorPRUANED = true;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 1));
  };

  const handleClearForm = () => {
    if (window.confirm('¿Seguro/a que deseas borrar todas las respuestas del formulario?')) {
      setFormData(initialFormData);
      setFormErrors({});
      setCurrentSection(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateSection(3)) {
      return;
    }

    const spamCheck = validateSubmission(antiSpamSession);
    if (!spamCheck.valid) {
      alert(spamCheck.error || 'Envío bloqueado por motivos de seguridad.');
      return;
    }

    if (formData.aceptaEstatutos !== 'Sí, acepto') {
      alert('Debe aceptar los estatutos para continuar con la postulación.');
      return;
    }

    if (formData.declaracionVeracidad !== 'Sí') {
      alert('Debe declarar que la información entregada es verídica.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { cartaIntencionArchivo, ...formularioCompleto } = formData;
      const postulacionFinal = {
        ...formData,
        formularioCompleto,
        respuestasTecnicas: formularioCompleto,
        id: `POST-${Date.now().toString().slice(-6)}`,
        fechaEnvio: new Date().toISOString().split('T')[0],
        estado: 'Pendiente Revisión Directorio',
        cartaIntencionNombre: cartaIntencionArchivo?.name || 'Texto de carta de intención proporcionado'
      };

      const result = await addPostulacion(postulacionFinal);
      if (!result?.ok) {
        alert(result?.error?.message || 'No fue posible registrar la postulación.');
        setIsSubmitting(false);
        return;
      }

      sendPostulacionEmail(postulacionFinal);
      setFormSubmitted(true);
    } catch (err) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de confirmación (Estilo Google Forms)
  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-[#ede7f6] py-12 px-4 font-['Plus_Jakarta_Sans']">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-3 bg-indigo-600 w-full" />
            <div className="p-8 sm:p-10 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900">
                Postulación Nuevos Socios - PRUANED Final
              </h1>
              <p className="text-sm text-slate-700 leading-relaxed">
                Se ha registrado tu respuesta. La información fue enviada con éxito al Directorio Nacional para el proceso oficial de admisión.
              </p>
              <p className="text-xs text-slate-500">
                Hemos enviado una confirmación a: <strong className="text-slate-800">{formData.email}</strong>
              </p>
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData);
                    setFormSubmitted(false);
                    setCurrentSection(1);
                    setAntiSpamSession(createAntiSpamSession());
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
                >
                  Enviar otra respuesta
                </button>
                <a
                  href="/"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 ml-auto"
                >
                  Volver al inicio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ede7f6] py-8 sm:py-12 px-4 font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* HoneyPot oculto para AntiSpam */}
        <input 
          type="text" 
          name="website_trap_check" 
          value={antiSpamSession.honeypotValue} 
          onChange={(e) => setAntiSpamSession(s => ({ ...s, honeypotValue: e.target.value }))} 
          style={{ display: 'none', position: 'absolute', left: '-9999px' }} 
          tabIndex={-1} 
          autoComplete="off" 
        />

        {/* CABECERA PRINCIPAL (Estilo Google Forms) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-3 bg-indigo-600 w-full" />
          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">
                Formulario Oficial de Admisión
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">
                Página {currentSection} de 3
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900 leading-tight">
              Postulación Nuevos Socios - PRUANED Final
            </h1>

            {/* SECCIÓN 1 CABECERA: MISIÓN, VISIÓN Y ESTATUTOS */}
            {currentSection === 1 && (
              <div className="space-y-4 pt-2 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100">
                <h2 className="text-base font-bold text-slate-900 pt-2 font-['Outfit']">
                  1. Misión, Visión y Estatutos
                </h2>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">🔹 Misión</p>
                  <p className="text-slate-600 text-xs sm:text-sm pl-2 border-l-2 border-indigo-200">
                    Contribuir a la protección y bienestar de los animales en contextos de emergencia y desastre, fortaleciendo el trabajo profesional, ético y colaborativo de quienes actúan en este ámbito. PRUANED promueve la preparación, respuesta y recuperación efectiva, articulando conocimientos técnicos, científicos y humanitarios en beneficio de todas las especies y comunidades afectadas.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">🔹 Visión</p>
                  <p className="text-slate-600 text-xs sm:text-sm pl-2 border-l-2 border-indigo-200">
                    Ser una asociación gremial referente a nivel nacional en la gestión integral del bienestar animal en emergencias y desastres, reconocida por su compromiso profesional, su trabajo interdisciplinario y su aporte al desarrollo de políticas públicas y estrategias sostenibles de reducción del riesgo y respuesta ante crisis.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">🔹 Objetivos principales</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li>Reunir y representar a los profesionales vinculados a la gestión de animales en emergencias y desastres.</li>
                    <li>Promover la formación continua, la investigación y el intercambio de experiencias entre profesionales del área.</li>
                    <li>Fomentar la coordinación interinstitucional y el trabajo conjunto con organismos públicos, privados y comunitarios.</li>
                    <li>Impulsar estándares éticos y técnicos en la respuesta a emergencias que involucren animales.</li>
                    <li>Sensibilizar a la sociedad sobre la importancia de incluir a los animales en la gestión del riesgo y la respuesta a desastres.</li>
                    <li>Contribuir a políticas públicas que reconozcan el rol de los animales y de los profesionales especializados en su protección.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={openEstatutos}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg border border-indigo-200 text-xs transition"
                  >
                    <FileText className="w-4 h-4 text-indigo-700" /> Abrir Estatutos Oficiales (PDF)
                  </button>
                </div>
              </div>
            )}

            {/* SECCIÓN 2 CABECERA */}
            {currentSection === 2 && (
              <div className="pt-2 border-t border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                  2. Información Personal y Motivación
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingrese sus antecedentes de contacto, formación y motivación para postular a la asociación.
                </p>
              </div>
            )}

            {/* SECCIÓN 3 CABECERA */}
            {currentSection === 3 && (
              <div className="pt-2 border-t border-slate-100">
                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                  3. Preguntas Técnicas de GRD
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluación técnica de Gestión del Riesgo de Desastres y bienestar animal para la asignación operativa.
                </p>
              </div>
            )}

            <div className="pt-2">
              <span className="text-xs text-rose-600 font-semibold">
                * Indica que la pregunta es obligatoria
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECCIÓN 1: MISIÓN, VISIÓN Y ESTATUTOS
        ========================================================================= */}
        {currentSection === 1 && (
          <div className="space-y-4">
            <QuestionCard
              label="Estatutos: ¿Acepta los estatutos, el reglamento interno y el código ético?"
              required
              error={formErrors.aceptaEstatutos}
            >
              <RadioGroup
                name="aceptaEstatutos"
                options={['Sí, acepto', 'No acepto']}
                value={formData.aceptaEstatutos}
                onChange={updateField}
              />
            </QuestionCard>
          </div>
        )}

        {/* =========================================================================
            SECCIÓN 2: INFORMACIÓN PERSONAL Y MOTIVACIÓN
        ========================================================================= */}
        {currentSection === 2 && (
          <div className="space-y-4">
            <QuestionCard label="Nombre completo" required error={formErrors.nombreCompleto}>
              <ShortTextInput name="nombreCompleto" value={formData.nombreCompleto} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="RUT" required error={formErrors.rut} description="Ejemplo: 12345678-9">
              <ShortTextInput name="rut" value={formData.rut} onChange={updateField} placeholder="12345678-9" />
            </QuestionCard>

            <QuestionCard label="Fecha de nacimiento" required error={formErrors.fechaNacimiento}>
              <ShortTextInput name="fechaNacimiento" value={formData.fechaNacimiento} onChange={updateField} type="date" />
            </QuestionCard>

            <QuestionCard label="Domicilio" required error={formErrors.domicilio}>
              <ShortTextInput name="domicilio" value={formData.domicilio} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Comuna" required error={formErrors.comuna}>
              <ShortTextInput name="comuna" value={formData.comuna} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Teléfono de contacto" required error={formErrors.telefono} description="Ejemplo: +56912345678">
              <ShortTextInput name="telefono" value={formData.telefono} onChange={updateField} type="tel" placeholder="+56 9 1234 5678" />
            </QuestionCard>

            <QuestionCard label="Correo electrónico" required error={formErrors.email}>
              <ShortTextInput name="email" value={formData.email} onChange={updateField} type="email" />
            </QuestionCard>

            <QuestionCard label="Redes sociales (opcional)" required={false}>
              <ShortTextInput name="redesSociales" value={formData.redesSociales} onChange={updateField} placeholder="Instagram, LinkedIn, etc." />
            </QuestionCard>

            <QuestionCard label="Profesión u ocupación" required error={formErrors.profesion}>
              <ShortTextInput name="profesion" value={formData.profesion} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Nivel de estudios" required={false}>
              <ShortTextInput name="nivelEstudios" value={formData.nivelEstudios} onChange={updateField} placeholder="Técnico, Universitario, Posgrado, etc." />
            </QuestionCard>

            <QuestionCard label="Experiencia previa con animales, emergencias o voluntariado" required error={formErrors.experienciaPrevia}>
              <LongTextArea name="experienciaPrevia" value={formData.experienciaPrevia} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Formación certificada" required error={formErrors.formacionCertificada} description="Selecciona todas las que correspondan">
              <CheckboxGroup name="formacionCertificada" options={OPTIONS.formacionCertificada} value={formData.formacionCertificada} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Razones para integrarse a PRUANED" required error={formErrors.razonesIntegracion}>
              <LongTextArea name="razonesIntegracion" value={formData.razonesIntegracion} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="¿Qué espera aportar a la organización?" required error={formErrors.aporteEsperado}>
              <LongTextArea name="aporteEsperado" value={formData.aporteEsperado} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="¿Ha participado en organizaciones animalistas o de emergencia?" required error={formErrors.haParticipadoOrgs}>
              <RadioGroup name="haParticipadoOrgs" options={['Sí', 'No']} value={formData.haParticipadoOrgs} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Tiempo mensual disponible" required error={formErrors.tiempoDisponible}>
              <RadioGroup name="tiempoDisponible" options={OPTIONS.tiempoDisponible} value={formData.tiempoDisponible} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Áreas en las que desea participar" required error={formErrors.areasParticipacion} description="Selecciona todas las que correspondan">
              <CheckboxGroup name="areasParticipacion" options={OPTIONS.areasParticipacion} value={formData.areasParticipacion} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="¿Ha vivido experiencias emocionalmente complejas en emergencias?" required error={formErrors.experienciasComplejas}>
              <RadioGroup name="experienciasComplejas" options={['Sí', 'No']} value={formData.experienciasComplejas} onChange={updateField} />
              {formData.experienciasComplejas === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Describa brevemente (si aplica) <span className="text-rose-500">*</span>
                  </label>
                  <LongTextArea name="descripcionExperiencias" value={formData.descripcionExperiencias} onChange={updateField} />
                  {formErrors.descripcionExperiencias && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            <QuestionCard label="¿Considera que podría necesitar apoyo para su bienestar?" required error={formErrors.necesitaApoyoBienestar}>
              <RadioGroup name="necesitaApoyoBienestar" options={['Sí', 'No', 'No lo sé']} value={formData.necesitaApoyoBienestar} onChange={updateField} />
              {formData.necesitaApoyoBienestar === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ¿Qué tipo de apoyo sería útil? <span className="text-rose-500">*</span>
                  </label>
                  <LongTextArea name="tipoApoyoUtil" value={formData.tipoApoyoUtil} onChange={updateField} />
                  {formErrors.tipoApoyoUtil && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            <QuestionCard label="Carta de intención (texto o enlace)" required error={formErrors.cartaIntencion} description="Escribe tu motivación o pega el enlace a tu documento / drive. Opcionalmente puedes adjuntar el archivo abajo.">
              <LongTextArea name="cartaIntencion" value={formData.cartaIntencion} onChange={updateField} />
              <div className="mt-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjuntar archivo de carta de intención (opcional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => updateField('cartaIntencionArchivo', e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-800 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </QuestionCard>

            <QuestionCard label="Declaro que la información entregada es verídica" required error={formErrors.declaracionVeracidad}>
              <RadioGroup name="declaracionVeracidad" options={['Sí', 'No']} value={formData.declaracionVeracidad} onChange={updateField} />
            </QuestionCard>

            <QuestionCard label="Autorizo el uso de mis datos para fines internos" required error={formErrors.autorizacionDatos}>
              <RadioGroup name="autorizacionDatos" options={['Sí', 'No']} value={formData.autorizacionDatos} onChange={updateField} />
            </QuestionCard>

            {/* Política de privacidad */}
            <div className={`bg-white rounded-2xl border p-6 shadow-sm space-y-3 ${
              formErrors.aceptaLeyDatos ? 'border-rose-400 ring-2 ring-rose-100' : 'border-indigo-200 bg-indigo-50/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  Protección de Datos Personales (Ley 19.628 / 21.719)
                </span>
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
                >
                  <Scale className="w-3.5 h-3.5" /> Ver política completa
                </button>
              </div>
              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.aceptaLeyDatos === 'Sí, acepto'}
                  onChange={(e) => updateField('aceptaLeyDatos', e.target.checked ? 'Sí, acepto' : '')}
                  className="mt-0.5 w-4 h-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  He leído y acepto expresamente el tratamiento de mis datos personales conforme a la Política de Privacidad de PRUANED A.G. en cumplimiento con la normativa legal chilena. *
                </span>
              </label>
              {formErrors.aceptaLeyDatos && (
                <p className="text-xs font-semibold text-rose-600">Debe aceptar el tratamiento de datos para continuar</p>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECCIÓN 3: PREGUNTAS TÉCNICAS DE GRD (ORDEN EXACTO GOOGLE FORMS)
        ========================================================================= */}
        {currentSection === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Habilidades personales */}
            <QuestionCard label="Habilidades personales para fortalecer el trabajo en equipo" required error={formErrors.habilidadesEquipo}>
              <CheckboxGroup name="habilidadesEquipo" options={OPTIONS.habilidadesEquipo} value={formData.habilidadesEquipo} onChange={updateField} />
            </QuestionCard>

            {/* 2. Manejo del estrés */}
            <QuestionCard label="Manejo del estrés en emergencias" required error={formErrors.manejoEstres}>
              <RadioGroup name="manejoEstres" options={OPTIONS.manejoEstres} value={formData.manejoEstres} onChange={updateField} />
            </QuestionCard>

            {/* 3. Diagnósticos de riesgo */}
            <QuestionCard label="¿Ha participado en diagnósticos de riesgo o levantamiento territorial?" required error={formErrors.participacionDiagnosticoRiesgo}>
              <RadioGroup name="participacionDiagnosticoRiesgo" options={['Sí', 'No']} value={formData.participacionDiagnosticoRiesgo} onChange={updateField} />
              {formData.participacionDiagnosticoRiesgo === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Describa (si aplica)</label>
                  <LongTextArea name="descripcionDiagnosticoRiesgo" value={formData.descripcionDiagnosticoRiesgo} onChange={updateField} />
                </div>
              )}
            </QuestionCard>

            {/* 4. Amenazas o vulnerabilidades */}
            <QuestionCard label="¿Tiene experiencia identificando amenazas o vulnerabilidades?" required error={formErrors.experienciaAmenazas}>
              <RadioGroup name="experienciaAmenazas" options={['Sí', 'No']} value={formData.experienciaAmenazas} onChange={updateField} />
              {formData.experienciaAmenazas === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Describa (si aplica)</label>
                  <LongTextArea name="descripcionAmenazas" value={formData.descripcionAmenazas} onChange={updateField} />
                </div>
              )}
            </QuestionCard>

            {/* 5. Planes o protocolos */}
            <QuestionCard label="¿Ha participado en elaboración de planes o protocolos?" required error={formErrors.participacionPlanes}>
              <RadioGroup name="participacionPlanes" options={['Sí', 'No']} value={formData.participacionPlanes} onChange={updateField} />
              {formData.participacionPlanes === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tipo de plan (si aplica) <span className="text-rose-500">*</span>
                  </label>
                  <ShortTextInput name="tipoPlan" value={formData.tipoPlan} onChange={updateField} />
                  {formErrors.tipoPlan && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            {/* 6. Procedimientos y líneas de mando */}
            <QuestionCard label="Nivel de comodidad con procedimientos y líneas de mando" required error={formErrors.comodidadProcedimientos}>
              <RadioGroup name="comodidadProcedimientos" options={OPTIONS.comodidadProcedimientos} value={formData.comodidadProcedimientos} onChange={updateField} />
            </QuestionCard>

            {/* 7. Simulacros */}
            <QuestionCard label="¿Ha participado en simulacros o entrenamientos?" required error={formErrors.participacionSimulacros}>
              <RadioGroup name="participacionSimulacros" options={['Sí', 'No']} value={formData.participacionSimulacros} onChange={updateField} />
              {formData.participacionSimulacros === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Describa su rol</label>
                  <LongTextArea name="rolSimulacros" value={formData.rolSimulacros} onChange={updateField} />
                </div>
              )}
            </QuestionCard>

            {/* 8. SCI */}
            <QuestionCard label="¿Ha trabajado bajo SCI?" required error={formErrors.trabajoSCI}>
              <RadioGroup name="trabajoSCI" options={['Sí', 'No']} value={formData.trabajoSCI} onChange={updateField} />
              {formData.trabajoSCI === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ¿En qué rol? <span className="text-rose-500">*</span>
                  </label>
                  <ShortTextInput name="rolSCI" value={formData.rolSCI} onChange={updateField} />
                  {formErrors.rolSCI && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            {/* 9. Rol preferido en emergencias */}
            <QuestionCard label="Rol preferido durante emergencias" required error={formErrors.rolesEmergencia}>
              <CheckboxGroup name="rolesEmergencia" options={OPTIONS.rolesEmergencia} value={formData.rolesEmergencia} onChange={updateField} />
            </QuestionCard>

            {/* 10. Recuperación post-emergencia */}
            <QuestionCard label="¿Tiene experiencia en recuperación post-emergencia?" required error={formErrors.experienciaRecuperacion}>
              <RadioGroup name="experienciaRecuperacion" options={['Sí', 'No']} value={formData.experienciaRecuperacion} onChange={updateField} />
              {formData.experienciaRecuperacion === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Describa (si aplica)</label>
                  <LongTextArea name="descripcionRecuperacion" value={formData.descripcionRecuperacion} onChange={updateField} />
                </div>
              )}
            </QuestionCard>

            {/* 11. Intereses en fase de recuperación */}
            <QuestionCard label="Intereses en fase de recuperación" required error={formErrors.interesesRecuperacion}>
              <CheckboxGroup name="interesesRecuperacion" options={OPTIONS.interesesRecuperacion} value={formData.interesesRecuperacion} onChange={updateField} />
            </QuestionCard>

            {/* 12. Transporte propio */}
            <QuestionCard label="¿Cuenta con transporte propio?" required error={formErrors.transportePropio}>
              <RadioGroup name="transportePropio" options={['Sí', 'No']} value={formData.transportePropio} onChange={updateField} />
            </QuestionCard>

            {/* 13. Desplazamiento fuera de comuna */}
            <QuestionCard label="¿Puede desplazarse fuera de su comuna?" required error={formErrors.desplazamientoFueraComuna}>
              <RadioGroup name="desplazamientoFueraComuna" options={['Sí', 'No']} value={formData.desplazamientoFueraComuna} onChange={updateField} />
            </QuestionCard>

            {/* 14. Roles no operativos */}
            <QuestionCard label="Roles no operativos (si no puede desplazarse)" required error={formErrors.rolesNoOperativos}>
              <CheckboxGroup name="rolesNoOperativos" options={OPTIONS.rolesNoOperativos} value={formData.rolesNoOperativos} onChange={updateField} />
            </QuestionCard>

            {/* 15. Animales con los que se siente cómodo/a */}
            <QuestionCard label="Animales con los que se siente cómodo/a" required error={formErrors.animalesComodos}>
              <CheckboxGroup name="animalesComodos" options={OPTIONS.animalesComodos} value={formData.animalesComodos} onChange={updateField} />
            </QuestionCard>

            {/* 16. Especies a evitar */}
            <QuestionCard label="Si prefiere evitar, ¿cuáles y por qué?" required={false}>
              <LongTextArea name="especiesEvitar" value={formData.especiesEvitar} onChange={updateField} />
            </QuestionCard>

            {/* 17. Liderazgo de equipos */}
            <QuestionCard label="¿Tiene experiencia liderando equipos?" required error={formErrors.liderazgoEquipos}>
              <RadioGroup name="liderazgoEquipos" options={['Sí', 'No']} value={formData.liderazgoEquipos} onChange={updateField} />
              {formData.liderazgoEquipos === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Describa su experiencia <span className="text-rose-500">*</span>
                  </label>
                  <LongTextArea name="experienciaLiderazgo" value={formData.experienciaLiderazgo} onChange={updateField} />
                  {formErrors.experienciaLiderazgo && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            {/* 18. Reacción ante conflictos */}
            <QuestionCard label="¿Cómo reacciona ante conflictos?" required error={formErrors.reaccionConflictos}>
              <RadioGroup name="reaccionConflictos" options={OPTIONS.reaccionConflictos} value={formData.reaccionConflictos} onChange={updateField} />
            </QuestionCard>

            {/* 19. Instituciones públicas o de emergencia */}
            <QuestionCard label="¿Ha trabajado con instituciones públicas o de emergencia?" required error={formErrors.trabajoInstituciones}>
              <RadioGroup name="trabajoInstituciones" options={['Sí', 'No']} value={formData.trabajoInstituciones} onChange={updateField} />
              {formData.trabajoInstituciones === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ¿Con cuáles y en qué contexto? <span className="text-rose-500">*</span>
                  </label>
                  <LongTextArea name="institucionesContexto" value={formData.institucionesContexto} onChange={updateField} />
                  {formErrors.institucionesContexto && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            {/* 20. Protocolos interinstitucionales */}
            <QuestionCard label="Nivel de manejo de protocolos interinstitucionales" required error={formErrors.manejoProtocolos}>
              <RadioGroup name="manejoProtocolos" options={['Alto', 'Medio', 'Bajo', 'Sin experiencia']} value={formData.manejoProtocolos} onChange={updateField} />
            </QuestionCard>

            {/* 21. Conocimiento normativo */}
            <QuestionCard label="Conocimiento normativo" required error={formErrors.conocimientoNormativo}>
              <CheckboxGroup name="conocimientoNormativo" options={OPTIONS.conocimientoNormativo} value={formData.conocimientoNormativo} onChange={updateField} />
            </QuestionCard>

            {/* 22. Dispuesto/a a capacitarse */}
            <QuestionCard label="¿Está dispuesto/a a capacitarse?" required error={formErrors.dispuestoCapacitarse}>
              <RadioGroup name="dispuestoCapacitarse" options={['Sí', 'No', 'Según disponibilidad']} value={formData.dispuestoCapacitarse} onChange={updateField} />
            </QuestionCard>

            {/* 23. Experiencia en registros */}
            <QuestionCard label="¿Tiene experiencia en registros o bases de datos?" required error={formErrors.experienciaRegistros}>
              <RadioGroup name="experienciaRegistros" options={['Sí', 'No']} value={formData.experienciaRegistros} onChange={updateField} />
            </QuestionCard>

            {/* 24. Funciones sin trato directo con animales */}
            <QuestionCard label="¿Puede desempeñar funciones sin trato directo con animales?" required error={formErrors.funcionesSinAnimales}>
              <CheckboxGroup name="funcionesSinAnimales" options={OPTIONS.funcionesSinAnimales} value={formData.funcionesSinAnimales} onChange={updateField} />
            </QuestionCard>

            {/* 25. Comunidades rurales o crianceros */}
            <QuestionCard label="¿Ha trabajado con comunidades rurales o crianceros?" required error={formErrors.trabajoComunidadesRurales}>
              <RadioGroup name="trabajoComunidadesRurales" options={['Sí', 'No']} value={formData.trabajoComunidadesRurales} onChange={updateField} />
              {formData.trabajoComunidadesRurales === 'Sí' && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Describa su experiencia (si aplica) <span className="text-rose-500">*</span>
                  </label>
                  <LongTextArea name="experienciaComunidades" value={formData.experienciaComunidades} onChange={updateField} />
                  {formErrors.experienciaComunidades && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold">Este campo es requerido al haber marcado Sí</p>
                  )}
                </div>
              )}
            </QuestionCard>

            {/* 26. Familias afectadas */}
            <QuestionCard label="Comodidad con familias afectadas" required error={formErrors.comodidadFamilias}>
              <RadioGroup name="comodidadFamilias" options={OPTIONS.comodidadFamilias} value={formData.comodidadFamilias} onChange={updateField} />
            </QuestionCard>

            {/* 27. Escenarios críticos (PDF IDENTICAL) */}
            <QuestionCard label="¿Cómo actúa en escenarios críticos?" required error={formErrors.accionCritica}>
              <RadioGroup name="accionCritica" options={OPTIONS.accionCritica} value={formData.accionCritica} onChange={updateField} />
            </QuestionCard>

            {/* 28. Bienestar animal en emergencias (PDF IDENTICAL) */}
            <QuestionCard label="¿Cómo entiende el bienestar animal en emergencias?" required error={formErrors.bienestarAnimalEmergencias}>
              <LongTextArea name="bienestarAnimalEmergencias" value={formData.bienestarAnimalEmergencias} onChange={updateField} />
            </QuestionCard>

            {/* 29. Trabajo ético en desastres (PDF IDENTICAL) */}
            <QuestionCard label="¿Qué considera indispensable para un trabajo ético en desastres?" required error={formErrors.trabajoEticoDesastres}>
              <LongTextArea name="trabajoEticoDesastres" value={formData.trabajoEticoDesastres} onChange={updateField} />
            </QuestionCard>

            {/* 30. Límites personales y profesionales (PDF IDENTICAL) */}
            <QuestionCard label="¿Cómo respeta límites personales y profesionales en equipos multidisciplinarios?" required error={formErrors.limitesProfesionales}>
              <LongTextArea name="limitesProfesionales" value={formData.limitesProfesionales} onChange={updateField} />
            </QuestionCard>

            {/* 31. Área más valiosa (PDF IDENTICAL) */}
            <QuestionCard label="¿En qué área sería más valioso/a para PRUANED y por qué?" required error={formErrors.areaValorPRUANED}>
              <LongTextArea name="areaValorPRUANED" value={formData.areaValorPRUANED} onChange={updateField} />
            </QuestionCard>

            {/* Botonera de Envío Sección 3 */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> {isSubmitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleClearForm}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Borrar formulario
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            BARRA INFERIOR DE NAVEGACIÓN (SECCIONES 1 Y 2)
        ========================================================================= */}
        {currentSection < 3 && (
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2.5">
              {currentSection > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Atrás
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                Siguiente <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearForm}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Borrar formulario
            </button>
          </div>
        )}

        {/* BARRA DE PROGRESO INFERIOR (Estilo Google Forms) */}
        <div className="py-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
            <span>Página {currentSection} de 3</span>
            <span>{Math.round((currentSection / 3) * 100)}% completado</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentSection / 3) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* MODAL DE POLÍTICA DE PRIVACIDAD */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
        </div>
      )}
    </div>
  );
};
