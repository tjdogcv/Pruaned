import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendApprovalEmail, sendRejectionEmail } from '../../lib/emailConfig';
import { 
  UserPlus, 
  ShieldCheck, 
  Eye, 
  FileText, 
  X, 
  Check 
} from 'lucide-react';

export default function PostulacionesSocios() {
  const { 
    isMasterUser, 
    isDirectiva, 
    canManageFinances, 
    postulacionesList, 
    sociosList, 
    updatePostulacionEstado 
  } = useAuth();

  const [postFilter, setPostFilter] = useState('pendientes');
  const [activePostulacionModal, setActivePostulacionModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  const handleApproveApplicant = async (postId, categoriaAsignada) => {
    setIsProcessing(true);
    try {
      await updatePostulacionEstado(postId, 'Aceptada / Incorporado', categoriaAsignada);
      const post = postulacionesList.find(p => p.id === postId);
      if (post) {
        await sendApprovalEmail(post).catch(console.error);
      }
      setActivePostulacionModal(null);
      alert('¡Postulante incorporado exitosamente al Padrón Oficial de Socios!');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al procesar la aprobación.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplicant = async (postId) => {
    if (window.confirm("¿Está seguro que desea rechazar esta postulación? Esta acción enviará un correo notificando al postulante.")) {
      setIsProcessing(true);
      try {
        await updatePostulacionEstado(postId, 'Rechazada');
        const post = postulacionesList.find(p => p.id === postId);
        if (post) {
          await sendRejectionEmail(post).catch(console.error);
        }
        setActivePostulacionModal(null);
        alert('Postulación rechazada. Se ha notificado al postulante.');
      } catch (error) {
        console.error(error);
        alert('Hubo un error al rechazar la postulación.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pendientes = postulacionesList.filter(p => p.estado === 'Pendiente Revisión Directorio');
  const aprobadas  = postulacionesList.filter(p => p.estado === 'Aceptada / Incorporado');
  const rechazadas = postulacionesList.filter(p => p.estado === 'Rechazada');
  const listaFiltrada = postFilter === 'pendientes' ? pendientes
    : postFilter === 'aprobadas' ? aprobadas
    : rechazadas;

  return (
    <section className="min-h-screen bg-slate-50 py-2 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-6 pt-4">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Administración financiera</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Postulaciones</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Revisa las postulaciones de nuevos socios.</p>
          </div>
        </header>

        {canManageFinances && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-900" />
                  Archivo de Postulaciones
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                  <button
                    onClick={() => setPostFilter('pendientes')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'pendientes' ? 'bg-amber-500 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Pendientes
                    {pendientes.length > 0 && <span className="bg-white text-amber-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{pendientes.length}</span>}
                  </button>
                  <button
                    onClick={() => setPostFilter('aprobadas')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'aprobadas' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Aprobadas
                    {aprobadas.length > 0 && <span className="bg-white text-emerald-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{aprobadas.length}</span>}
                  </button>
                  <button
                    onClick={() => setPostFilter('rechazadas')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${ postFilter === 'rechazadas' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Rechazadas
                    {rechazadas.length > 0 && <span className="bg-white text-rose-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{rechazadas.length}</span>}
                  </button>
                </div>
              </div>

              {listaFiltrada.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No hay postulaciones en esta categoría.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listaFiltrada.map((post) => {
                    const socioVinculado = post.estado === 'Aceptada / Incorporado'
                      ? sociosList.find(s => s.rut === post.rut || s.email === post.email)
                      : null;
                    return (
                      <div key={post.id} className={`p-5 rounded-xl border space-y-3 ${
                        post.estado === 'Aceptada / Incorporado' ? 'bg-emerald-50 border-emerald-200'
                        : post.estado === 'Rechazada' ? 'bg-rose-50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full">{post.id}</span>
                            <h4 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">{post.nombreCompleto}</h4>
                            <p className="text-xs text-slate-500 font-mono">{post.rut} • {post.email}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Enviada: {post.fechaEnvio}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            post.estado === 'Aceptada / Incorporado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : post.estado === 'Rechazada' ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>{post.estado}</span>
                        </div>

                        {socioVinculado && (
                          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-100 rounded-lg px-3 py-1.5 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Socio incorporado: <strong>{socioVinculado.nombre}</strong> — {socioVinculado.categoria}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200">
                          <button
                            onClick={() => setActivePostulacionModal(post)}
                            className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Ficha Completa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* POSTULACION MODAL */}
        {activePostulacionModal && (() => {
          const socioVinculado = activePostulacionModal.estado === 'Aceptada / Incorporado'
            ? sociosList.find(s => s.rut === activePostulacionModal.rut || s.email === activePostulacionModal.email)
            : null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Outfit']">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setActivePostulacionModal(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-900" />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Ficha de Postulación</h3>
                      <p className="text-xs text-slate-400 font-mono">{activePostulacionModal.id} — Enviada el {activePostulacionModal.fechaEnvio}</p>
                    </div>
                  </div>
                  <span className={`mt-3 inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                    activePostulacionModal.estado === 'Aceptada / Incorporado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : activePostulacionModal.estado === 'Rechazada' ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>{activePostulacionModal.estado}</span>
                </div>

                {socioVinculado && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Socio Incorporado Vinculado</p>
                      <p className="text-xs text-emerald-600">{socioVinculado.nombre} — {socioVinculado.categoria} — Ingreso: {socioVinculado.fechaIngreso}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-sm text-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Nombre Completo</span>{activePostulacionModal.nombreCompleto}</div>
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">RUT</span>{activePostulacionModal.rut}</div>
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Email</span>{activePostulacionModal.email}</div>
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Teléfono</span>{activePostulacionModal.telefono || '-'}</div>
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Profesión</span>{activePostulacionModal.profesion}</div>
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Comuna</span>{activePostulacionModal.comuna}</div>
                  </div>
                  {activePostulacionModal.razonesIntegracion && (
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Razones de Integración</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.razonesIntegracion}</p></div>
                  )}
                  {activePostulacionModal.aporteEsperado && (
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Aporte Esperado</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.aporteEsperado}</p></div>
                  )}
                  {activePostulacionModal.experienciaPrevia && (
                    <div><span className="font-bold text-slate-400 text-xs uppercase block">Experiencia Previa</span><p className="mt-1 p-3 bg-slate-50 rounded-lg text-xs leading-relaxed border border-slate-200">{activePostulacionModal.experienciaPrevia}</p></div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                  <button
                    onClick={() => setActivePostulacionModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cerrar
                  </button>
                  {activePostulacionModal.estado === 'Pendiente Revisión Directorio' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { handleRejectApplicant(activePostulacionModal.id); }}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                      >
                        {isProcessing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <X className="w-4 h-4" />} Rechazar
                      </button>
                      <button
                        onClick={() => { handleApproveApplicant(activePostulacionModal.id, 'Socio Activo'); }}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                      >
                        {isProcessing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Check className="w-4 h-4" />} Aprobar e Incorporar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </section>
  );
}

