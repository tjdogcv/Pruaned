
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FondoDonacionesPanel } from '../../components/FondoDonacionesPanel';
import { TarifarioEditor } from '../../components/TarifarioEditor';
import {
  PieChart, DollarSign, Receipt, Wallet, PlusCircle, Trash2, TrendingUp, TrendingDown, Search, X, Check, ChevronDown
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Permite escribir nombre, RUT o email para filtrar socios.
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
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
            {filtered.length} de {sociosList.length} socios
          </div>
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
    financialSettings, 
    updateFinancialSettings,
    expensesList = [], 
    addExpense, 
    deleteExpense, 
    financialCategories = [],
    cobrosList = [],
    addCobrosBatch = () => {},
    isMasterUser,
    canManageCategoriesAndCargos
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('balance');

  const [newExpense, setNewExpense] = useState({
    tipoDocumento: 'Factura',
    numeroDocumento: '',
    proveedor: '',
    monto: '',
    origenFondo: 'Fondo Cuotas',
    categoria: 'Insumos Médicos Veterinarios',
    glosa: ''
  });

  const [newCobro, setNewCobro] = useState({
    tipoCobro: 'Cuota Mensual',
    titulo: '',
    monto: '',
    asignacion: 'A todos',
    socioId: '',
    mesesAGenerar: 1
  });

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
      } catch (error) {
        alert(error.message || 'No fue posible registrar el egreso.');
      }
    }
  };

  const handleAddCobroEspecial = (e) => {
    e.preventDefault();
    if (newCobro.titulo && (newCobro.monto || newCobro.tipoCobro === 'Cuota Mensual')) {
      let arrayToBatch = [];
      const numMeses = newCobro.tipoCobro === 'Cuota Mensual' ? parseInt(newCobro.mesesAGenerar || 1, 10) : 1;
      
      const generateForSocio = (s) => {
        let cobrosSocio = [];
        for (let i = 0; i < numMeses; i++) {
          const montoCalculado = newCobro.tipoCobro === 'Cuota Mensual' 
            ? (financialSettings.cuotasPorCategoria?.[s.categoria] ?? financialSettings.cuotaMensualActual) 
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
        const sociosActivos = sociosList.filter(s => s.estadoCuota !== 'Exento' && !s.estadoCuota.includes('Desvinculado') && s.email !== 'ag.pruaned@gmail.com');
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
        addCobrosBatch(arrayToBatch);
        setNewCobro({ tipoCobro: 'Cuota Mensual', titulo: '', monto: '', asignacion: 'A todos', socioId: '', mesesAGenerar: 1 });
        alert(`¡Se emitieron ${arrayToBatch.length} cobro(s) exitosamente!`);
      }
    }
  };

  const totalIngresos = sociosList.reduce((acc, socio) => {
    const pagosSocio = (socio.historialPagos || []).reduce((pAcc, p) => pAcc + (p.monto || 0), 0);
    return acc + pagosSocio;
  }, 0);

  const totalEgresos = expensesList.reduce((acc, exp) => acc + Number(exp.monto || 0), 0);
  const saldoCaja = totalIngresos - totalEgresos;

  const tabs = [
    { id: 'balance', label: 'Balance', icon: PieChart },
    { id: 'donaciones', label: 'Fondo donaciones', icon: DollarSign },
    { id: 'egresos', label: 'Egresos', icon: Receipt },
    { id: 'cobros-especiales', label: 'Cobros y Tarifario', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      {/* Mini Tabs for FinanzasPanel */}
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2 mb-4" aria-label="Tabs de Finanzas">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTabLocal === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTabLocal(id)}
              className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${active ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Extracted content */}
      
{activeTabLocal === 'donaciones' && canManageFinances && <FondoDonacionesPanel />}

        {/* TAB 4: REGISTRO DE EGRESOS */}
        {activeTabLocal === 'egresos' && canManageFinances && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" />
                Ingresar Nuevo Gasto / Egreso
              </h3>

              <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fondo que financia el egreso</label>
                  <select
                    value={newExpense.origenFondo}
                    onChange={(e) => setNewExpense({ ...newExpense, origenFondo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="Fondo Cuotas">Fondo de cuotas sociales</option>
                    <option value="Fondo Donaciones">Fondo de donaciones</option>
                  </select>
                  {newExpense.origenFondo === 'Fondo Donaciones' && (
                    <p className="mt-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800">
                      Este movimiento descontará exclusivamente el saldo del Fondo de Donaciones.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newExpense.tipoDocumento}
                    onChange={(e) => setNewExpense({...newExpense, tipoDocumento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  >
                    <option value="Factura">Factura de Compra</option>
                    <option value="Boleta">Boleta de Venta / Servicio</option>
                    <option value="Comprobante">Comprobante de Transferencia</option>
                    <option value="Vale">Vale de Caja Chica</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">N° Documento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: FAC-1092"
                      value={newExpense.numeroDocumento}
                      onChange={(e) => setNewExpense({...newExpense, numeroDocumento: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monto ($ CLP)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 45000"
                      value={newExpense.monto}
                      onChange={(e) => setNewExpense({...newExpense, monto: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor / Entidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Copec / Droguería Veterinaria"
                    value={newExpense.proveedor}
                    onChange={(e) => setNewExpense({...newExpense, proveedor: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newExpense.origenFondo === 'Fondo Donaciones' ? 'Categoría del egreso del fondo' : 'Categoría del gasto'}
                  </label>
                  <select
                    value={newExpense.categoria}
                    onChange={(e) => setNewExpense({...newExpense, categoria: e.target.value})}
                    disabled={!availableExpenseCategories.length}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {!availableExpenseCategories.length && <option value="">Crea una categoría en Fondo donaciones</option>}
                    {availableExpenseCategories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                  {newExpense.origenFondo === 'Fondo Donaciones' && (
                    <p className="mt-1 text-[10px] text-slate-500">Administra estas categorías en la pestaña <span className="font-bold">Fondo donaciones</span>.</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descripción / Glosa</label>
                  <textarea
                    rows={3}
                    placeholder="Detalle del gasto..."
                    value={newExpense.glosa}
                    onChange={(e) => setNewExpense({...newExpense, glosa: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newExpense.categoria}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow"
                >
                  {newExpense.origenFondo === 'Fondo Donaciones' ? 'Registrar egreso del fondo' : 'Registrar egreso en libro'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                Libro de Egresos Registrados ({expensesList.length})
              </h3>

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
                    {expensesList.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{exp.tipoDocumento} {exp.numeroDocumento}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{exp.fecha}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{exp.proveedor}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${exp.origenFondo === 'Fondo Donaciones' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {exp.origenFondo || 'Fondo Cuotas'}
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold">{exp.categoria}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                          -${Number(exp.monto).toLocaleString('es-CL')} CLP
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Eliminar registro de gasto"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* TAB 5: BALANCE GENERAL */}
        {activeTabLocal === 'balance' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-blue-900" />
                    Balance General Financiero (Directorio Nacional)
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block uppercase">Estado de Caja</span>
                  <span className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
                    ${saldoCaja.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm uppercase flex items-center justify-between">
                    <span>Ingresos Recaudados</span>
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between border-b border-emerald-200 pb-1">
                      <span>Cuotas Mensuales Socios:</span>
                      <strong className="font-mono text-emerald-800">${totalIngresos.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 p-5 rounded-xl border border-rose-200 space-y-3">
                  <h4 className="font-bold text-rose-900 text-sm uppercase flex items-center justify-between">
                    <span>Egresos Realizados</span>
                    <TrendingDown className="w-4 h-4 text-rose-700" />
                  </h4>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between border-b border-rose-200 pb-1">
                      <span>Gastos Rendidos:</span>
                      <strong className="font-mono text-rose-800">${totalEgresos.toLocaleString('es-CL')} CLP</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COBROS ESPECIALES */}
        {activeTabLocal === 'cobros-especiales' && canManageFinances && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                Emisión de Cobros (Masiva o Individual)
              </h3>
              
              <form onSubmit={handleAddCobroEspecial} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Cobro</label>
                    <select
                      value={newCobro.tipoCobro}
                      onChange={(e) => setNewCobro({...newCobro, tipoCobro: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    >
                      <option value="Cuota Mensual">Cuota Mensual (Usa Tarifario por Categoría)</option>
                      <option value="Cobro Extraordinario">Cobro Extraordinario (Monto Fijo Manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Título del Cobro</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Cuota Septiembre 2026"
                      value={newCobro.titulo}
                      onChange={(e) => setNewCobro({...newCobro, titulo: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newCobro.tipoCobro === 'Cuota Mensual' ? (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cantidad de Meses a Emitir (1, 2, 3...)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newCobro.mesesAGenerar}
                        onChange={(e) => setNewCobro({...newCobro, mesesAGenerar: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Monto Fijo ($ CLP)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 10000"
                        value={newCobro.monto}
                        onChange={(e) => setNewCobro({...newCobro, monto: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Asignación</label>
                    <select
                      value={newCobro.asignacion}
                      onChange={(e) => setNewCobro({...newCobro, asignacion: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900"
                    >
                      <option value="A todos">A todos los socios activos / morosos</option>
                      <option value="Individual">Individual (Seleccionar socio)</option>
                    </select>
                  </div>
                </div>

                {newCobro.asignacion === 'Individual' && (
                  <SocioSearchSelect
                    sociosList={sociosList}
                    selectedId={newCobro.socioId}
                    onSelect={(id) => setNewCobro({...newCobro, socioId: id})}
                    label="Seleccionar Socio:"
                  />
                )}

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Generar Cobro(s)
                </button>
              </form>
            </div>

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
