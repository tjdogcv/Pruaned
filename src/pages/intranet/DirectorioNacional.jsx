import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SocioSearchSelect } from './SociosDirectory';
import {
  ClipboardList,
  UserX,
  Crown,
  Award,
  FileText,
  DollarSign,
  PenTool,
  FileCheck2,
  Check,
  X,
  AlertCircle,
  Wallet
} from 'lucide-react';

export default function DirectorioNacional() {
  const { 
    isMasterUser, 
    isDirectiva,
    canManageCategoriesAndCargos,
    sociosList,
    updateDirectorioCargo,
    getDirectorioMember,
    firmasOficiales,
    updateFirmaOficial,
    canManageFinances,
    solicitarRenunciaSocio,
    aprobarRenunciaDirectorio,
    currentUser
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('directorio-gestion');

  const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');
  const [actaDirectorioInput, setActaDirectorioInput] = useState('');

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setActiveRequestRenunciaModal(null);
      setActiveApproveRenunciaModal(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeRequestRenunciaModal, activeApproveRenunciaModal]);

  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  const presidente = getDirectorioMember('presidenteId');
  const vicepresidente = getDirectorioMember('vicepresidenteId');
  const secretario = getDirectorioMember('secretarioId');
  const tesorero = getDirectorioMember('tesoreroId');

  const handleFileUploadFirma = (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFirmaOficial(cargoKey, reader.result);
        alert(`¡Firma digitalizada de ${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolicitarRenunciaSubmit = (e) => {
    e.preventDefault();
    const isOwnRequest = activeRequestRenunciaModal?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
    if (activeRequestRenunciaModal && isOwnRequest && motivoRenunciaInput.trim()) {
      solicitarRenunciaSocio(activeRequestRenunciaModal.id, motivoRenunciaInput.trim());
      setActiveRequestRenunciaModal(null);
      setMotivoRenunciaInput('');
      alert('¡Solicitud de renuncia enviada al Directorio Nacional!');
    }
  };


  const handleAprobarRenunciaSubmit = (e) => {
    e.preventDefault();
    if (activeApproveRenunciaModal && canManageFinances) {
      aprobarRenunciaDirectorio(activeApproveRenunciaModal.id, actaDirectorioInput.trim());
      setActiveApproveRenunciaModal(null);
      setActaDirectorioInput('');
      alert('¡Renuncia aprobada formalmente por el Directorio Nacional!');
    }
  };

  const handleApproveApplicant = async (postId, categoriaAsignada) => {
    updatePostulacionEstado(postId, 'Aceptada / Incorporado', categoriaAsignada);
    const post = postulacionesList.find(p => p.id === postId);
    if (post) {
      await sendApprovalEmail(post).catch(console.error);
    }
    setActivePostulacionModal(null);
    alert('¡Postulante incorporado exitosamente al Padrón Oficial de Socios!');
  };

  const handleRejectApplicant = async (postId) => {
    if (window.confirm("¿Está seguro que desea rechazar esta postulación? Esta acción enviará un correo notificando al postulante.")) {
      updatePostulacionEstado(postId, 'Rechazada');
      const post = postulacionesList.find(p => p.id === postId);
      if (post) {
        await sendRejectionEmail(post).catch(console.error);
      }
      setActivePostulacionModal(null);
      alert('Postulación rechazada. Se ha notificado al postulante.');
    }
  };



  const currentSocio = isMasterUser 
    ? { nombre: 'Administrador Maestro', email: 'ag.pruaned@gmail.com', rut: 'ADMIN-0', categoria: 'Sistema', profesion: 'Soporte Gremial', fotoPerfil: '' } 
    : (sociosList.find(s => s.email === currentUser?.email) || {});

  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;

  return (
    <section className="min-h-screen bg-slate-50 py-2 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-slate-200 pb-0">
          <div className="max-w-2xl pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Directorio nacional</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Cargos y firmas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Gestiona la representación institucional y sus firmas oficiales.</p>
          </div>

          <nav className="flex gap-1 overflow-x-auto" aria-label="Opciones">
            <button
              type="button"
              onClick={() => setActiveTabLocal('directorio-gestion')}
              aria-current={activeTabLocal === 'directorio-gestion' ? 'page' : undefined}
              className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${activeTabLocal === 'directorio-gestion' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Cargos y firmas
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('renuncias')}
              aria-current={activeTabLocal === 'renuncias' ? 'page' : undefined}
              className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${activeTabLocal === 'renuncias' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
            >
              <UserX className="h-4 w-4" aria-hidden="true" />
              Renuncias
              {renunciasPendientes > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">{renunciasPendientes}</span>}
            </button>
          </nav>
        </header>

        {activeTabLocal === 'directorio-gestion' && canManageCategoriesAndCargos && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            
            {/* Panel 1: Cargos Directivos */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full uppercase">
                  Atribución Presidente / Secretario (Fe Pública)
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Asignación Oficial de Cargos del Directorio Nacional
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Presidente / a</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={presidente?.fotoPerfil} alt={presidente?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{presidente?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{presidente?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={presidente?.id}
                    onSelect={(id) => updateDirectorioCargo('presidenteId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Vicepresidente / a</span>
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={vicepresidente?.fotoPerfil} alt={vicepresidente?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{vicepresidente?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{vicepresidente?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={vicepresidente?.id}
                    onSelect={(id) => updateDirectorioCargo('vicepresidenteId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Secretario / a</span>
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={secretario?.fotoPerfil} alt={secretario?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{secretario?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{secretario?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={secretario?.id}
                    onSelect={(id) => updateDirectorioCargo('secretarioId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase">Tesorero / a</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={tesorero?.fotoPerfil} alt={tesorero?.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-blue-900" />
                    <div>
                      <div className="font-bold text-slate-900">{tesorero?.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tesorero?.email}</div>
                    </div>
                  </div>
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={tesorero?.id}
                    onSelect={(id) => updateDirectorioCargo('tesoreroId', id)}
                    label="Reasignar Cargo a Socio:"
                  />
                </div>

              </div>
            </div>

            {/* Panel 2: Digitalización de Firmas Escaneadas */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase">
                  Acreditación de Documentos & Certificados
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-900" />
                  Digitalización y Carga de Firmas Escaneadas (PNG Transparente)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suba los archivos de firma digitalizada del Presidente/a y Secretario/a. Se estamparán automáticamente en los Certificados QR y actas institucionales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                
                {/* Firma Presidente */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900">Firma Digital Presidente/a</div>
                  <div className="h-20 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                    {firmasOficiales?.presidenteFirma ? (
                      <img src={firmasOficiales.presidenteFirma} alt="Firma Presidente" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin firma digitalizada</span>
                    )}
                  </div>
                  <label className="block bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-center cursor-pointer shadow">
                    <span>Subir Imagen de Firma (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUploadFirma('presidenteFirma', e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Firma Secretario */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900">Firma Digital Secretario/a</div>
                  <div className="h-20 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2">
                    {firmasOficiales?.secretarioFirma ? (
                      <img src={firmasOficiales.secretarioFirma} alt="Firma Secretario" className="max-h-16 object-contain" />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sin firma digitalizada</span>
                    )}
                  </div>
                  <label className="block bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl text-center cursor-pointer shadow">
                    <span>Subir Imagen de Firma (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUploadFirma('secretarioFirma', e)}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTabLocal === 'renuncias' && (
          <div className="space-y-6 animate-fade-in">
            {canManageFinances ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600" />
                  Solicitudes de Renuncia & Desvinculación Voluntaria (DL N° 2.757)
                </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sociosList.filter(s => s.estadoCuota.includes('Renuncia') || s.estadoCuota.includes('Desvinculado')).length ? sociosList.filter(s => s.estadoCuota.includes('Renuncia') || s.estadoCuota.includes('Desvinculado')).map((soc) => (
                  <div key={soc.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-full font-mono">
                          {soc.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">
                          {soc.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{soc.rut} • {soc.email}</p>
                      </div>
                      <span className={`badge-inst ${
                        soc.estadoCuota.includes('Aprobado') ? 'badge-green' : 'badge-amber'
                      }`}>
                        {soc.estadoCuota}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <div>• <strong>Fecha Solicitud:</strong> {soc.fechaSolicitudRenuncia || 'Sin fecha registrada'}</div>
                      <div>• <strong>Motivo Expresado:</strong> {soc.motivoRenuncia || 'Sin motivo registrado'}</div>
                      {soc.actaDirectorioAprobacion && (
                        <div>• <strong>Acta Aprobación Directorio:</strong> <span className="font-bold text-emerald-800">{soc.actaDirectorioAprobacion}</span></div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      {soc.estadoCuota === 'Solicitud Renuncia Pendiente Directorio' && (
                        <button
                          onClick={() => setActiveApproveRenunciaModal(soc)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Revisar y aprobar
                        </button>
                      )}
                    </div>
                  </div>
                )) : <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">No hay solicitudes de renuncia ni desvinculaciones registradas.</div>}
              </div>
            </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 font-['Outfit'] mb-4 flex justify-center items-center gap-2">
                  <FileCheck2 className="w-6 h-6 text-rose-600" />
                  Solicitar Mi Renuncia
                </h3>
                <p className="text-slate-600 mb-6">
                  Si deseas desvincularte de PRUANED A.G. conforme a los estatutos, puedes enviar una solicitud formal de renuncia.
                  Esta será revisada y ratificada por el Directorio Nacional.
                </p>
                {currentSocio.estadoCuota === 'Solicitud Renuncia Pendiente Directorio' ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
                    <p className="font-bold">Solicitud enviada al Directorio</p>
                    <p className="mt-1">Fecha: {currentSocio.fechaSolicitudRenuncia || 'Sin fecha registrada'}</p>
                    <p className="mt-1">Motivo: {currentSocio.motivoRenuncia || 'Sin motivo registrado'}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveRequestRenunciaModal(currentSocio)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Solicitar Renuncia Gremial
                  </button>
                )}
              </div>
            )}
          </div>

        )}
      </div>

      {activeRequestRenunciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="resignation-request-dialog-title" aria-describedby="resignation-request-dialog-description" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">Solicitud personal</p>
                <h3 id="resignation-request-dialog-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Solicitar mi renuncia</h3>
              </div>
              <button type="button" onClick={() => { setActiveRequestRenunciaModal(null); setMotivoRenunciaInput(''); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" aria-label="Cerrar solicitud de renuncia"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleSolicitarRenunciaSubmit} className="space-y-5 pt-5">
              <p id="resignation-request-dialog-description" className="text-sm leading-6 text-slate-600">La solicitud se enviará al Directorio Nacional para revisión. No se aprueba ni desvincula tu cuenta automáticamente.</p>
              <label className="block text-sm font-bold text-slate-800" htmlFor="resignation-reason">Motivo de la solicitud</label>
              <textarea id="resignation-reason" autoFocus required rows={5} value={motivoRenunciaInput} onChange={event => setMotivoRenunciaInput(event.target.value)} placeholder="Describe brevemente el motivo de tu solicitud." className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-100" />
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setActiveRequestRenunciaModal(null); setMotivoRenunciaInput(''); }} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">Cancelar</button>
                <button type="submit" className="min-h-11 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">Enviar solicitud</button>
              </div>
            </form>
          </section>
        </div>
        )}

      {activeApproveRenunciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="resignation-approval-dialog-title" aria-describedby="resignation-approval-dialog-description" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Revisión de Directorio</p>
                <h3 id="resignation-approval-dialog-title" className="mt-1 font-['Outfit'] text-xl font-extrabold text-slate-950">Revisar y aprobar renuncia</h3>
              </div>
              <button type="button" onClick={() => { setActiveApproveRenunciaModal(null); setActaDirectorioInput(''); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" aria-label="Cerrar revisión de renuncia"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleAprobarRenunciaSubmit} className="space-y-5 pt-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{activeApproveRenunciaModal.nombre}</p><p className="mt-2">Motivo: {activeApproveRenunciaModal.motivoRenuncia || 'Sin motivo registrado'}</p><p className="mt-1">Solicitud: {activeApproveRenunciaModal.fechaSolicitudRenuncia || 'Sin fecha registrada'}</p></div>
              <p id="resignation-approval-dialog-description" className="text-sm leading-6 text-slate-600">Esta acción registra la aprobación institucional y la desvinculación. Verifica el acta antes de confirmar.</p>
              <label className="block text-sm font-bold text-slate-800" htmlFor="board-minutes">Referencia de acta de Directorio</label>
              <input id="board-minutes" autoFocus required value={actaDirectorioInput} onChange={event => setActaDirectorioInput(event.target.value)} placeholder="Ej. Acta ordinaria N.º 12, 15/08/2026" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100" />
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setActiveApproveRenunciaModal(null); setActaDirectorioInput(''); }} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">Cancelar</button>
                <button type="submit" className="min-h-11 rounded-xl bg-amber-700 px-5 text-sm font-bold text-white hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Aprobar renuncia</button>
              </div>
            </form>
          </section>
        </div>
        )}
    </section>
  );
}
