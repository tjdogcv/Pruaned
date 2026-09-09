import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  sendMassivoEmail, 
  getMassivoTemplateId, 
  setMassivoTemplateId, 
  isValidEmail 
} from '../../lib/emailMasivo';
import {
  Mail, Send, Users, AlertCircle, CheckCircle2,
  Search, Filter, X, ChevronDown, Loader2,
  Settings, ShieldCheck, UserX, AlertTriangle, Check
} from 'lucide-react';

const CATEGORIAS_SOCIO = [
  'Todas las Categorías',
  'Socio Activo',
  'Socio Adherente',
  'Socio Honorario',
  'Estudiante/Pasante'
];

export default function ComunicacionesMasivas() {
  const { isMasterUser, isDirectiva, sociosList = [], voluntariosList = [], cobrosList = [] } = useAuth();
  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  // Audiencia Principal: 'socios' | 'voluntarios' | 'ambos'
  const [targetGroup, setTargetGroup] = useState('socios');
  
  // Filtros específicos para Socios
  const [socioEstadoFilter, setSocioEstadoFilter] = useState('todos'); // 'todos' | 'al_dia' | 'morosos'
  const [socioCategoriaFilter, setSocioCategoriaFilter] = useState('Todas las Categorías');
  
  // Búsqueda en destinatarios
  const [searchDest, setSearchDest] = useState('');

  // Mensaje
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Configuración de Plantilla EmailJS
  const [templateId, setTemplateId] = useState(getMassivoTemplateId);
  const [showConfig, setShowConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Estado de envío
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Guardar ID de Plantilla EmailJS
  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (templateId.trim()) {
      setMassivoTemplateId(templateId.trim());
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    }
  };

  // Helper para verificar si un socio ha renunciado o está desvinculado (REGLA DE ORO)
  const isSocioRenunciado = (s) => {
    if (!s) return false;
    const estadoCuota = (s.estadoCuota || '').toLowerCase();
    const estado = (s.estado || '').toLowerCase();
    const motivo = (s.motivoRenuncia || '').trim();
    const solRenuncia = (s.fechaSolicitudRenuncia || '').trim();
    const retOficial = (s.fechaRetiroOficial || '').trim();

    return (
      estadoCuota.includes('desvinculad') ||
      estadoCuota.includes('renuncia') ||
      estadoCuota.includes('retiro') ||
      estadoCuota.includes('baja') ||
      estadoCuota.includes('expuls') ||
      estado.includes('desvinculad') ||
      estado.includes('renuncia') ||
      estado.includes('inactiv') ||
      Boolean(motivo) ||
      Boolean(solRenuncia) ||
      Boolean(retOficial)
    );
  };

  // Helper para verificar si un socio activo está moroso
  const isSocioMoroso = (s) => {
    if (isSocioRenunciado(s) || s.estadoCuota === 'Exento' || s.categoria === 'Socio Honorario') return false;
    const estadoCuota = (s.estadoCuota || '').toLowerCase();
    const pendingCuotasEmitidas = cobrosList.filter(
      c => c.socioId === s.id && !c.pagado && c.titulo?.toLowerCase().startsWith('cuota')
    ).length;
    const meses = Math.max(Number(s.mesesAdeudados || 0), pendingCuotasEmitidas);
    return estadoCuota.includes('mora') || estadoCuota.includes('moros') || estadoCuota.includes('deudor') || meses > 0;
  };

  // Socios renunciados excluidos en total
  const totalRenunciadosExcluidos = useMemo(() => {
    return sociosList.filter(isSocioRenunciado).length;
  }, [sociosList]);

  // Cálculo de Destinatarios y Detección de Correos Inválidos
  const { destinatariosValidos, correosInvalidos } = useMemo(() => {
    let pool = [];

    // 1. Incorporar Socios (si la audiencia es 'socios' o 'ambos')
    if (targetGroup === 'socios' || targetGroup === 'ambos') {
      const filteredSocios = sociosList.filter(s => {
        // NUNCA incluir socios renunciados o institucionales
        if (isSocioRenunciado(s)) return false;
        if (s.email === 'ag.pruaned@gmail.com') return false;

        // Filtro por Estado de Pago
        if (socioEstadoFilter === 'morosos' && !isSocioMoroso(s)) return false;
        if (socioEstadoFilter === 'al_dia' && isSocioMoroso(s)) return false;

        // Filtro por Categoría
        if (socioCategoriaFilter !== 'Todas las Categorías' && s.categoria !== socioCategoriaFilter) return false;

        return true;
      }).map(s => ({
        id: `socio-${s.id}`,
        nombre: s.nombre || s.nombreCompleto || 'Socio PRUANED',
        email: (s.email || '').trim(),
        tipo: 'Socio',
        categoria: s.categoria || 'Activo',
        estadoCuota: isSocioMoroso(s) ? 'Moroso' : 'Al Día'
      }));

      pool.push(...filteredSocios);
    }

    // 2. Incorporar Voluntarios (si la audiencia es 'voluntarios' o 'ambos')
    if (targetGroup === 'voluntarios' || targetGroup === 'ambos') {
      const filteredVoluntarios = voluntariosList.filter(v => {
        const est = (v.estado || '').toLowerCase();
        return est !== 'rechazado' && est !== 'inactivo' && est !== 'desvinculado';
      }).map(v => ({
        id: `vol-${v.id}`,
        nombre: v.nombre || v.nombreCompleto || 'Voluntario/a PRUANED',
        email: (v.email || '').trim(),
        tipo: 'Voluntario',
        categoria: 'Voluntariado',
        estadoCuota: 'N/A'
      }));

      pool.push(...filteredVoluntarios);
    }

    // Deduplicar por email en caso de que alguien sea socio y voluntario a la vez
    const seenEmails = new Set();
    const uniquePool = [];
    for (const item of pool) {
      const lower = item.email.toLowerCase();
      if (!seenEmails.has(lower)) {
        seenEmails.add(lower);
        uniquePool.push(item);
      }
    }

    // Filtro por texto de búsqueda
    let searched = uniquePool;
    if (searchDest.trim()) {
      const q = searchDest.toLowerCase();
      searched = uniquePool.filter(r => 
        r.nombre.toLowerCase().includes(q) || 
        r.email.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q)
      );
    }

    // Separar válidos de inválidos para máxima seguridad
    const validos = [];
    const invalidos = [];

    searched.forEach(item => {
      if (isValidEmail(item.email)) {
        validos.push(item);
      } else if (item.email) {
        invalidos.push(item);
      }
    });

    return {
      destinatariosValidos: validos,
      correosInvalidos: invalidos
    };
  }, [
    targetGroup, 
    socioEstadoFilter, 
    socioCategoriaFilter, 
    searchDest, 
    sociosList, 
    voluntariosList, 
    cobrosList
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!templateId.trim()) {
      setShowConfig(true);
      alert('Debes configurar e ingresar el ID de la plantilla de EmailJS para correos masivos antes de realizar el envío.');
      return;
    }
    if (!subject.trim() || !body.trim()) return;
    if (destinatariosValidos.length === 0) {
      alert('No hay destinatarios con correo válido en la selección actual.');
      return;
    }
    
    const confirmText = `¿Confirmas el envío de este correo a ${destinatariosValidos.length} destinatario(s) mediante EmailJS (Plantilla: ${templateId})?`;
    if (!window.confirm(confirmText)) return;

    setIsSending(true);
    setResult(null);
    setProgress({ current: 0, total: destinatariosValidos.length });

    try {
      const res = await sendMassivoEmail(
        destinatariosValidos,
        subject.trim(),
        body.trim(),
        (current, total) => setProgress({ current, total }),
        templateId
      );
      setResult(res);
    } catch (err) {
      setResult({ 
        sent: 0, 
        failed: destinatariosValidos.length, 
        errors: [{ email: 'general', error: err.message || 'Error general en el envío' }] 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="space-y-6 animate-fade-in font-['Plus_Jakarta_Sans'] pb-12">
      
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
            Comunicaciones Oficiales
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-900" /> Emisión de Correos Masivos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Envía convocatorias, informativos y cobranzas dirigidas a socios o voluntarios de PRUANED A.G.
          </p>
        </div>

        {/* Botón de Ajustes de Plantilla EmailJS */}
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Configuración EmailJS ({templateId})</span>
        </button>
      </div>

      {/* Caja de Ajustes EmailJS (Desplegable) */}
      {showConfig && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm font-['Outfit']">Configuración de Plantilla EmailJS</h3>
            </div>
            <button 
              type="button" 
              onClick={() => setShowConfig(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕ Cerrar
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Actualmente está configurada la plantilla activa <code className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">{templateId}</code>. 
            Si creas una plantilla personalizada en tu cuenta de EmailJS, puedes actualizar su ID aquí:
          </p>

          <form onSubmit={handleSaveTemplate} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              required
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="Ej: template_mxedl3t o tu nuevo template ID"
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 min-w-[280px]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              {configSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              {configSaved ? '¡Guardado con éxito!' : 'Guardar Plantilla'}
            </button>
            <button
              type="button"
              onClick={() => { setTemplateId('template_mxedl3t'); setMassivoTemplateId('template_mxedl3t'); }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Restablecer a template_mxedl3t
            </button>
          </form>
        </div>
      )}

      {/* Alerta de Correos Inválidos detectados */}
      {correosInvalidos.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Se detectaron {correosInvalidos.length} socio(s) con correo mal escrito o incompleto en el padrón:
            </p>
            <p className="text-[11px] text-amber-800 font-mono">
              {correosInvalidos.map(c => `${c.nombre} (${c.email})`).join(' · ')}
            </p>
            <p className="text-[11px] text-amber-700">
              🛡️ Por seguridad y para evitar rechazos de EmailJS, estos correos fueron excluidos automáticamente del envío.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- PANEL DE DESTINATARIOS Y FILTROS --- */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-700" /> 1. Selección de Destinatarios
            </h3>
            <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full">
              {destinatariosValidos.length} destinatarios
            </span>
          </div>

          {/* Selector de Audiencia Principal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wide">
              ¿A quién deseas enviar el correo?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'socios', label: 'Solo Socios' },
                { id: 'voluntarios', label: 'Solo Voluntarios' },
                { id: 'ambos', label: 'Socios y Voluntarios' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { setTargetGroup(g.id); setResult(null); }}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    targetGroup === g.id
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros específicos de Socios (visibles si targetGroup es 'socios' o 'ambos') */}
          {(targetGroup === 'socios' || targetGroup === 'ambos') && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-700" /> Filtros para Socios
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Renunciados excluidos: {totalRenunciadosExcluidos}
                </span>
              </div>

              {/* Subfiltro Estado de Cuota / Pagos */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                  Estado de Cuota del Socio
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'todos', label: 'Todos los Socios' },
                    { id: 'al_dia', label: 'Solo Al Día' },
                    { id: 'morosos', label: 'Solo Morosos' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSocioEstadoFilter(st.id)}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                        socioEstadoFilter === st.id
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subfiltro Categoría */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
                  Categoría de Membresía
                </label>
                <select
                  value={socioCategoriaFilter}
                  onChange={(e) => setSocioCategoriaFilter(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 outline-none focus:border-blue-500"
                >
                  {CATEGORIAS_SOCIO.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Nota de Exclusión DL 2757 */}
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Socios con renuncia o desvinculación formal quedan excluidos automáticamente.</span>
              </div>
            </div>
          )}

          {/* Buscador de Destinatarios */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              placeholder="Buscar por nombre, correo o categoría..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 font-medium"
            />
          </div>

          {/* Lista Previa de Destinatarios */}
          <div className="border border-slate-100 rounded-2xl max-h-64 overflow-y-auto divide-y divide-slate-100">
            {destinatariosValidos.length === 0 ? (
              <div className="text-center py-8 px-4">
                <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No hay destinatarios válidos con estos filtros.</p>
              </div>
            ) : (
              destinatariosValidos.map((d, index) => (
                <div key={d.id || index} className="flex items-center justify-between gap-2 px-3.5 py-2 hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-extrabold text-[10px] flex-shrink-0">
                      {(d.nombre || d.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">{d.nombre}</p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">{d.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {d.tipo}
                    </span>
                    {d.estadoCuota !== 'N/A' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        d.estadoCuota === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.estadoCuota}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-blue-900 bg-blue-50/80 rounded-xl px-4 py-2.5">
            <span>Total destinatarios listos:</span>
            <span className="text-sm font-extrabold">{destinatariosValidos.length}</span>
          </div>

        </div>

        {/* --- PANEL DE REDACCIÓN DEL MENSAJE --- */}
        <form onSubmit={handleSend} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Mail className="w-4 h-4 text-blue-700" /> 2. Redacción del Comunicado
            </h3>
            <span className="text-xs text-slate-400 font-mono">Template: {templateId}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Asunto del correo *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Convocatoria Asamblea Ordinaria de Socios — PRUANED A.G."
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 bg-slate-50 font-medium text-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Cuerpo del mensaje *
              </label>
              <span className="text-[11px] text-slate-400">
                Se enviará de forma individual a cada correo
              </span>
            </div>
            <textarea
              required
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Estimados/as socios y voluntariado,\n\nPor medio del presente correo, los convocamos a la reunión online programada para el día...\n\nAtentamente,\nDirectorio Nacional PRUANED A.G.`}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-slate-50 resize-none font-sans text-slate-800 leading-relaxed"
            />
          </div>

          {/* Barra de Progreso en Envío */}
          {isSending && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> 
                  Enviando correos vía EmailJS...
                </span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2.5 bg-blue-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Resumen del Resultado */}
          {result && (
            <div className={`rounded-2xl p-4 border ${
              result.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <p className="font-bold text-sm flex items-center gap-2">
                {result.failed === 0 ? (
                  <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Envío finalizado con éxito</>
                ) : (
                  <><AlertCircle className="w-5 h-5 text-amber-600" /> Proceso completado con algunas observaciones</>
                )}
              </p>
              <p className="text-xs mt-1">
                ✓ Enviados correctamente: <strong>{result.sent}</strong> &nbsp;|&nbsp; ✗ Fallidos: <strong>{result.failed}</strong>
              </p>
              {result.errors?.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer font-bold text-amber-800">Ver detalle de errores</summary>
                  <ul className="mt-1 space-y-1 font-mono text-[11px] bg-white/80 p-2 rounded-lg border border-amber-200">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e.email}: {e.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!subject.trim() || !body.trim()}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Vista Previa
            </button>
            <button
              type="submit"
              disabled={isSending || destinatariosValidos.length === 0 || !subject.trim() || !body.trim()}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-md disabled:opacity-40 flex items-center gap-2 transition"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              ) : (
                <><Send className="w-4 h-4" /> Enviar a {destinatariosValidos.length} Destinatario(s)</>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* MODAL DE VISTA PREVIA */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-700" />
                <h4 className="font-extrabold text-slate-900 text-lg font-['Outfit']">Vista Previa de la Comunicación</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-wrap gap-2 text-slate-600">
                <span className="font-bold text-slate-800">Audiencia:</span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-bold">
                  {targetGroup === 'socios' ? 'Solo Socios' : targetGroup === 'voluntarios' ? 'Solo Voluntarios' : 'Socios y Voluntarios'}
                </span>
                {targetGroup !== 'voluntarios' && (
                  <>
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                      {socioEstadoFilter === 'todos' ? 'Todos' : socioEstadoFilter === 'al_dia' ? 'Al Día' : 'Morosos'}
                    </span>
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                      {socioCategoriaFilter}
                    </span>
                  </>
                )}
              </div>

              <div className="text-slate-600">
                <span className="font-bold text-slate-800">Destinatarios ({destinatariosValidos.length}):</span>
                <p className="mt-1 font-mono text-[11px] text-slate-500 line-clamp-3">
                  {destinatariosValidos.map(d => d.email).join(', ')}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-800">Asunto:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{subject}</p>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-800">Mensaje:</span>
                <div className="mt-2 bg-white p-4 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                  {body}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Plantilla configurada: {templateId}</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
