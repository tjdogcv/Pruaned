import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendPagoEmail, sendPagoValidadoEmail, sendAvisoCobroEmail } from '../../lib/emailConfig';
import { uploadToSupabaseStorage } from '../../lib/storage';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Search, 
  PlusCircle, 
  Eye, 
  Check, 
  UserX, 
  FileCheck2, 
  ToggleLeft, 
  ToggleRight, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Shield,
  Copy,
  Wallet,
  Send,
  CreditCard,
  Receipt,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export default function PadronSocios() {
  const { 
    sociosList = [], 
    updateSocioCuota, 
    updateSocioCategoria,
    updateSocioCuotaIncorporacion,
    togglePermisoGestionVoluntariosSocio,
    financialSettings = {}, 
    cobrosList = [],
    addCobrosBatch,
    markCobroPaid,
    deleteCobro,
    canManageCategoriesAndCargos,
    isMasterUser,
    isDirectiva,
    canManageFinances,
    currentUser,
    solicitarRenunciaSocio,
    aprobarRenunciaDirectorio
  } = useAuth();

  // Pestañas principales: 'padron' (registro oficial) | 'cobros' (sistema de cobranza) | 'renuncias' (histórico DL 2757)
  const [activeMainTab, setActiveMainTab] = useState('cobros');
  
  // Filtros generales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [copiedBankData, setCopiedBankData] = useState(false);

  // Modales
  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [activeSocioModal, setActiveSocioModal] = useState(null);
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [acuerdoNumero, setAcuerdoNumero] = useState('');

  // Renuncia retroactiva
  const [showRetroactiveForm, setShowRetroactiveForm] = useState(false);
  const [retroSocioId, setRetroSocioId] = useState('');
  const [retroFechaSolicitud, setRetroFechaSolicitud] = useState('');
  const [retroFechaRetiro, setRetroFechaRetiro] = useState('');
  const [retroMotivo, setRetroMotivo] = useState('');
  const [retroActa, setRetroActa] = useState('');
  const [isRetroSaving, setIsRetroSaving] = useState(false);

  // Emisión rápida de cuota mensual
  const [isEmittingMonthly, setIsEmittingMonthly] = useState(false);
  const [monthlyFeeName, setMonthlyFeeName] = useState('');

  // Estado del modal de pago avanzado
  const [paymentType, setPaymentType] = useState('mensual');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCobroId, setSelectedCobroId] = useState('');
  const [customMonto, setCustomMonto] = useState('');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Estado de aviso de cobro
  const [isSendingAviso, setIsSendingAviso] = useState(null); // id del socio enviando aviso

  // Inicializar nombre de cuota mensual según el mes actual
  useEffect(() => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    setMonthlyFeeName(`Cuota ${meses[now.getMonth()]} ${now.getFullYear()}`);
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEstado, selectedCategory, activeMainTab]);

  // Al abrir modal de pago, inicializar valores por defecto
  useEffect(() => {
    if (activePaymentModal) {
      setPaymentType('mensual');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const now = new Date();
      const mesActual = `${meses[now.getMonth()]} ${now.getFullYear()}`;
      setSelectedMonth(mesActual);
      const cuotaSocio = activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000;
      setCustomMonto(cuotaSocio);
      setComprobanteRef('');
      setComprobanteFile(null);
      
      const socioCobrosPendientes = cobrosList.filter(c => c.socioId === activePaymentModal.id && !c.pagado);
      if (socioCobrosPendientes.length > 0) {
        setSelectedCobroId(socioCobrosPendientes[0].id);
      } else {
        setSelectedCobroId('');
      }
    }
  }, [activePaymentModal, financialSettings, cobrosList]);

  // Manejo de copia de datos bancarios
  const handleCopyBankData = () => {
    const text = `DATOS BANCARIOS PRUANED A.G.
Titular: PRUANED A.G.
RUT: 65.272.406-K
Banco: Mercado Pago
Tipo: Cuenta Vista
N° Cuenta: 1046032015
Correo tesorería: ag.pruaned@gmail.com`;
    navigator.clipboard.writeText(text);
    setCopiedBankData(true);
    setTimeout(() => setCopiedBankData(false), 2500);
  };

  // KPIs del padrón y cobranza
  const activeSociosList = sociosList.filter(s => s.email !== 'ag.pruaned@gmail.com');
  const totalSocios = activeSociosList.length;
  const sociosAlDia = activeSociosList.filter(s => s.estadoCuota === 'Al Día').length;
  const sociosEnMora = activeSociosList.filter(s => s.estadoCuota === 'En Mora').length;
  const sociosRenunciados = activeSociosList.filter(s => s.estadoCuota?.includes('Desvinculado') || s.estadoCuota?.includes('Renuncia')).length;
  
  // Total recaudado históricamente por cuotas
  const totalRecaudadoHistorico = activeSociosList.reduce((acc, s) => {
    const pagos = (s.historialPagos || []).reduce((pAcc, p) => pAcc + (Number(p.monto) || 0), 0);
    return acc + pagos;
  }, 0);

  // Total deuda actual del padrón
  const totalDeudaPadron = activeSociosList.reduce((acc, s) => {
    if (s.estadoCuota === 'Exento' || s.estadoCuota?.includes('Desvinculado') || s.categoria === 'Socio Honorario') return acc;
    const esAntiguo = s.fechaIngreso && new Date(s.fechaIngreso).getFullYear() < 2026;
    const cuotaIncorp = (s.cuotaIncorporacionPagada || esAntiguo) ? 0 : (s.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual || 30000);
    const cuotaMensual = s.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000;
    const meses = s.mesesAdeudados || 0;
    const pendingCobros = cobrosList.filter(c => c.socioId === s.id && !c.pagado).reduce((pAcc, c) => pAcc + (Number(c.monto) || 0), 0);
    return acc + cuotaIncorp + (meses * cuotaMensual) + pendingCobros;
  }, 0);

  const recaudacionMensualEsperada = activeSociosList
    .filter(s => s.categoria !== 'Socio Honorario' && !s.estadoCuota?.includes('Desvinculado'))
    .reduce((acc, s) => acc + Number(s.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000), 0);

  // Filtrado de socios
  const filteredSocios = activeSociosList.filter(s => {
    if (activeMainTab === 'renuncias') {
      return s.estadoCuota?.includes('Desvinculado') || s.fechaSolicitudRenuncia;
    }

    if (s.estadoCuota?.includes('Desvinculado')) return false;

    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = selectedEstado === 'TODOS' || s.estadoCuota === selectedEstado;
    const matchesCat = selectedCategory === 'TODAS' || s.categoria === selectedCategory;
    return matchesSearch && matchesEstado && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSocios.length / itemsPerPage));
  const paginatedSocios = filteredSocios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Emisión rápida de cuota mensual a todos los socios
  const handleEmitirCuotaMesATodos = async () => {
    if (!monthlyFeeName.trim()) return;
    const sociosActivos = activeSociosList.filter(s => s.categoria !== 'Socio Honorario' && !s.estadoCuota?.includes('Desvinculado'));
    
    if (!confirm(`¿Emitir "${monthlyFeeName}" a ${sociosActivos.length} socios activos?`)) return;

    setIsEmittingMonthly(true);
    try {
      const batch = sociosActivos.map(s => {
        const monto = s.montoCuotaMensual || financialSettings.cuotasPorCategoria?.[s.categoria] || financialSettings.cuotaMensualActual || 5000;
        return {
          socioId: s.id,
          titulo: monthlyFeeName.trim(),
          monto: Number(monto),
          fecha: new Date().toISOString().split('T')[0],
          pagado: false
        };
      });

      await addCobrosBatch(batch);
      alert(`✓ Se emitieron exitosamente ${batch.length} cobros correspondientes a "${monthlyFeeName}".`);
    } catch (err) {
      alert('Error emitiendo cuotas: ' + err.message);
    } finally {
      setIsEmittingMonthly(false);
    }
  };

  // Envío individual de aviso de cobro por correo
  const handleEnviarAvisoCobro = async (socio, deudaTotal) => {
    if (deudaTotal <= 0) {
      alert('El socio está al día con sus cuotas.');
      return;
    }
    if (!confirm(`¿Enviar correo de recordatorio de cobro por $${deudaTotal.toLocaleString('es-CL')} a ${socio.nombre} (${socio.email})?`)) return;

    setIsSendingAviso(socio.id);
    try {
      await sendAvisoCobroEmail(socio, {
        montoTotal: deudaTotal,
        detalle: `${socio.mesesAdeudados || 0} mes(es) de cuota social pendiente(s)`
      });
      alert(`✓ Correo de cobro enviado con éxito a ${socio.email}.`);
    } catch (err) {
      alert('Error enviando correo: ' + err.message);
    } finally {
      setIsSendingAviso(null);
    }
  };

  // Envío masivo de avisos a todos los morosos
  const handleEnviarAvisosMasivosMorosos = async () => {
    const morosos = activeSociosList.filter(s => s.estadoCuota === 'En Mora' && s.email && !s.email.includes('anonimizado'));
    if (morosos.length === 0) {
      alert('No hay socios en mora para notificar.');
      return;
    }

    if (!confirm(`¿Enviar correo de recordatorio de cobro a todos los ${morosos.length} socios que están En Mora?`)) return;

    let enviados = 0;
    for (const socio of morosos) {
      const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000;
      const deuda = (socio.mesesAdeudados || 1) * cuotaMensual;
      try {
        await sendAvisoCobroEmail(socio, {
          montoTotal: deuda,
          detalle: `${socio.mesesAdeudados || 1} cuota(s) social(es) pendiente(s)`
        });
        enviados++;
      } catch (e) {
        console.warn('Error enviando a:', socio.email, e);
      }
    }
    alert(`✓ Se enviaron recordatorios de cobro a ${enviados} socio(s) en mora.`);
  };

  // Procesamiento de pago
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!activePaymentModal || !canManageFinances) return;

    setIsProcessingPayment(true);
    try {
      let uploadedUrl = '';
      if (comprobanteFile) {
        uploadedUrl = await uploadToSupabaseStorage(
          'comprobantes',
          `pago_${activePaymentModal.rut}_${Date.now()}.webp`,
          comprobanteFile
        );
      }

      const refFinal = comprobanteRef.trim() || (uploadedUrl ? 'Comprobante adjunto' : 'Validado por Tesorería');
      let paymentPayload = {
        monto: Number(customMonto),
        comprobanteUrl: uploadedUrl || refFinal,
        mes: selectedMonth,
        tipo: paymentType
      };

      let nextEstado = activePaymentModal.estadoCuota;
      let nextMesesAdeudados = Number(activePaymentModal.mesesAdeudados || 0);
      let isCuotaIncorp = false;

      if (paymentType === 'incorporacion') {
        isCuotaIncorp = true;
        paymentPayload.isCuotaIncorporacion = true;
        paymentPayload.concepto = 'Cuota de Incorporación';
      } else if (paymentType === 'cobro_especial') {
        const targetCobro = cobrosList.find(c => c.id === selectedCobroId);
        paymentPayload.cobroId = selectedCobroId;
        paymentPayload.concepto = targetCobro ? targetCobro.titulo : 'Cobro Extraordinario';
      } else {
        paymentPayload.concepto = `Cuota Social ${selectedMonth}`;
        nextMesesAdeudados = Math.max(0, nextMesesAdeudados - 1);
        nextEstado = nextMesesAdeudados === 0 ? 'Al Día' : 'En Mora';
      }

      await updateSocioCuota(
        activePaymentModal.id,
        nextEstado,
        refFinal,
        false,
        isCuotaIncorp,
        paymentPayload
      );

      // Notificaciones por correo
      try {
        const emailData = {
          monto: paymentPayload.monto,
          referencia: refFinal
        };
        sendPagoEmail(emailData, activePaymentModal);
        sendPagoValidadoEmail(activePaymentModal, paymentPayload.monto);
      } catch (mailErr) {
        console.warn('Error enviando notificación por email:', mailErr);
      }

      alert('✓ Pago validado y registrado exitosamente en Supabase.');
      setActivePaymentModal(null);
    } catch (err) {
      alert('Error al registrar pago: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Renuncia Retroactiva
  const handleRetroactiveRenuncia = async (e) => {
    e.preventDefault();
    if (!retroSocioId || !retroFechaRetiro || !retroActa) {
      alert('Socio, Fecha de Retiro y Número de Acta son obligatorios.');
      return;
    }
    setIsRetroSaving(true);
    try {
      await solicitarRenunciaSocio(retroSocioId, retroMotivo || 'Renuncia presentada con anterioridad a la implementación del sistema digital PRUANED.');
      await aprobarRenunciaDirectorio(retroSocioId, retroActa);
      alert('✓ Renuncia retroactiva registrada. El socio quedó como Desvinculado conforme al DL 2.757.');
      setShowRetroactiveForm(false);
      setRetroSocioId(''); setRetroFechaSolicitud(''); setRetroFechaRetiro('');
      setRetroMotivo(''); setRetroActa('');
    } catch (err) {
      alert('Error al registrar: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsRetroSaving(false);
    }
  };

  // Aprobar Renuncia regular
  const handleApproveRenuncia = async (e) => {
    e.preventDefault();
    if (!acuerdoNumero) { alert('Debe indicar el número de Acta del Directorio.'); return; }
    try {
      await aprobarRenunciaDirectorio(activeApproveRenunciaModal.id, acuerdoNumero);
      setActiveApproveRenunciaModal(null);
      setAcuerdoNumero('');
      alert('✓ Retiro aprobado formalmente conforme al DL 2.757.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = "RUT,Nombre,Categoria,EstadoCuota,MesesAdeudados,DeudaTotalCLP,UltimoPago,CuotaIncorpPagada,PermisoVoluntarios\n";
    const rows = filteredSocios.map(s => {
      const esAntiguo = s.fechaIngreso && new Date(s.fechaIngreso).getFullYear() < 2026;
      const cuotaIncorpPagadaReal = s.cuotaIncorporacionPagada || esAntiguo;
      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (s.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual || 30000);
      const cuotaMensual = s.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000;
      const mesesDeuda = s.mesesAdeudados || 0;
      const montoMeses = (s.estadoCuota === 'Exento' || s.estadoCuota?.includes('Desvinculado') || s.categoria === 'Socio Honorario') ? 0 : (mesesDeuda * cuotaMensual);
      const pendingCobros = cobrosList.filter(c => c.socioId === s.id && !c.pagado).reduce((acc, c) => acc + (c.monto || 0), 0);
      const deuda = (s.estadoCuota === 'Exento' || s.estadoCuota?.includes('Desvinculado') || s.categoria === 'Socio Honorario') ? 0 : cuotaIncorp + montoMeses + pendingCobros;

      return `"${s.rut}","${s.nombre}","${s.categoria}","${s.estadoCuota}","${mesesDeuda}","${deuda}","${s.ultimaCuotaPagada || 'N/R'}","${cuotaIncorpPagadaReal ? 'SI' : 'NO'}","${s.permisoGestionVoluntarios ? 'SI' : 'NO'}"`;
    }).join("\n");
    
    const element = document.createElement("a");
    const file = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Padron_PRUANED_${activeMainTab}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in font-['Plus_Jakarta_Sans'] pb-12">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700">PRUANED A.G. — Directorio &amp; Tesorería</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Outfit']">
            {activeMainTab === 'cobros' ? 'Sistema de Cobros y Cuotas Sociales' :
             activeMainTab === 'padron' ? 'Padrón Oficial de Socios' :
             'Registro Histórico y Renuncias (DL 2.757)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {activeMainTab === 'cobros' ? 'Mesa de cobranzas, emisión de cuotas, verificación de transferencias y cuentas corrientes.' :
             activeMainTab === 'padron' ? 'Nómina gremial oficial de miembros, categorías de afiliación y permisos.' :
             'Registro formal de socios desvinculados y renuncias ratificadas por Directorio.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-blue-700" /> Exportar Planilla (CSV)
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN PRINCIPAL */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('cobros')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeMainTab === 'cobros' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-600 hover:text-slate-950'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Sistema de Cobros y Cuotas
          {sociosEnMora > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
              {sociosEnMora} en mora
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('padron')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeMainTab === 'padron' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-950'
          }`}
        >
          <Users className="w-4 h-4" /> Padrón Oficial de Socios ({totalSocios})
        </button>

        <button
          onClick={() => setActiveMainTab('renuncias')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeMainTab === 'renuncias' ? 'border-amber-600 text-amber-800' : 'border-transparent text-slate-600 hover:text-slate-950'
          }`}
        >
          <UserX className="w-4 h-4" /> Historial &amp; Renuncias ({sociosRenunciados})
        </button>
      </div>

      {/* =========================================================================
          SECCIÓN 1: SISTEMA DE COBROS Y CUOTAS SOCIALES (TAB COBROS)
      ========================================================================= */}
      {activeMainTab === 'cobros' && (
        <div className="space-y-6">
          {/* TARJETAS DE COBRANZA */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Socios al Día</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-800 font-['Outfit']">{sociosAlDia}</div>
              <p className="text-[10px] text-emerald-700 font-medium">{Math.round((sociosAlDia / (totalSocios || 1)) * 100)}% de cumplimiento</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Socios en Mora</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-rose-800 font-['Outfit']">{sociosEnMora}</div>
              <p className="text-[10px] text-rose-700 font-medium">Cuotas sociales pendientes</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Deuda Padrón</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-700 font-mono">
                ${totalDeudaPadron.toLocaleString('es-CL')}
              </div>
              <p className="text-[10px] text-rose-700 font-medium">Por cobrar a socios</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Recaudación / Mes</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-900 font-mono">
                ${recaudacionMensualEsperada.toLocaleString('es-CL')}
              </div>
              <p className="text-[10px] text-blue-700 font-medium">Proyección mensual</p>
            </div>
          </div>

          {/* PANEL DE EMISIÓN RÁPIDA DE CUOTA MENSUAL (TESORERÍA) */}
          {canManageFinances && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  <DollarSign className="w-3 h-3" /> Emisión Mensual de Cuotas
                </div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Emitir Cuota Social Ordinaria</h3>
                <p className="text-slate-600">
                  Genera la cuota del mes para todos los socios activos (según el tarifario de $5.000 / mes).
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={monthlyFeeName}
                  onChange={e => setMonthlyFeeName(e.target.value)}
                  placeholder="Ej: Cuota Septiembre 2026"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none w-full md:w-56"
                />
                <button
                  onClick={handleEmitirCuotaMesATodos}
                  disabled={isEmittingMonthly}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isEmittingMonthly ? 'Emitiendo...' : 'Emitir Cuota a Todos'}
                </button>
              </div>
            </div>
          )}

          {/* BARRA DE FILTROS DE COBRANZA */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar socio por Nombre o RUT..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedEstado}
                onChange={e => setSelectedEstado(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 outline-none"
              >
                <option value="TODOS">Todos los estados de cuota</option>
                <option value="Al Día">Solo Al Día</option>
                <option value="En Mora">Solo En Mora</option>
                <option value="Exento">Exentos</option>
              </select>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 outline-none"
              >
                <option value="TODAS">Todas las categorías</option>
                <option value="Socio Activo">Socio Activo ($5.000)</option>
                <option value="Socio Adherente">Socio Adherente ($5.000)</option>
                <option value="Socio Honorario">Socio Honorario ($0)</option>
              </select>

              {canManageFinances && sociosEnMora > 0 && (
                <button
                  onClick={handleEnviarAvisosMasivosMorosos}
                  className="px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 transition-all"
                  title="Envía correo de recordatorio a todos los socios en mora"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-600" /> Notificar a Morosos ({sociosEnMora})
                </button>
              )}
            </div>
          </div>

          {/* MESA DE COBRANZA: TABLA DE CUENTAS CORRIENTES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Socio / Identificación</th>
                    <th className="py-3 px-4">Cuota Mensual</th>
                    <th className="py-3 px-4">Incorporación</th>
                    <th className="py-3 px-4">Meses en Mora</th>
                    <th className="py-3 px-4">Extraordinarios</th>
                    <th className="py-3 px-4">Total Deuda CLP</th>
                    <th className="py-3 px-4 text-right">Gestión de Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSocios.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 italic font-medium">
                        No se encontraron registros de cobro con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedSocios.map(socio => {
                      const esAntiguo = socio.fechaIngreso && new Date(socio.fechaIngreso).getFullYear() < 2026;
                      const cuotaIncorpPagadaReal = socio.cuotaIncorporacionPagada || esAntiguo;
                      const cuotaIncorp = cuotaIncorpPagadaReal ? 0 : (socio.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual || 30000);
                      const cuotaMensual = socio.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000;
                      const mesesDeuda = socio.mesesAdeudados || 0;
                      const montoMeses = (socio.estadoCuota === 'Exento' || socio.estadoCuota?.includes('Desvinculado') || socio.categoria === 'Socio Honorario') ? 0 : (mesesDeuda * cuotaMensual);
                      const pendingCobros = cobrosList.filter(c => c.socioId === socio.id && !c.pagado);
                      const montoPendingCobros = pendingCobros.reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
                      const deudaTotal = (socio.estadoCuota === 'Exento' || socio.estadoCuota?.includes('Desvinculado') || socio.categoria === 'Socio Honorario') ? 0 : cuotaIncorp + montoMeses + montoPendingCobros;

                      return (
                        <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={socio.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.nombre)}&background=0C2340&color=fff&size=96`}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate max-w-[180px]">{socio.nombre}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{socio.rut}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800">
                              ${cuotaMensual.toLocaleString('es-CL')}
                            </span>
                            <span className="block text-[9px] text-slate-400">{socio.categoria}</span>
                          </td>

                          <td className="py-3 px-4">
                            {canManageFinances ? (
                              <button
                                onClick={() => updateSocioCuotaIncorporacion(socio.id, !cuotaIncorpPagadaReal)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                                  cuotaIncorpPagadaReal
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                                title="Alternar cuota de incorporación"
                              >
                                {cuotaIncorpPagadaReal ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                {cuotaIncorpPagadaReal ? 'Al día' : `$${cuotaIncorp.toLocaleString('es-CL')}`}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-bold ${cuotaIncorpPagadaReal ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {cuotaIncorpPagadaReal ? 'Al día' : `$${cuotaIncorp.toLocaleString('es-CL')}`}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              mesesDeuda === 0 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {mesesDeuda === 0 ? '0 meses' : `${mesesDeuda} mes(es)`}
                            </span>
                            {socio.ultimaCuotaPagada && (
                              <span className="block text-[9px] text-slate-400 mt-0.5">Últ: {socio.ultimaCuotaPagada}</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {pendingCobros.length > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-bold text-[10px] border border-amber-200">
                                {pendingCobros.length} pend. (${montoPendingCobros.toLocaleString('es-CL')})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Sin cargos</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-sm">
                            {deudaTotal > 0 ? (
                              <span className="text-rose-600 font-extrabold">
                                ${deudaTotal.toLocaleString('es-CL')} CLP
                              </span>
                            ) : (
                              <span className="text-emerald-700">$0 CLP</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {canManageFinances && (
                              <>
                                <button
                                  onClick={() => setActivePaymentModal(socio)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-colors"
                                >
                                  Registrar Pago
                                </button>

                                {deudaTotal > 0 && (
                                  <button
                                    onClick={() => handleEnviarAvisoCobro(socio, deudaTotal)}
                                    disabled={isSendingAviso === socio.id}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1"
                                    title="Enviar recordatorio de cobro por correo"
                                  >
                                    <Send className="w-3 h-3" />
                                    {isSendingAviso === socio.id ? 'Enviando...' : 'Aviso'}
                                  </button>
                                )}
                              </>
                            )}

                            <button
                              onClick={() => setActiveSocioModal(socio)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Cartola
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Mostrando {paginatedSocios.length} de {filteredSocios.length} socios
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECCIÓN 2: PADRÓN OFICIAL DE SOCIOS (REGISTRO INSTITUCIONAL)
      ========================================================================= */}
      {activeMainTab === 'padron' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre, RUT o Email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 outline-none"
              >
                <option value="TODAS">Todas las categorías</option>
                <option value="Socio Activo">Socio Activo</option>
                <option value="Socio Adherente">Socio Adherente</option>
                <option value="Socio Honorario">Socio Honorario</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Socio / RUT</th>
                    <th className="py-3 px-4">Categoría Gremial</th>
                    <th className="py-3 px-4">Derecho a Voto</th>
                    <th className="py-3 px-4">Gestión Voluntarios</th>
                    <th className="py-3 px-4">Fecha Ingreso</th>
                    <th className="py-3 px-4 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSocios.map(socio => (
                    <tr key={socio.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={socio.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.nombre)}&background=0C2340&color=fff&size=96`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{socio.nombre}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{socio.rut} • {socio.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {canManageCategoriesAndCargos ? (
                          <select
                            value={socio.categoria}
                            onChange={e => updateSocioCategoria(socio.id, e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 p-1 outline-none"
                          >
                            <option value="Socio Activo">Socio Activo</option>
                            <option value="Socio Adherente">Socio Adherente</option>
                            <option value="Socio Honorario">Socio Honorario</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {socio.categoria}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          socio.categoria === 'Socio Activo' ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {socio.categoria === 'Socio Activo' ? 'Voz y Voto' : 'Solo Voz'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {canManageFinances ? (
                          <button
                            onClick={() => togglePermisoGestionVoluntariosSocio(socio.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                              socio.permisoGestionVoluntarios
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {socio.permisoGestionVoluntarios ? <Check className="w-3 h-3 text-emerald-700" /> : <ToggleLeft className="w-3 h-3 text-slate-400" />}
                            {socio.permisoGestionVoluntarios ? 'Habilitado' : 'Sin permiso'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {socio.permisoGestionVoluntarios ? 'Habilitado' : 'Sin permiso'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {socio.fechaIngreso || 'No registrada'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveSocioModal(socio)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Ficha Oficial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECCIÓN 3: HISTORIAL & RENUNCIAS (DL 2.757)
      ========================================================================= */}
      {activeMainTab === 'renuncias' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600" />
                  Registro de Desvinculaciones y Renuncias Gremiales (DL N° 2.757)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Control legal y actas oficiales de desafiliación voluntaria.</p>
              </div>

              {canManageFinances && (
                <button
                  onClick={() => setShowRetroactiveForm(v => !v)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Registrar Renuncia Retroactiva
                </button>
              )}
            </div>

            {/* FORMULARIO RETROACTIVO */}
            {showRetroactiveForm && (
              <form onSubmit={handleRetroactiveRenuncia} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4 text-xs">
                <h4 className="font-bold text-amber-950 text-sm">Registrar Desvinculación Ocurrida Antes del Sistema</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-amber-900 mb-1">Seleccionar Socio *</label>
                    <select
                      required
                      value={retroSocioId}
                      onChange={e => setRetroSocioId(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 font-semibold outline-none"
                    >
                      <option value="">— Seleccionar socio —</option>
                      {activeSociosList.filter(s => !s.estadoCuota?.includes('Desvinculado')).map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} ({s.rut})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Fecha de Solicitud</label>
                    <input type="date" value={retroFechaSolicitud} onChange={e => setRetroFechaSolicitud(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Fecha de Retiro Oficial *</label>
                    <input type="date" required value={retroFechaRetiro} onChange={e => setRetroFechaRetiro(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-amber-900 mb-1">N° Acta Directorio Aprobación *</label>
                    <input type="text" required placeholder="Ej: Acta N° 2024-03" value={retroActa} onChange={e => setRetroActa(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-amber-900 mb-1">Motivo</label>
                    <textarea rows={2} value={retroMotivo} onChange={e => setRetroMotivo(e.target.value)} className="w-full bg-white border border-amber-300 rounded-xl p-2 text-slate-900 outline-none resize-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                  <button type="button" onClick={() => setShowRetroactiveForm(false)} className="px-4 py-1.5 font-bold rounded-xl border border-amber-300 text-amber-900">Cancelar</button>
                  <button type="submit" disabled={isRetroSaving} className="px-4 py-1.5 font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {isRetroSaving ? 'Guardando...' : 'Confirmar Desvinculación'}
                  </button>
                </div>
              </form>
            )}

            {/* LISTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSocios.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-400 italic text-xs">No hay renuncias registradas en este apartado.</div>
              ) : (
                filteredSocios.map(soc => (
                  <div key={soc.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">{soc.nombre}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">{soc.rut} • {soc.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-200 text-slate-700 border border-slate-300">
                        {soc.estadoCuota}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                      <div><strong>Fecha Retiro:</strong> {soc.fechaRetiroOficial || soc.fechaSolicitudRenuncia || 'N/R'}</div>
                      <div><strong>Acta Aprobación:</strong> <span className="text-emerald-800 font-bold">{soc.actaDirectorioAprobacion || 'Pendiente'}</span></div>
                      <div><strong>Motivo:</strong> {soc.motivoRenuncia || 'No especificado'}</div>
                    </div>
                    {canManageFinances && soc.estadoCuota?.includes('Solicitud') && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setActiveApproveRenunciaModal(soc)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprobar Desvinculación en Acta
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: REGISTRAR PAGO
      ========================================================= */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">Tesorería Institucional</span>
                <h3 className="text-xl font-extrabold text-slate-950 font-['Outfit']">Registrar Pago de Cuota / Cobro</h3>
                <p className="text-xs text-slate-600 mt-0.5">{activePaymentModal.nombre} ({activePaymentModal.rut})</p>
              </div>
              <button onClick={() => setActivePaymentModal(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Concepto a Pagar:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('mensual');
                      setCustomMonto(activePaymentModal.montoCuotaMensual || financialSettings.cuotaMensualActual || 5000);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      paymentType === 'mensual' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Cuota Social Mensual
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('incorporacion');
                      setCustomMonto(activePaymentModal.montoCuotaIncorporacion || financialSettings.cuotaIncorporacionActual || 30000);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      paymentType === 'incorporacion' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Cuota de Incorporación
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('cobro_especial');
                      const cobro = cobrosList.find(c => c.id === selectedCobroId);
                      if (cobro) setCustomMonto(cobro.monto);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      paymentType === 'cobro_especial' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Cobro Extraordinario
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('libre')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      paymentType === 'libre' ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Abono Libre
                  </button>
                </div>
              </div>

              {paymentType === 'mensual' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mes que se cancela:</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none font-semibold"
                  >
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                      <option key={m} value={`${m} 2026`}>{m} 2026</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentType === 'cobro_especial' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cobro extraordinario:</label>
                  <select
                    value={selectedCobroId}
                    onChange={e => {
                      setSelectedCobroId(e.target.value);
                      const c = cobrosList.find(item => item.id === e.target.value);
                      if (c) setCustomMonto(c.monto);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none font-semibold"
                  >
                    {cobrosList.filter(c => c.socioId === activePaymentModal.id && !c.pagado).map(c => (
                      <option key={c.id} value={c.id}>{c.titulo} (${c.monto.toLocaleString('es-CL')})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto Pagado ($ CLP) *</label>
                <input
                  type="number"
                  required
                  value={customMonto}
                  onChange={e => setCustomMonto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Referencia o N° Transacción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Transferencia 984012 Mercado Pago"
                  value={comprobanteRef}
                  onChange={e => setComprobanteRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjuntar Comprobante (Opcional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) setComprobanteFile(file);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setActivePaymentModal(null)} className="px-4 py-2 font-bold rounded-xl border border-slate-200 text-slate-700">Cancelar</button>
                <button type="submit" disabled={isProcessingPayment} className="px-5 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow disabled:opacity-60">
                  <Check className="w-3.5 h-3.5" />
                  {isProcessingPayment ? 'Sincronizando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: FICHA / ESTADO DE CUENTA COMPLETO
      ========================================================= */}
      {activeSocioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeSocioModal.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeSocioModal.nombre)}&background=0C2340&color=fff&size=128`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950 font-['Outfit']">{activeSocioModal.nombre}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">{activeSocioModal.categoria}</span>
                    <span className="text-[10px] font-mono text-slate-500">{activeSocioModal.rut}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveSocioModal(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>{activeSocioModal.email || 'N/R'}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Teléfono</span>{activeSocioModal.telefono || 'N/R'}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Profesión</span>{activeSocioModal.profesion || 'N/R'}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha Ingreso</span>{activeSocioModal.fechaIngreso || 'N/R'}</div>
            </div>

            {/* ESTADO DE CUENTA */}
            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" /> Cuenta Corriente Gremial
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Estado</span>
                  <strong className="text-emerald-700 text-xs">{activeSocioModal.estadoCuota}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Meses Adeudados</span>
                  <strong className="text-rose-600 text-xs">{activeSocioModal.mesesAdeudados || 0}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Cuota Incorp.</span>
                  <strong className="text-slate-800 text-xs">
                    {activeSocioModal.cuotaIncorporacionPagada || (activeSocioModal.fechaIngreso && new Date(activeSocioModal.fechaIngreso).getFullYear() < 2026) ? 'Pagada' : 'Pendiente'}
                  </strong>
                </div>
              </div>
            </div>

            {/* HISTORIAL DE PAGOS */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-700" /> Historial de Pagos Validados ({Array.isArray(activeSocioModal.historialPagos) ? activeSocioModal.historialPagos.length : 0})
              </h4>
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {(!activeSocioModal.historialPagos || activeSocioModal.historialPagos.length === 0) ? (
                  <div className="p-4 text-center text-slate-400 italic">No registra pagos en su historial.</div>
                ) : (
                  activeSocioModal.historialPagos.map((p, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{p.mes || p.concepto || 'Cuota'}</div>
                        <div className="text-[10px] text-slate-400">{p.fecha} • {p.comprobante}</div>
                      </div>
                      <div className="font-mono font-bold text-emerald-700">
                        ${Number(p.monto || 0).toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setActiveSocioModal(null)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APROBAR RENUNCIA */}
      {activeApproveRenunciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-['Plus_Jakarta_Sans']">
          <form onSubmit={handleApproveRenuncia} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 text-xs">
            <h3 className="text-lg font-bold text-slate-950 font-['Outfit'] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" /> Aprobar Desvinculación DL N° 2.757
            </h3>
            <p className="text-slate-600">
              Se formalizará la renuncia de <strong>{activeApproveRenunciaModal.nombre}</strong>. Sus datos quedarán anonimizados y su registro preservado históricamente conforme a la ley.
            </p>
            <div>
              <label className="block font-bold text-slate-800 mb-1">N° de Acta del Directorio Nacional *</label>
              <input
                type="text"
                required
                placeholder="Ej: Acta Directorio N° 2024-05"
                value={acuerdoNumero}
                onChange={e => setAcuerdoNumero(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => { setActiveApproveRenunciaModal(null); setAcuerdoNumero(''); }} className="px-4 py-2 font-bold rounded-xl border border-slate-200 text-slate-700">Cancelar</button>
              <button type="submit" className="px-4 py-2 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Aprobar Desvinculación Oficial
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
