import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FondoDonacionesPanel } from '../../components/FondoDonacionesPanel';
import { TarifarioEditor } from '../../components/TarifarioEditor';
import {
  PieChart, 
  DollarSign, 
  Receipt, 
  Wallet, 
  PlusCircle, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  X, 
  Check, 
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Selector inteligente de socios para cobros individuales
───────────────────────────────────────────────────────────── */
const SocioSearchSelect = ({ sociosList, selectedId, onSelect, label }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = sociosList.find(s => s.id === selectedId);

  const filtered = query.trim() === ''
    ? sociosList
    : sociosList.filter(s =>
        s.nombre.toLowerCase().includes(query.toLowerCase()) ||
        s.rut.includes(query) ||
        (s.email || '').toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (socio) => {
    onSelect(socio.id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.fotoPerfil && (
            <img src={selected.fotoPerfil} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          )}
          <span className="truncate">
            {selected ? `${selected.nombre} (${selected.rut})` : 'Seleccionar socio...'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre, RUT o email..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 italic text-center">Sin resultados para "{query}"</li>
            ) : (
              filtered.map(s => (
                <li
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-colors ${
                    s.id === selectedId
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {s.fotoPerfil && <img src={s.fotoPerfil} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.rut} • {s.categoria}</div>
                  </div>
                  {s.id === selectedId && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto flex-shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const QUOTA_EXPENSE_CATEGORIES = [
  'Insumos Médicos Veterinarios',
  'Marketing y Publicidad',
  'Software y Plataformas',
  'Eventos y Seminarios',
  'Asesoría Legal y Contable',
  'Gastos Administrativos',
  'Donación a Terceros'
];

export default function FinanzasPanel() {
  const { 
    canManageFinances,
    sociosList = [], 
    financialSettings = {}, 
    updateFinancialSettings,
    expensesList = [], 
    addExpense, 
    deleteExpense, 
    financialCategories = [],
    donacionesList = [],
    cobrosList = [],
    addCobrosBatch,
    markCobroPaid,
    deleteCobro,
    isMasterUser,
    canManageCategoriesAndCargos
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('balance');

  // Formulario nuevo egreso
  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    origenFondo: 'Fondo Cuotas',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  // Formulario nuevo cobro
  const [newCobro, setNewCobro] = useState({
    tipoCobro: 'Cuota Mensual',
    titulo: '',
    monto: '',
    asignacion: 'A todos',
    socioId: '',
    mesesAGenerar: 1
  });

  // Filtros de cobros y egresos
  const [cobrosFilterStatus, setCobrosFilterStatus] = useState('TODOS');
  const [cobrosSearch, setCobrosSearch] = useState('');
  const [egresosFondoFilter, setEgresosFondoFilter] = useState('TODOS');
  const [egresosSearch, setEgresosSearch] = useState('');

  if (!canManageFinances) return <Navigate to="/intranet/dashboard" replace />;

  const donationExpenseCategories = financialCategories
    .filter(category => category.tipo === 'donacion_egreso' && category.activo)
    .map(category => category.nombre);
  const availableExpenseCategories = newExpense.origenFondo === 'Fondo Donaciones'
    ? donationExpenseCategories
    : QUOTA_EXPENSE_CATEGORIES;

  useEffect(() => {
    if (availableExpenseCategories.length && !availableExpenseCategories.includes(newExpense.categoria)) {
      setNewExpense(previous => ({ ...previous, categoria: availableExpenseCategories[0] }));
    }
  }, [newExpense.origenFondo, financialCategories, availableExpenseCategories]);

  // Manejo de registro de egreso
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (newExpense.numeroDocumento && newExpense.monto && newExpense.categoria) {
      try {
        await addExpense({
          ...newExpense,
          monto: Number(newExpense.monto),
          fecha: new Date().toISOString().split('T')[0]
        });
        setNewExpense({
          tipoDocumento: 'Factura',
          numeroDocumento: '',
          proveedor: '',
          monto: '',
          origenFondo: 'Fondo Cuotas',
          categoria: QUOTA_EXPENSE_CATEGORIES[0],
          glosa: ''
        });
        alert('✓ Egreso registrado exitosamente en el libro financiero.');
      } catch (error) {
        alert(error.message || 'No fue posible registrar el egreso.');
      }
    }
  };

  // Manejo de emisión de cobros
  const handleAddCobroEspecial = async (e) => {
    e.preventDefault();
    if (newCobro.titulo && (newCobro.monto || newCobro.tipoCobro === 'Cuota Mensual')) {
      let arrayToBatch = [];
      const numMeses = newCobro.tipoCobro === 'Cuota Mensual' ? parseInt(newCobro.mesesAGenerar || 1, 10) : 1;
      
      const generateForSocio = (s) => {
        let cobrosSocio = [];
        for (let i = 0; i < numMeses; i++) {
          const montoCalculado = newCobro.tipoCobro === 'Cuota Mensual' 
            ? (financialSettings.cuotasPorCategoria?.[s.categoria] ?? financialSettings.cuotaMensualActual ?? 5000) 
            : Number(newCobro.monto);
            
          const suffix = numMeses > 1 ? ` (${i + 1}/${numMeses})` : '';
          
          cobrosSocio.push({
            socioId: s.id,
            titulo: `${newCobro.titulo}${suffix}`,
            monto: montoCalculado,
            fecha: new Date().toISOString().split('T')[0],
            pagado: false
          });
        }
        return cobrosSocio;
      };

      if (newCobro.asignacion === 'A todos') {
        const sociosActivos = sociosList.filter(s => s.estadoCuota !== 'Exento' && !s.estadoCuota?.includes('Desvinculado') && s.email !== 'ag.pruaned@gmail.com');
        sociosActivos.forEach(s => {
          arrayToBatch = arrayToBatch.concat(generateForSocio(s));
        });
      } else if (newCobro.socioId) {
        const socio = sociosList.find(s => s.id === newCobro.socioId);
        if (socio) {
          arrayToBatch = arrayToBatch.concat(generateForSocio(socio));
        }
      }

      if (arrayToBatch.length > 0) {
        try {
          await addCobrosBatch(arrayToBatch);
          setNewCobro({ tipoCobro: 'Cuota Mensual', titulo: '', monto: '', asignacion: 'A todos', socioId: '', mesesAGenerar: 1 });
          alert(`¡Se emitieron ${arrayToBatch.length} cobro(s) exitosamente y se sincronizaron con Supabase!`);
        } catch (err) {
          alert('Error al emitir cobros: ' + err.message);
        }
      }
    }
  };

  // CÁLCULOS DEL BALANCE INSTITUCIONAL (FONDO CUOTAS vs FONDO DONACIONES)
  const totalIngresosCuotas = sociosList.reduce((acc, socio) => {
    const pagosSocio = (socio.historialPagos || []).reduce((pAcc, p) => pAcc + (Number(p.monto) || 0), 0);
    return acc + pagosSocio;
  }, 0);

  const totalEgresosCuotas = expensesList
    .filter(exp => (exp.origenFondo || 'Fondo Cuotas') === 'Fondo Cuotas')
    .reduce((acc, exp) => acc + Number(exp.monto || 0), 0);

  const saldoFondoCuotas = totalIngresosCuotas - totalEgresosCuotas;

  const totalIngresosDonaciones = donacionesList.reduce((acc, d) => acc + Number(d.monto || 0), 0);
  const totalEgresosDonaciones = expensesList
    .filter(exp => exp.origenFondo === 'Fondo Donaciones')
    .reduce((acc, exp) => acc + Number(exp.monto || 0), 0);

  const saldoFondoDonaciones = totalIngresosDonaciones - totalEgresosDonaciones;
  const saldoTotalCaja = saldoFondoCuotas + saldoFondoDonaciones;

  // Filtrado de egresos
  const filteredExpenses = expensesList.filter(exp => {
    const matchFondo = egresosFondoFilter === 'TODOS' || (exp.origenFondo || 'Fondo Cuotas') === egresosFondoFilter;
    const matchSearch = egresosSearch.trim() === '' ||
      (exp.proveedor || '').toLowerCase().includes(egresosSearch.toLowerCase()) ||
      (exp.numeroDocumento || '').toLowerCase().includes(egresosSearch.toLowerCase()) ||
      (exp.categoria || '').toLowerCase().includes(egresosSearch.toLowerCase());
    return matchFondo && matchSearch;
  });

  // Filtrado de cobros emitidos
  const filteredCobros = cobrosList.filter(cobro => {
    const socio = sociosList.find(s => s.id === cobro.socioId);
    const matchStatus = cobrosFilterStatus === 'TODOS' || 
      (cobrosFilterStatus === 'PAGADO' && cobro.pagado) ||
      (cobrosFilterStatus === 'PENDIENTE' && !cobro.pagado);
    const matchSearch = cobrosSearch.trim() === '' ||
      (cobro.titulo || '').toLowerCase().includes(cobrosSearch.toLowerCase()) ||
      (socio?.nombre || '').toLowerCase().includes(cobrosSearch.toLowerCase()) ||
      (socio?.rut || '').includes(cobrosSearch);
    return matchStatus && matchSearch;
  });

  const tabs = [
    { id: 'balance', label: 'Balance General', icon: PieChart },
    { id: 'egresos', label: 'Libro de Egresos', icon: Receipt },
    { id: 'donaciones', label: 'Fondo Donaciones', icon: DollarSign },
    { id: 'cobros-especiales', label: 'Cobros y Tarifario', icon: Wallet },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Tesorería Nacional</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-['Outfit']">Administración Financiera</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Control de cuentas, balances segregados por fondo, emisión de cobros y rendición de gastos.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none">Caja Total Disponible</span>
            <span className="text-lg font-extrabold font-mono text-emerald-400">
              ${saldoTotalCaja.toLocaleString('es-CL')} CLP
            </span>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE FINANZAS */}
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTabLocal === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTabLocal(id)}
              className={`inline-flex min-h-10 flex-none items-center gap-2 border-b-2 px-3.5 text-xs font-bold transition ${
                active 
                  ? 'border-emerald-700 text-emerald-800' 
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: BALANCE GENERAL SEGREGADO */}
      {activeTabLocal === 'balance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FONDO DE CUOTAS */}
            <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 font-['Outfit'] text-base">Fondo de Cuotas Sociales</h3>
                    <p className="text-[11px] text-slate-500">Aportes ordinarios de socios y cuotas de incorporación</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold font-mono text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl">
                  Saldo: ${saldoFondoCuotas.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Recaudado</span>
                  <strong className="text-blue-800 font-mono text-sm">+${totalIngresosCuotas.toLocaleString('es-CL')}</strong>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Egresos del Fondo</span>
                  <strong className="text-rose-700 font-mono text-sm">-${totalEgresosCuotas.toLocaleString('es-CL')}</strong>
                </div>
              </div>
            </div>

            {/* FONDO DE DONACIONES */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-950 font-['Outfit'] text-base">Fondo de Donaciones Públicas</h3>
                    <p className="text-[11px] text-slate-500">Donaciones de personas y empresas para emergencias y proyectos</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  Saldo: ${saldoFondoDonaciones.toLocaleString('es-CL')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Donaciones Recibidas</span>
                  <strong className="text-emerald-800 font-mono text-sm">+${totalIngresosDonaciones.toLocaleString('es-CL')}</strong>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Gastos Financiados</span>
                  <strong className="text-rose-700 font-mono text-sm">-${totalEgresosDonaciones.toLocaleString('es-CL')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* DESGLOSE DE EGRESOS POR CATEGORÍA */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 font-['Outfit'] text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" /> Distribución de Gastos por Categoría
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUOTA_EXPENSE_CATEGORIES.map(cat => {
                const totalCat = expensesList
                  .filter(e => e.categoria === cat)
                  .reduce((acc, e) => acc + Number(e.monto || 0), 0);
                if (totalCat === 0) return null;
                return (
                  <div key={cat} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 truncate mr-2">{cat}</span>
                    <span className="font-mono font-bold text-rose-700">${totalCat.toLocaleString('es-CL')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIBRO DE EGRESOS */}
      {activeTabLocal === 'egresos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORMULARIO DE NUEVO EGRESO */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" /> Registrar Nuevo Gasto / Egreso
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fondo que financia el egreso *</label>
                <select
                  value={newExpense.origenFondo}
                  onChange={e => setNewExpense({ ...newExpense, origenFondo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-semibold outline-none"
                >
                  <option value="Fondo Cuotas">Fondo de Cuotas Sociales</option>
                  <option value="Fondo Donaciones">Fondo de Donaciones</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newExpense.tipoDocumento}
                    onChange={e => setNewExpense({ ...newExpense, tipoDocumento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                  >
                    <option value="Factura">Factura</option>
                    <option value="Boleta">Boleta</option>
                    <option value="Comprobante">Comprobante Transferencia</option>
                    <option value="Vale">Vale de Caja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: FAC-1092"
                    value={newExpense.numeroDocumento}
                    onChange={e => setNewExpense({ ...newExpense, numeroDocumento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor / Entidad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Copec / Droguería"
                    value={newExpense.proveedor}
                    onChange={e => setNewExpense({ ...newExpense, proveedor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monto ($ CLP) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 45000"
                    value={newExpense.monto}
                    onChange={e => setNewExpense({ ...newExpense, monto: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoría del Gasto *</label>
                <select
                  value={newExpense.categoria}
                  onChange={e => setNewExpense({ ...newExpense, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none font-semibold"
                >
                  {availableExpenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / Glosa</label>
                <textarea
                  rows={2}
                  placeholder="Detalle justificatorio del egreso..."
                  value={newExpense.glosa}
                  onChange={e => setNewExpense({ ...newExpense, glosa: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Registrar Egreso en Supabase
              </button>
            </form>
          </div>

          {/* TABLA DE EGRESOS REGISTRADOS */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Libro de Egresos Registrados ({filteredExpenses.length})
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={egresosFondoFilter}
                  onChange={e => setEgresosFondoFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-800 outline-none"
                >
                  <option value="TODOS">Todos los fondos</option>
                  <option value="Fondo Cuotas">Fondo Cuotas</option>
                  <option value="Fondo Donaciones">Fondo Donaciones</option>
                </select>
                <input
                  type="text"
                  placeholder="Buscar proveedor o doc..."
                  value={egresosSearch}
                  onChange={e => setEgresosSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <th className="py-2.5 px-3">Fecha / Doc</th>
                    <th className="py-2.5 px-3">Proveedor / Fondo / Categoría</th>
                    <th className="py-2.5 px-3">Monto</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">No hay egresos registrados con los filtros actuales.</td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{exp.tipoDocumento} {exp.numeroDocumento}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{exp.fecha}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{exp.proveedor}</div>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              exp.origenFondo === 'Fondo Donaciones' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {exp.origenFondo || 'Fondo Cuotas'}
                            </span>
                            <span className="text-[10px] text-rose-600 font-semibold">{exp.categoria}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                          -${Number(exp.monto).toLocaleString('es-CL')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar egreso de ${exp.proveedor} por $${Number(exp.monto).toLocaleString('es-CL')}?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Eliminar egreso de la base de datos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FONDO DE DONACIONES */}
      {activeTabLocal === 'donaciones' && (
        <FondoDonacionesPanel />
      )}

      {/* TAB 4: COBROS Y TARIFARIO */}
      {activeTabLocal === 'cobros-especiales' && (
        <div className="space-y-6">
          {/* EMISIÓN DE COBROS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" /> Emisión Masiva o Individual de Cobros
            </h3>

            <form onSubmit={handleAddCobroEspecial} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Cobro</label>
                  <select
                    value={newCobro.tipoCobro}
                    onChange={e => setNewCobro({ ...newCobro, tipoCobro: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-semibold outline-none"
                  >
                    <option value="Cuota Mensual">Cuota Mensual Ordinaria (Según Tarifario)</option>
                    <option value="Cobro Extraordinario">Cobro Extraordinario / Cuota Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título / Glosa del Cobro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cuota Septiembre 2026 / Cuota Campaña Primavera"
                    value={newCobro.titulo}
                    onChange={e => setNewCobro({ ...newCobro, titulo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newCobro.tipoCobro === 'Cuota Mensual' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meses a Emitir (1, 2, 3...)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newCobro.mesesAGenerar}
                      onChange={e => setNewCobro({ ...newCobro, mesesAGenerar: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monto Fijo ($ CLP) *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej. 10000"
                      value={newCobro.monto}
                      onChange={e => setNewCobro({ ...newCobro, monto: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono font-bold outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asignación de Cobro</label>
                  <select
                    value={newCobro.asignacion}
                    onChange={e => setNewCobro({ ...newCobro, asignacion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-semibold outline-none"
                  >
                    <option value="A todos">A todos los socios activos / morosos</option>
                    <option value="Individual">Individual (Seleccionar socio)</option>
                  </select>
                </div>
              </div>

              {newCobro.asignacion === 'Individual' && (
                <SocioSearchSelect
                  sociosList={sociosList.filter(s => s.email !== 'ag.pruaned@gmail.com')}
                  selectedId={newCobro.socioId}
                  onSelect={id => setNewCobro({ ...newCobro, socioId: id })}
                  label="Seleccionar Socio Destinatario:"
                />
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Generar y Emitir Cobro(s)
              </button>
            </form>
          </div>

          {/* NUEVA TABLA: GESTIÓN DE COBROS EMITIDOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-700" /> Registro de Cobros Emitidos ({filteredCobros.length})
                </h3>
                <p className="text-xs text-slate-500">Supervisa las cuotas y cobros extraordinarios emitidos, su estado de pago y cancelaciones.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={cobrosFilterStatus}
                  onChange={e => setCobrosFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 font-semibold text-slate-800 outline-none"
                >
                  <option value="TODOS">Todos los cobros</option>
                  <option value="PENDIENTE">Solo Pendientes</option>
                  <option value="PAGADO">Solo Pagados</option>
                </select>
                <input
                  type="text"
                  placeholder="Buscar socio o cobro..."
                  value={cobrosSearch}
                  onChange={e => setCobrosSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Socio</th>
                    <th className="py-2.5 px-3">Concepto del Cobro</th>
                    <th className="py-2.5 px-3">Monto</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCobros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">No hay cobros emitidos con los filtros actuales.</td>
                    </tr>
                  ) : (
                    filteredCobros.map(cobro => {
                      const socio = sociosList.find(s => s.id === cobro.socioId);
                      return (
                        <tr key={cobro.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{socio ? socio.nombre : 'Socio Desconocido'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{socio?.rut || '-'}</div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {cobro.titulo}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            ${Number(cobro.monto || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              cobro.pagado
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {cobro.pagado ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {cobro.pagado ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => markCobroPaid(cobro.id, !cobro.pagado)}
                              className={`px-2 py-1 rounded-lg font-bold text-[10px] border transition-colors ${
                                cobro.pagado
                                  ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                              }`}
                            >
                              {cobro.pagado ? 'Marcar Pendiente' : 'Marcar Pagado'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar cobro "${cobro.titulo}" por $${Number(cobro.monto).toLocaleString('es-CL')}?`)) {
                                  deleteCobro(cobro.id);
                                }
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Eliminar cobro"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TARIFARIO OFICIAL */}
          <TarifarioEditor 
            financialSettings={financialSettings} 
            onSave={updateFinancialSettings} 
            isMasterUser={isMasterUser} 
            canManageCategoriesAndCargos={canManageCategoriesAndCargos} 
          />
        </div>
      )}
    </div>
  );
}
