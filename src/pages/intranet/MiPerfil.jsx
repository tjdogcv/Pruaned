import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyDataPolicy } from '../../components/PrivacyDataPolicy';
import { CredencialDigitalModal } from '../../components/CredencialDigitalModal';
import { CertificadoAfiliacionModal } from '../../components/CertificadoAfiliacionModal';
import { sendPagoEmail } from '../../lib/emailConfig';
import { compressImage } from '../../lib/imageCompression';
import { uploadToSupabaseStorage } from '../../lib/storage';
import { 
  CheckCircle2, AlertCircle, Clock, Download, 
  Receipt, Save, User, Camera, Mail, Phone, MapPin, 
  Award, Scale, FileText, Check, ShieldCheck, UserCheck, Printer
} from 'lucide-react';

export default function MiPerfil() {
  const { 
    currentUser, 
    sociosList = [], 
    updateSocioPerfil, 
    updateSocioCuota,
    financialSettings = {},
    cobrosList = [],
    isMasterUser
  } = useAuth();

  const currentSocio = isMasterUser 
    ? { id: 'admin-master', nombre: 'Administrador Maestro', email: 'ag.pruaned@gmail.com', rut: 'ADMIN-0', categoria: 'Sistema', profesion: 'Soporte Gremial', fotoPerfil: '', estadoCuota: 'Al Día', mesesAdeudados: 0, historialPagos: [] } 
    : (sociosList.find(s => s.email?.toLowerCase() === currentUser?.email?.toLowerCase()) || {
        id: 'socio-temp',
        nombre: currentUser?.name || 'Socio PRUANED',
        email: currentUser?.email || '',
        rut: 'No registrado',
        categoria: 'Socio Activo',
        profesion: 'Profesional',
        estadoCuota: 'Al Día',
        mesesAdeudados: 0,
        historialPagos: []
      });

  const [editEmail, setEditEmail] = useState(currentSocio?.email || '');
  const [editTelefono, setEditTelefono] = useState(currentSocio?.telefono || '');
  const [editDomicilio, setEditDomicilio] = useState(currentSocio?.domicilio || '');
  const [editComuna, setEditComuna] = useState(currentSocio?.comuna || '');
  const [editRegion, setEditRegion] = useState(currentSocio?.region || '');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState(currentSocio?.fechaNacimiento || '');
  const [editEstadoCivil, setEditEstadoCivil] = useState(currentSocio?.estadoCivil || '');
  const [editProfesion, setEditProfesion] = useState(currentSocio?.profesion || '');
  const [editFotoPerfil, setEditFotoPerfil] = useState(currentSocio?.fotoPerfil || '');
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  const [activePaymentModal, setActivePaymentModal] = useState(false);
  const [comprobanteInput, setComprobanteInput] = useState('');
  const [isCuotaIncorporacionCheck, setIsCuotaIncorporacionCheck] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCredencialModalOpen, setIsCredencialModalOpen] = useState(false);
  const [isCertificadoModalOpen, setIsCertificadoModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const comprobanteFileRef = useRef(null);

  const cuotaMensual = financialSettings?.cuotaMensualActual || 5000;
  const cuotaIncorp = (currentSocio?.cuotaIncorporacionPagada || currentSocio?.estadoCuota === 'Exento') ? 0 : (financialSettings?.cuotaIncorporacionActual || 35000);

  // Cobros especiales pendientes
  const misCobrosPendientes = cobrosList.filter(c => c.socioId === currentSocio.id && !c.pagado);
  const totalCobrosEspeciales = misCobrosPendientes.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);

  // Cálculo de deuda
  const currentDate = new Date();
  const feeStartDate = new Date('2026-09-01');
  const isFeeActive = currentDate >= feeStartDate;
  const deudaCalculada = (currentSocio.estadoCuota === 'Exento' || (currentSocio.estadoCuota && currentSocio.estadoCuota.includes('Desvinculado'))) 
    ? 0 
    : ((isFeeActive ? (currentSocio.mesesAdeudados || 0) * cuotaMensual : 0) + cuotaIncorp + totalCobrosEspeciales);

  // Subir y comprimir foto de perfil con Supabase Storage
  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.8 });
      const storageUrl = await uploadToSupabaseStorage('perfiles', `socio_${currentSocio.id || 'avatar'}.webp`, compressedBase64);
      setEditFotoPerfil(storageUrl || compressedBase64);
    } catch (err) {
      alert('Error al procesar la imagen: ' + err.message);
    }
  };

  // Guardar cambios de perfil
  const handleSavePerfil = async (e) => {
    e.preventDefault();
    setIsSavingPerfil(true);
    try {
      const perfilData = {
        email: editEmail,
        telefono: editTelefono,
        domicilio: editDomicilio,
        comuna: editComuna,
        region: editRegion,
        fechaNacimiento: editFechaNacimiento,
        estadoCivil: editEstadoCivil,
        profesion: editProfesion,
        fotoPerfil: editFotoPerfil
      };
      await updateSocioPerfil(currentSocio.id, perfilData);
      alert('✓ Perfil actualizado correctamente');
    } catch (err) {
      alert('Error al guardar perfil: ' + err.message);
    } finally {
      setIsSavingPerfil(false);
    }
  };

  // Subir comprobante de pago
  const handleComprobanteUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 });
      const storageUrl = await uploadToSupabaseStorage('comprobantes', `pago_${currentSocio.id}_${Date.now()}.webp`, compressed);
      setComprobanteInput(storageUrl || compressed);
    } catch (err) {
      alert('Error al procesar el comprobante: ' + err.message);
    }
  };

  const handleEnviarPago = async (e) => {
    e.preventDefault();
    if (!comprobanteInput.trim()) {
      alert('Por favor adjunta el comprobante o ingresa el código de transferencia.');
      return;
    }
    try {
      await updateSocioCuota(currentSocio.id, 'Al Día', comprobanteInput, false, isCuotaIncorporacionCheck);
      await sendPagoEmail({
        monto: isCuotaIncorporacionCheck ? cuotaIncorp : cuotaMensual,
        mesesCancelados: isCuotaIncorporacionCheck ? 'Cuota de Incorporación' : '1 Mes',
        referencia: comprobanteInput.startsWith('http') ? comprobanteInput : 'Comprobante adjuntado'
      }, currentSocio);
      alert('✓ Comprobante enviado a Tesorería exitosamente.');
      setActivePaymentModal(false);
      setComprobanteInput('');
    } catch (err) {
      alert('Error al enviar pago: ' + err.message);
    }
  };

  // Exportar datos ARCO (Ley 19.628 / 21.719)
  const handleExportarDatosARCO = () => {
    const dataARCO = {
      titulo: "REGISTRO DE DATOS PERSONALES Y GREMIALES - PRUANED A.G.",
      marcoLegal: "Ley N° 19.628 sobre Protección de la Vida Privada y Ley N° 21.719",
      fechaExportacion: new Date().toISOString(),
      socio: {
        id: currentSocio.id,
        nombre: currentSocio.nombre,
        rut: currentSocio.rut,
        email: currentSocio.email,
        telefono: currentSocio.telefono || 'No informado',
        domicilio: currentSocio.domicilio || 'No informado',
        comuna: currentSocio.comuna || 'No informado',
        region: currentSocio.region || 'No informado',
        profesion: currentSocio.profesion || 'No informado',
        categoria: currentSocio.categoria,
        estadoCuota: currentSocio.estadoCuota,
        mesesAdeudados: currentSocio.mesesAdeudados,
        cuotaIncorporacionPagada: currentSocio.cuotaIncorporacionPagada,
        historialPagos: currentSocio.historialPagos || []
      }
    };
    const blob = new Blob([JSON.stringify(dataARCO, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Datos_ARCO_PRUANED_${currentSocio.rut || 'SOCIO'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 animate-fade-in font-['Plus_Jakarta_Sans']">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
            Portal Personal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-900" /> Mi Cuenta &amp; Ficha Gremial
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Administra tus datos de contacto, descarga tu credencial y revisa tu estado de cuotas.
          </p>
        </div>

        {/* Botones de Credencial y Certificado con QR */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCredencialModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            <UserCheck className="w-4 h-4" /> Credencial Oficial con QR
          </button>
          <button
            type="button"
            onClick={() => setIsCertificadoModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            <Award className="w-4 h-4" /> Certificado de Afiliación
          </button>
        </div>
      </div>

      {/* Grid Principal: Datos de Perfil + Estado Financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- FORMULARIO DATOS DE CONTACTO --- */}
        <form onSubmit={handleSavePerfil} className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                {editFotoPerfil ? (
                  <img src={editFotoPerfil} alt="Foto perfil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">{currentSocio.nombre}</h3>
              <p className="text-xs text-slate-500 font-mono font-bold">RUT: {currentSocio.rut}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">
                {currentSocio.categoria || 'Socio Activo'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono
              </label>
              <input
                type="tel"
                value={editTelefono}
                onChange={e => setEditTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Domicilio
              </label>
              <input
                type="text"
                value={editDomicilio}
                onChange={e => setEditDomicilio(e.target.value)}
                placeholder="Calle, número, depto / villa"
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Comuna</label>
              <input
                type="text"
                value={editComuna}
                onChange={e => setEditComuna(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Región</label>
              <input
                type="text"
                value={editRegion}
                onChange={e => setEditRegion(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profesión u Ocupación</label>
              <input
                type="text"
                value={editProfesion}
                onChange={e => setEditProfesion(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={editFechaNacimiento}
                onChange={e => setEditFechaNacimiento(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingPerfil}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {isSavingPerfil ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* --- PANEL ESTADO DE CUOTAS Y PAGOS --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Receipt className="w-4 h-4 text-emerald-600" /> Estado Financiero
              </h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                deudaCalculada === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {deudaCalculada === 0 ? 'Al Día' : 'Cuotas Pendientes'}
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Cuota mensual ordinaria:</span>
                <span className="font-bold text-slate-900">${cuotaMensual.toLocaleString('es-CL')}</span>
              </div>
              {cuotaIncorp > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-900">
                  <span>Cuota de incorporación:</span>
                  <span className="font-bold">${cuotaIncorp.toLocaleString('es-CL')}</span>
                </div>
              )}
              {totalCobrosEspeciales > 0 && (
                <div className="flex justify-between items-center text-xs text-purple-900">
                  <span>Cobros extraordinarios:</span>
                  <span className="font-bold">${totalCobrosEspeciales.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-800">Total a pagar:</span>
                <span className={deudaCalculada === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ${deudaCalculada.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Botón de Informar Pago */}
            <button
              type="button"
              onClick={() => setActivePaymentModal(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" /> Informar / Subir Comprobante de Pago
            </button>

            {/* Datos para transferencia */}
            <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5 font-mono">
              <p className="font-bold text-slate-700 font-sans">Datos de Transferencia Bancaria:</p>
              <p>Banco: Banco Estado</p>
              <p>Cuenta Corriente N°: 123456789</p>
              <p>RUT: 65.123.456-7</p>
              <p>Email: tesoreria@pruaned.cl</p>
            </div>
          </div>

          {/* DERECHOS ARCO (Ley 19.628 / 21.719) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Derechos ARCO &amp; Portabilidad</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Descarga una copia completa de toda tu información personal, bancaria y gremial almacenada en PRUANED en formato auditable.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportarDatosARCO}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Descargar mis datos (JSON)
              </button>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 text-center underline"
              >
                Ver Política de Tratamiento de Datos
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: SUBIR COMPROBANTE DE PAGO */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleEnviarPago} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" /> Informar Pago de Cuotas
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Adjunta la captura de tu transferencia bancaria o comprobante. Tesorería validará el depósito y tu cuenta quedará Al Día.
            </p>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Comprobante de Transferencia *</label>
              <input
                ref={comprobanteFileRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleComprobanteUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
              />
              {comprobanteInput && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Comprobante listo para enviar</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivePaymentModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Enviar a Tesorería
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREDENCIAL DIGITAL */}
      {isCredencialModalOpen && (
        <CredencialDigitalModal
          socio={currentSocio}
          onClose={() => setIsCredencialModalOpen(false)}
        />
      )}

      {/* MODAL: CERTIFICADO DE AFILIACIÓN */}
      {isCertificadoModalOpen && (
        <CertificadoAfiliacionModal
          socio={currentSocio}
          onClose={() => setIsCertificadoModalOpen(false)}
        />
      )}

      {/* MODAL: POLÍTICA DE PRIVACIDAD */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <PrivacyDataPolicy onClose={() => setIsPrivacyModalOpen(false)} />
        </div>
      )}

    </section>
  );
}
