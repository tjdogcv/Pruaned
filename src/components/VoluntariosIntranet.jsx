import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from './CertificateModal';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
import { generateCertificateHash } from '../utils/security';
import { 
  GraduationCap, 
  PlayCircle, 
  Award, 
  CheckCircle2, 
  Search, 
  HelpCircle,
  ShieldCheck,
  Mail,
  Truck,
  Briefcase,
  Clock,
  Radio,
  Send,
  Save
} from 'lucide-react';

export const VoluntariosIntranet = () => {
  const { 
    voluntariosList, 
    coursesList, 
    updateVolunteerCert, 
    updateVoluntarioDisponibilidad,
    currentUser 
  } = useAuth();

  const [subTab, setSubTab] = useState('lms'); // lms, padron, convocatoria, mi-disponibilidad
  const [selectedCourse, setSelectedCourse] = useState(coursesList[0]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [certData, setCertData] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Convocatoria State
  const [convocatoriaAsunto, setConvocatoriaAsunto] = useState('');
  const [convocatoriaMensaje, setConvocatoriaMensaje] = useState('');
  const [convocatoriaSent, setConvocatoriaSent] = useState(false);

  // Mi Disponibilidad State (Form para Voluntario)
  const activeVol = voluntariosList.find(v => v.email === currentUser?.email) || voluntariosList[0];

  const [volDisponibilidad, setVolDisponibilidad] = useState(activeVol.disponibilidadRespuesta || 'Disponible de inmediato');
  const [volRecursos, setVolRecursos] = useState(activeVol.recursosPropios || []);
  const [volLabores, setVolLabores] = useState(activeVol.laboresQuePuedeRealizar || []);

  const handleCheckboxListToggle = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSaveDisponibilidadSubmit = (e) => {
    e.preventDefault();
    updateVoluntarioDisponibilidad(activeVol.id, {
      disponibilidadRespuesta: volDisponibilidad,
      recursosPropios: volRecursos,
      laboresQuePuedeRealizar: volLabores
    });
    alert('¡Tu disponibilidad, recursos propios y labores asignables han sido actualizados en la base de datos de PRUANED!');
  };

  const handleSendConvocatoriaMasiva = (e) => {
    e.preventDefault();
    if (convocatoriaAsunto && convocatoriaMensaje) {
      setConvocatoriaSent(true);
      setTimeout(() => {
        setConvocatoriaSent(false);
        setConvocatoriaAsunto('');
        setConvocatoriaMensaje('');
        alert(`¡Convocatoria Masiva por correo electrónico despachada a ${voluntariosList.length} voluntarios en padrón!`);
      }, 1000);
    }
  };

  const handleExamOptionSelect = (questionIndex, selectedOptionIndex) => {
    setExamAnswers(prev => ({ ...prev, [questionIndex]: selectedOptionIndex }));
  };

  const handleEvaluateExam = (e) => {
    e.preventDefault();
    let correctCount = 0;
    selectedCourse.examQuestions.forEach((q, idx) => {
      if (examAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const isPassed = correctCount === selectedCourse.examQuestions.length;
    setExamResult({ isPassed, score: `${correctCount}/${selectedCourse.examQuestions.length}` });

    if (isPassed) {
      updateVolunteerCert(activeVol.id, selectedCourse.id);
      
      const hash = generateCertificateHash(activeVol.id, selectedCourse.id);
      setCertData({
        volunteerName: activeVol.nombre,
        volunteerRut: activeVol.rut,
        courseTitle: selectedCourse.title,
        hours: selectedCourse.duration,
        hash: hash,
        issueDate: new Date().toLocaleDateString('es-CL'),
        directivaPeriod: "Directiva Fundadora 2025-2029",
        presidentName: "Presidente/a del Directorio Nacional"
      });
      setIsCertModalOpen(true);
    }
  };

  const filteredVoluntarios = voluntariosList.filter(v => {
    return v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           v.rut.includes(searchTerm) ||
           v.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Intranet Gremial 2
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Portal de Voluntarios, LMS & Convocatorias
            </h2>
            <p className="text-slate-600 text-xs mt-1">
              Capacitaciones grabadas, declaración de recursos propios, disponibilidad y llamado a emergencias.
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-200 p-1 rounded-xl border border-slate-300 gap-1">
            <button
              onClick={() => setSubTab('lms')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'lms' ? 'bg-emerald-600 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Aula Virtual / LMS
            </button>

            <button
              onClick={() => setSubTab('mi-disponibilidad')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'mi-disponibilidad' ? 'bg-emerald-600 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Declarar Mi Disponibilidad & Recursos
            </button>

            <button
              onClick={() => setSubTab('convocatoria')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'convocatoria' ? 'bg-emerald-600 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Correo Masivo / Emergencias
            </button>

            <button
              onClick={() => setSubTab('padron')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'padron' ? 'bg-emerald-600 text-white shadow' : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Trazabilidad Voluntarios
            </button>
          </div>
        </div>

        {/* Data Protection Banner */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-950 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-700 flex-shrink-0" />
            <div>
              <div className="font-bold font-['Outfit'] text-sm">Resguardo Ley N° 21.719 para Voluntarios</div>
              <p className="text-emerald-800 text-[11px]">
                Sus datos personales y declaración de recursos están protegidos conforme a la ley chilena.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow"
          >
            Ver Política Ley 21.719
          </button>
        </div>

        {/* SUBTAB: DECLARAR DISPONIBILIDAD & RECURSOS PROPIOS (PARA EL VOLUNTARIO) */}
        {subTab === 'mi-disponibilidad' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full">
                  Ficha de Actualización Operativa
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  Declarar Disponibilidad, Recursos Propios & Labores
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Voluntario: <strong className="text-slate-900">{activeVol.nombre}</strong> ({activeVol.rut})
                </p>
              </div>

              <form onSubmit={handleSaveDisponibilidadSubmit} className="space-y-6 text-xs">
                
                {/* Disponibilidad de Respuesta */}
                <div>
                  <label className="block font-bold text-slate-900 text-sm mb-2 font-['Outfit']">
                    1. Disponibilidad de Tiempo para Respuesta
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      "Disponible de inmediato (Respuesta en < 12h)",
                      "Disponible en 24 Horas",
                      "Disponible en 48 Horas",
                      "No disponible por el momento"
                    ].map((disp) => (
                      <label key={disp} className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        volDisponibilidad === disp
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                        <input
                          type="radio"
                          name="disponibilidadRespuesta"
                          value={disp}
                          checked={volDisponibilidad === disp}
                          onChange={(e) => setVolDisponibilidad(e.target.value)}
                          className="hidden"
                        />
                        <span>{disp}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Recursos Propios Disponibles */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-900 text-sm mb-2 font-['Outfit']">
                    2. Recursos Propios Disponibles para Terreno
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Camioneta 4x4",
                      "Remolque de Ganado",
                      "Botiquín Veterinario de Campo",
                      "Jaulas de Transporte",
                      "Alimento Mascotas 50kg",
                      "Equipo de Contención Pecuaria",
                      "Generador Eléctrico",
                      "Carpa de Campaña",
                      "Equipo Radio VHF/UHF"
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={volRecursos.includes(item)}
                          onChange={() => handleCheckboxListToggle(volRecursos, setVolRecursos, item)}
                          className="accent-emerald-600"
                        />
                        <span className="text-[11px] font-semibold">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Labores que Puede Realizar */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-900 text-sm mb-2 font-['Outfit']">
                    3. Labores / Tareas que Puede Realizar en Terreno
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Contención Pecuaria",
                      "Transporte de Animales",
                      "Triage Veterinario",
                      "Atención Primaria Mascotas",
                      "Gestión de Albergues Temporales",
                      "Logística Terreno & Acopio",
                      "Apoyo Administrativo & Fichas",
                      "Rescate Técnico Animal"
                    ].map((labor) => (
                      <label key={labor} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={volLabores.includes(labor)}
                          onChange={() => handleCheckboxListToggle(volLabores, setVolLabores, labor)}
                          className="accent-emerald-600"
                        />
                        <span className="text-[11px] font-semibold">{labor}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Mi Disponibilidad & Recursos
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUBTAB: CORREO MASIVO DE EMERGENCIA (PARA EL ENCARGADO DE VOLUNTARIOS) */}
        {subTab === 'convocatoria' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full uppercase">
                  Encargado Nacional de Voluntariado
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-600" />
                  Convocatoria Masiva de Emergencia por Correo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Envía una notificación por correo a todos los voluntarios inscritos en el padrón para que ingresen a la intranet a registrar su disponibilidad y recursos propios.
                </p>
              </div>

              {convocatoriaSent ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-900">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="font-bold text-base">¡Convocatoria Despachada Exitosamente!</div>
                  <p className="text-xs text-emerald-800">
                    Se han enviado correos electrónicos individuales a los {voluntariosList.length} voluntarios en padrón.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendConvocatoriaMasiva} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Asunto del Correo de Convocatoria *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: [URGENTE PRUANED] Activación de Alerta Zoosanitaria Incendio Forestal Ñuble"
                      value={convocatoriaAsunto}
                      onChange={(e) => setConvocatoriaAsunto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mensaje e Instrucciones para los Voluntarios *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Estimados voluntarios, ante la activación de emergencia en la región, solicitamos ingresar a la Intranet para declarar su disponibilidad de tiempo, recursos de terreno y tareas que pueden realizar..."
                      value={convocatoriaMensaje}
                      onChange={(e) => setConvocatoriaMensaje(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                    <strong>Destinatarios:</strong> Padrón completo de voluntarios ({voluntariosList.length} voluntarios activos).
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Despachar Correo Masivo a Voluntarios
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 1: LMS & VIDEOTECA */}
        {subTab === 'lms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-emerald-600" />
                Cursos & Charlas Grabadas
              </h3>

              <div className="space-y-3">
                {coursesList.map((course) => {
                  const isCompleted = activeVol.cursosAprobados.includes(course.id);
                  const isSelected = selectedCourse.id === course.id;
                  return (
                    <div
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course);
                        setExamResult(null);
                        setExamAnswers({});
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-mono">{course.code}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Aprobado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 font-['Outfit'] leading-snug">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Instructor: {course.instructor} • {course.duration}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full uppercase">
                      {selectedCourse.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mt-1">
                      {selectedCourse.title}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{selectedCourse.duration}</span>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform">
                      <PlayCircle className="w-8 h-8 fill-white text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      Reproduciendo: <span className="text-emerald-400 font-bold">{selectedCourse.title}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Exam */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    Evaluación de Conocimientos para Certificación QR
                  </h4>
                  <span className="text-xs text-amber-700 font-bold">Aprobación Exigida: 100%</span>
                </div>

                <form onSubmit={handleEvaluateExam} className="space-y-5">
                  {selectedCourse.examQuestions.map((question, qIdx) => (
                    <div key={qIdx} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-900">
                        {qIdx + 1}. {question.q}
                      </p>
                      <div className="space-y-1.5">
                        {question.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              examAnswers[qIdx] === oIdx
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={examAnswers[qIdx] === oIdx}
                              onChange={() => handleExamOptionSelect(qIdx, oIdx)}
                              className="accent-emerald-600"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {examResult && (
                    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                      examResult.isPassed ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}>
                      <span>
                        {examResult.isPassed ? '¡Examen Aprobado! Certificado digital generado.' : 'Evaluación no aprobada. Vuelve a intentarlo.'}
                      </span>
                      <span>Puntaje: {examResult.score}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Rendir Examen y Generar Certificado Digital
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB 2: TRAZABILIDAD VOLUNTARIOS */}
        {subTab === 'padron' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar voluntario o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="text-xs text-slate-600 font-semibold">
                Total Voluntarios: <strong className="text-emerald-700">{voluntariosList.length}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVoluntarios.map((vol) => (
                <div
                  key={vol.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`badge-inst ${
                        vol.tipo === 'Voluntario Permanente' ? 'badge-green' : 'badge-amber'
                      }`}>
                        {vol.tipo} (Art. 61)
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mt-2">
                        {vol.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{vol.rut} • {vol.region}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">{vol.horasAcumuladas} hrs</div>
                      <div className="text-[10px] text-slate-400 font-medium">Horas Terreno</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disponibilidad Actual:</span>
                      <span className="font-bold text-emerald-800">{vol.disponibilidadRespuesta || 'Disponible de inmediato'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acreditación:</span>
                      <span className="font-bold text-slate-900">{vol.nivelAcreditacion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Especialidad:</span>
                      <span className="font-bold text-blue-900">{vol.especialidad}</span>
                    </div>
                  </div>

                  {/* Declared Own Resources */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" /> Recursos Propios Declarados:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vol.recursosPropios?.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded text-[10px] font-bold">
                          {r}
                        </span>
                      )) || <span className="text-xs text-slate-400 italic">No declarados</span>}
                    </div>
                  </div>

                  {/* Declared Tasks */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Labores que Puede Realizar:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vol.laboresQuePuedeRealizar?.map((l, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded text-[10px] font-bold">
                          {l}
                        </span>
                      )) || <span className="text-xs text-slate-400 italic">No declaradas</span>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-800">Historial de Despliegues Operativos:</div>
                    {vol.despliegues.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Sin despliegues registrados aún.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {vol.despliegues.map((d, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-900">{d.evento}</div>
                              <div className="text-[11px] text-slate-500">{d.rol} • {d.fecha}</div>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[11px]">
                              {d.horas} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificateData={certData}
        />

        {/* Privacy Policy Modal */}
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
            <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
          </div>
        )}

      </div>
    </section>
  );
};
