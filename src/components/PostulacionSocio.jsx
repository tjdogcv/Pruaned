import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Target, 
  Eye, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Send, 
  HelpCircle, 
  ExternalLink
} from 'lucide-react';

export const PostulacionSocio = ({ onNavigate }) => {
  const { addPostulacion } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    aceptaEstatutos: 'Sí, acepto',
    nombreCompleto: '',
    rut: '',
    fechaNacimiento: '',
    domicilio: '',
    comuna: '',
    telefono: '',
    email: '',
    redesSociales: '',
    profesion: '',
    nivelEstudios: 'Educación Superior Completa',
    experienciaPrevia: '',
    formacionCertificada: [],
    razonesIntegracion: '',
    aporteEsperado: '',
    haParticipadoOrgs: 'No',
    tiempoDisponible: '4–8 horas',
    areasParticipacion: [],
    experienciasComplejas: 'No',
    descripcionExperiencias: 'No aplica',
    necesitaApoyoBienestar: 'No',
    tipoApoyoUtil: 'No aplica',
    cartaIntencionNombre: '',
    declaracionVeracidad: 'Sí',
    autorizacionDatos: 'Sí'
  });

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentList = prev[field] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [field]: updatedList };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, cartaIntencionNombre: file.name }));
    }
  };

  const handleOpenEstatutosPDF = (e) => {
    e.preventDefault();
    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estatutos y Reglamento General PRUANED A.G. 2025</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 40px; color: #0f172a; max-width: 800px; margin: auto; }
            h1 { color: #0c2340; border-bottom: 2px solid #0c2340; padding-bottom: 10px; }
            h2 { color: #002855; margin-top: 24px; }
            .badge { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <span class="badge">DOCUMENTO OFICIAL REGLAMENTARIO</span>
          <h1>Estatutos y Reglamento General PRUANED A.G. 2025</h1>
          <p><strong>Decreto Ley N° 2.757 de 1979 | República de Chile</strong></p>
          <hr/>
          <h2>TÍTULO I: DE LA DENOMINACIÓN, OBJETIVOS Y DOMICILIO</h2>
          <p><strong>Artículo 1°:</strong> Constitúyase la Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres, pudiendo usar el acrónimo "PRUANED A.G."...</p>
          <p><strong>Artículo 2°:</strong> El domicilio legal de la Asociación Gremial se fija en la Comuna de San Fabián de Alico, Región de Ñuble, Chile, extendiendo su actuación a todo el territorio nacional e internacional.</p>
          <h2>TÍTULO II: DE LOS SOCIOS, DERECHOS Y DEBERES</h2>
          <p><strong>Artículo 8°:</strong> Existirán tres categorías de socios: Activos, Adherentes y Honorarios.</p>
          <p><strong>Artículo 42°:</strong> El valor de la cuota social ordinaria mensual y la cuota de incorporación serán fijados por la Asamblea General a propuesta del Directorio Nacional. En casos justificados de fuerza mayor o desastre, el socio podrá solicitar la suspensión temporaria de su cuota.</p>
          <h2>TÍTULO III: DEL VOLUNTARIADO Y CÓDIGO ÉTICO</h2>
          <p><strong>Artículo 60°:</strong> El voluntariado de PRUANED A.G. actuará bajo estrictos estándares de bioseguridad, ética veterinaria y coordinación con SENAPRED y autoridades competentes.</p>
          <div class="footer">
            Sello Digital de Autenticidad PRUANED A.G. 2025 — Certificado de Documentación Pública Oficial
          </div>
        </body>
      </html>
    `);
    pdfWindow.document.close();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.aceptaEstatutos !== 'Sí, acepto') {
      alert('Debe aceptar los estatutos y reglamento para enviar su postulación.');
      return;
    }

    const newId = `POST-${Date.now().toString().slice(-6)}`;
    setApplicationId(newId);

    if (addPostulacion) {
      addPostulacion({
        ...formData,
        id: newId,
        fechaEnvio: new Date().toISOString().split('T')[0],
        estado: 'Pendiente Revisión Directorio'
      });
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> Proceso de Incorporación Gremial
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-['Outfit']">
            Hazte Socio PRUANED A.G.
          </h1>
          <p className="text-slate-600 text-sm font-normal leading-relaxed">
            Postulación de Nuevos Socios para la Asociación Gremial de Profesionales Unidos por los Animales en Emergencias y Desastres.
          </p>
        </div>

        {/* Misión y Visión Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-inst p-6 space-y-3 border-l-4 border-l-blue-900">
            <div className="flex items-center gap-2.5 text-blue-900 font-bold font-['Outfit'] text-lg">
              <Target className="w-5 h-5" /> Misión Institucional
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Contribuir a la protección y bienestar de los animales en contextos de emergencia y desastre, fortaleciendo el trabajo profesional, ético y colaborativo de quienes actúan en este ámbito. PRUANED promueve la preparación, respuesta y recuperación efectiva, articulando conocimientos técnicos, científicos y humanitarios en beneficio de todas las especies y comunidades afectadas.
            </p>
          </div>

          <div className="card-inst p-6 space-y-3 border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold font-['Outfit'] text-lg">
              <Eye className="w-5 h-5 text-emerald-600" /> Visión Institucional
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Ser una asociación gremial referente a nivel nacional en la gestión integral del bienestar animal en emergencias y desastres, reconocida por su compromiso profesional, su trabajo interdisciplinario y su aporte al desarrollo de políticas públicas y estrategias sostenibles de reducción del riesgo y respuesta ante crisis.
            </p>
          </div>
        </div>

        {/* Objetivos Principales */}
        <div className="card-inst p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-2">
            Objetivos Principales de la Asociación
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Reunir y representar a los profesionales vinculados a la gestión de animales en emergencias y desastres.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Promover la formación continua, la investigación y el intercambio de experiencias entre profesionales.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Fomentar la coordinación interinstitucional y el trabajo conjunto con organismos públicos y privados.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Impulsar estándares éticos y técnicos en la respuesta a emergencias que involucren animales.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Sensibilizar a la sociedad sobre la importancia de incluir a los animales en la gestión del riesgo.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Contribuir a políticas públicas que reconozcan el rol especializado en protección animal.</span>
            </li>
          </ul>
        </div>

        {/* Notice for Estatutos */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-bold">Estatutos y Reglamento General 2025</div>
            <p className="text-blue-800">
              Podés revisar el texto completo de nuestros <a href="#" onClick={handleOpenEstatutosPDF} className="underline font-bold hover:text-blue-600">Estatutos y Reglamento General</a> antes de postular.
            </p>
          </div>
          <button
            onClick={handleOpenEstatutosPDF}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg whitespace-nowrap inline-flex items-center gap-1.5 shadow"
          >
            <FileText className="w-4 h-4" />
            Ver Estatutos PDF <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Process Explanation */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold text-amber-950 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-700" /> ¿Cómo funciona el proceso?
          </div>
          <p className="leading-relaxed text-amber-800">
            Completá el formulario de postulación con tus datos y adjuntá tu carta de intención. El Directorio Nacional revisará tu solicitud y te contactará para informarte si fue aceptada y coordinar tu incorporación formal como socio, incluyendo el pago de la cuota correspondiente.
          </p>
        </div>

        {/* SUCCESS CONFIRMATION DISPLAY */}
        {submitted ? (
          <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 text-center space-y-4 shadow-xl animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h3 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              ¡Postulación Recibida Exitosamente!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Tu solicitud ha sido ingresada correctamente al sistema con el código de seguimiento: <strong className="text-emerald-700 font-mono">{applicationId}</strong>.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 max-w-md mx-auto text-left space-y-1">
              <div>• <strong>Postulante:</strong> {formData.nombreCompleto}</div>
              <div>• <strong>RUT:</strong> {formData.rut}</div>
              <div>• <strong>Correo de contacto:</strong> {formData.email}</div>
              <div>• <strong>Estado:</strong> En revisión por el Directorio Nacional PRUANED</div>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl"
            >
              Enviar Otra Postulación
            </button>
          </div>
        ) : (
          /* FORMULARIO DE POSTULACIÓN COMPLETO */
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-xs">
            
            {/* SECCIÓN 1: ESTATUTOS */}
            <div className="space-y-4 border-b border-slate-100 pb-6">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" />
                1. Estatutos
              </h3>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  ¿Acepta los estatutos, el reglamento interno y el código ético? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="aceptaEstatutos"
                      value="Sí, acepto"
                      checked={formData.aceptaEstatutos === 'Sí, acepto'}
                      onChange={(e) => setFormData({...formData, aceptaEstatutos: e.target.value})}
                      className="accent-blue-900"
                    />
                    <span>Sí, acepto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="aceptaEstatutos"
                      value="No acepto"
                      checked={formData.aceptaEstatutos === 'No acepto'}
                      onChange={(e) => setFormData({...formData, aceptaEstatutos: e.target.value})}
                      className="accent-blue-900"
                    />
                    <span>No acepto</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN PERSONAL Y MOTIVACIÓN */}
            <div className="space-y-6 border-b border-slate-100 pb-6">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-900" />
                2. Información Personal y Motivación
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Dra. María Paz Morales"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 15.482.910-K"
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono de contacto *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +56 9 8765 4321"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domicilio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Andres Bello 1230"
                    value={formData.domicilio}
                    onChange={(e) => setFormData({...formData, domicilio: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comuna *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: San Fabián de Alico"
                    value={formData.comuna}
                    onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Redes sociales (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: @instagram / linkedin"
                    value={formData.redesSociales}
                    onChange={(e) => setFormData({...formData, redesSociales: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profesión u ocupación *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Médico Veterinaria / Agrónoma"
                    value={formData.profesion}
                    onChange={(e) => setFormData({...formData, profesion: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nivel de estudios</label>
                  <select
                    value={formData.nivelEstudios}
                    onChange={(e) => setFormData({...formData, nivelEstudios: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  >
                    <option value="Educación Técnica">Educación Técnica</option>
                    <option value="Educación Superior Completa">Educación Superior Completa</option>
                    <option value="Magíster / Postgrado">Magíster / Postgrado</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Experiencia previa con animales, emergencias o voluntariado *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describa su experiencia previa..."
                  value={formData.experienciaPrevia}
                  onChange={(e) => setFormData({...formData, experienciaPrevia: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                />
              </div>

              {/* Formación Certificada */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Formación certificada *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Manejo animal",
                    "Rescate técnico animal",
                    "Primeros auxilios humanos",
                    "Primeros auxilios veterinarios",
                    "Gestión del riesgo / emergencias",
                    "Otra"
                  ].map((item) => (
                    <label key={item} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.formacionCertificada.includes(item)}
                        onChange={() => handleCheckboxChange('formacionCertificada', item)}
                        className="accent-blue-900"
                      />
                      <span className="text-[11px] font-semibold">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Razones para integrarse a PRUANED *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="¿Por qué le motiva integrarse a PRUANED?"
                  value={formData.razonesIntegracion}
                  onChange={(e) => setFormData({...formData, razonesIntegracion: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">¿Qué espera aportar a la organización? *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Aportes técnicos, operativos, de gestión..."
                  value={formData.aporteEsperado}
                  onChange={(e) => setFormData({...formData, aporteEsperado: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ¿Ha participado en organizaciones animalistas o de emergencia? *
                  </label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="haParticipadoOrgs"
                        value="Sí"
                        checked={formData.haParticipadoOrgs === 'Sí'}
                        onChange={(e) => setFormData({...formData, haParticipadoOrgs: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="haParticipadoOrgs"
                        value="No"
                        checked={formData.haParticipadoOrgs === 'No'}
                        onChange={(e) => setFormData({...formData, haParticipadoOrgs: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiempo mensual disponible *</label>
                  <select
                    value={formData.tiempoDisponible}
                    onChange={(e) => setFormData({...formData, tiempoDisponible: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  >
                    <option value="Menos de 4 horas">Menos de 4 horas</option>
                    <option value="4–8 horas">4–8 horas</option>
                    <option value="8–12 horas">8–12 horas</option>
                    <option value="Más de 12 horas">Más de 12 horas</option>
                  </select>
                </div>
              </div>

              {/* Áreas en las que desea participar */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Áreas en las que desea participar *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Capacitaciones",
                    "Actividades comunitarias",
                    "Activación en emergencias",
                    "Apoyo administrativo",
                    "Difusión y comunicaciones",
                    "Otra"
                  ].map((area) => (
                    <label key={area} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.areasParticipacion.includes(area)}
                        onChange={() => handleCheckboxChange('areasParticipacion', area)}
                        className="accent-blue-900"
                      />
                      <span className="text-[11px] font-semibold">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Aspectos Emocionales y Bienestar */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ¿Ha vivido experiencias emocionalmente complejas en emergencias? *
                    </label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="experienciasComplejas"
                          value="Sí"
                          checked={formData.experienciasComplejas === 'Sí'}
                          onChange={(e) => setFormData({...formData, experienciasComplejas: e.target.value})}
                          className="accent-blue-900"
                        />
                        <span>Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="experienciasComplejas"
                          value="No"
                          checked={formData.experienciasComplejas === 'No'}
                          onChange={(e) => setFormData({...formData, experienciasComplejas: e.target.value})}
                          className="accent-blue-900"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ¿Considera que podría necesitar apoyo para su bienestar? *
                    </label>
                    <select
                      value={formData.necesitaApoyoBienestar}
                      onChange={(e) => setFormData({...formData, necesitaApoyoBienestar: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                    >
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                      <option value="No lo sé">No lo sé</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Describa brevemente (si no aplica, escriba "No aplica") *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.descripcionExperiencias}
                    onChange={(e) => setFormData({...formData, descripcionExperiencias: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ¿Qué tipo de apoyo sería útil? (si no aplica, escriba "No aplica") *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tipoApoyoUtil}
                    onChange={(e) => setFormData({...formData, tipoApoyoUtil: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:border-blue-900"
                  />
                </div>
              </div>

              {/* Adjuntar Carta de Intención */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700">
                  Carta de intención (adjuntar archivo PDF o Word) *
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl cursor-pointer font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-900" />
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-slate-600 font-mono text-xs">
                    {formData.cartaIntencionNombre || 'Ningún archivo seleccionado'}
                  </span>
                </div>
              </div>

              {/* Declaraciones Finales */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Declaro que la información entregada es verídica *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="declaracionVeracidad"
                        value="Sí"
                        checked={formData.declaracionVeracidad === 'Sí'}
                        onChange={(e) => setFormData({...formData, declaracionVeracidad: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="declaracionVeracidad"
                        value="No"
                        checked={formData.declaracionVeracidad === 'No'}
                        onChange={(e) => setFormData({...formData, declaracionVeracidad: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Autorizo el uso de mis datos para fines internos *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autorizacionDatos"
                        value="Sí"
                        checked={formData.autorizacionDatos === 'Sí'}
                        onChange={(e) => setFormData({...formData, autorizacionDatos: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autorizacionDatos"
                        value="No"
                        checked={formData.autorizacionDatos === 'No'}
                        onChange={(e) => setFormData({...formData, autorizacionDatos: e.target.value})}
                        className="accent-blue-900"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Enviar Formulario */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              Enviar Postulación al Directorio Nacional
            </button>
          </form>
        )}

      </div>
    </section>
  );
};
