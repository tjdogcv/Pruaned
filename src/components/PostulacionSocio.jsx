import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { INSTITUTIONAL_INFO } from '../data/initialData';
import { PrivacyDataPolicy } from './PrivacyDataPolicy';
import { 
  ShieldCheck, 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Award,
  Heart,
  Upload,
  AlertCircle,
  HelpCircle,
  Building,
  Scale
} from 'lucide-react';

export const PostulacionSocio = ({ onNavigate }) => {
  const { addPostulacion } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rut: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    domicilio: '',
    comuna: '',
    profesion: '',
    nivelEstudios: 'Educación Superior Completa',
    experienciaPrevia: '',
    formacionCertificada: [],
    razonesIntegracion: '',
    aporteEsperado: '',
    haParticipadoOrgs: 'No',
    tiempoDisponible: '4–8 horas mensuales',
    areasParticipacion: [],
    experienciasComplejas: 'No',
    descripcionExperiencias: '',
    necesitaApoyoBienestar: 'No',
    tipoApoyoUtil: '',
    cartaIntencionArchivo: null,
    declaracionVeracidad: 'Sí',
    autorizacionDatos: 'Sí',
    aceptaEstatutos: 'Sí, acepto',
    aceptaLeyDatos: 'Sí, acepto'
  });

  const handleOpenEstatutosPDF = (e) => {
    if (e) e.preventDefault();
    window.open('/Estatutos-v-3.pdf', '_blank', 'noopener,noreferrer');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (formData.aceptaEstatutos !== 'Sí, acepto' || formData.aceptaLeyDatos !== 'Sí, acepto') {
      alert('Debe aceptar los Estatutos Oficiales y la Declaración de Protección de Datos Personales (Ley N° 21.719) para enviar su postulación.');
      return;
    }

    const postulacionFinal = {
      ...formData,
      id: `POST-${Date.now().toString().slice(-6)}`,
      fechaEnvio: new Date().toISOString().split('T')[0],
      estado: 'Pendiente Revisión Directorio',
      cartaIntencionNombre: formData.cartaIntencionArchivo ? formData.cartaIntencionArchivo.name : 'Carta_Intencion_Adjunta.pdf'
    };

    addPostulacion(postulacionFinal);
    setFormSubmitted(true);
  };

  return (
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Hero */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Admisión de Nuevos Socios 2025
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] leading-tight">
              Postulación a <span className="text-emerald-400">PRUANED A.G.</span>
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              Forma parte de la asociación gremial referente en Chile en la gestión integral del bienestar animal en emergencias y desastres.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Postular a PRUANED A.G.
              </button>

              <button
                onClick={handleOpenEstatutosPDF}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" /> Ver Estatutos PDF (Oficial v3)
              </button>
            </div>
          </div>
        </div>

        {/* Misión, Visión, Objetivos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-900" /> Misión Institucional
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Contribuir a la protección y bienestar de los animales en contextos de emergencia y desastre, fortaleciendo el trabajo profesional, ético y colaborativo de quienes actúan en este ámbito. PRUANED promueve la preparación, respuesta y recuperación efectiva, articulando conocimientos técnicos, científicos y humanitarios en beneficio de todas las especies y comunidades afectadas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Visión Institucional
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ser una asociación gremial referente a nivel nacional en la gestión integral del bienestar animal en emergencias y desastres, reconocida por su compromiso profesional, su trabajo interdisciplinario y su aporte al desarrollo de políticas públicas y estrategias sostenibles de reducción del riesgo y respuesta ante crisis.
            </p>
          </div>
        </div>

        {/* MODAL FORMULARIO DE POSTULACIÓN DE NUEVOS SOCIOS */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
              
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormSubmitted(false);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              {formSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
                  <h3 className="text-2xl font-extrabold font-['Outfit']">
                    ¡Postulación Recibida Exitosamente!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Tu postulación a PRUANED A.G. ha sido registrada y puesta en conocimiento del Directorio Nacional. Evaluaremos tus antecedentes y se te notificará formalmente al correo <strong className="text-slate-900">{formData.email}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormSubmitted(false);
                    }}
                    className="px-6 py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs"
                  >
                    Volver a la Página Principal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  
                  <div className="border-b border-slate-100 pb-4">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full uppercase">
                      Proceso de Admisión Formato Oficial
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1">
                      Ficha de Postulación de Nuevos Socios
                    </h3>
                  </div>

                  {/* Sección A: Datos Personales */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-950 font-['Outfit'] uppercase border-b border-slate-100 pb-1">
                      Sección A: Datos Personales & Profesionales
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={formData.nombreCompleto}
                          onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">RUT / Cédula Identidad *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 15.482.910-K"
                          value={formData.rut}
                          onChange={(e) => setFormData({...formData, rut: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Teléfono Móvil *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+56 9 1234 5678"
                          value={formData.telefono}
                          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Profesión / Ocupación *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Médico Veterinario / Ing. Prevención"
                          value={formData.profesion}
                          onChange={(e) => setFormData({...formData, profesion: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Comuna / Ciudad *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: San Fabián / Concepción"
                          value={formData.comuna}
                          onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección B: Declaraciones & Ley 21.719 */}
                  <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
                    <h4 className="text-sm font-bold text-blue-950 font-['Outfit'] uppercase border-b border-slate-100 pb-1">
                      Sección B: Aceptación de Estatutos (v3) & Protección de Datos (Ley N° 21.719)
                    </h4>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">1. Estatutos Oficiales PRUANED A.G. (v3.0)</span>
                        <button
                          type="button"
                          onClick={handleOpenEstatutosPDF}
                          className="text-blue-900 font-bold underline flex items-center gap-1 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Ver PDF Oficial (Estatutos-v-3.pdf)
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="radio"
                            name="aceptaEstatutos"
                            checked={formData.aceptaEstatutos === 'Sí, acepto'}
                            onChange={(e) => setFormData({...formData, aceptaEstatutos: e.target.value})}
                            className="accent-emerald-600"
                          />
                          <span>Declaro haber leído y aceptar los Estatutos Oficiales v3</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950">2. Resguardo Ley N° 21.719 Protección de Datos</span>
                        <button
                          type="button"
                          onClick={() => setIsPrivacyModalOpen(true)}
                          className="text-emerald-900 font-bold underline flex items-center gap-1"
                        >
                          <Scale className="w-3.5 h-3.5" /> Ver Política ARCO+
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950">
                          <input
                            type="radio"
                            name="aceptaLeyDatos"
                            checked={formData.aceptaLeyDatos === 'Sí, acepto'}
                            onChange={(e) => setFormData({...formData, aceptaLeyDatos: e.target.value})}
                            className="accent-emerald-600"
                          />
                          <span>Acepto el tratamiento de datos personales y la política de renuncias anonimizadas</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" /> Enviar Formulario al Directorio
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        )}

        {/* Modal Política de Datos */}
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
            <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
          </div>
        )}

      </div>
    </section>
  );
};
