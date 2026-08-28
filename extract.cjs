const fs = require('fs');

const sociosPath = 'src/components/SociosIntranet.jsx';
let sociosContent = fs.readFileSync(sociosPath, 'utf8');

// The block to extract starts from "{activeTabLocal === 'donaciones' && canManageFinances && <FondoDonacionesPanel />}"
// until the end of "cobros-especiales" tab which ends before "POSTULACION MODAL"

const startMarker = "{activeTabLocal === 'donaciones' && canManageFinances && <FondoDonacionesPanel />}";
const endMarker = "      {/* POSTULACION MODAL */}";

const startIndex = sociosContent.indexOf(startMarker);
const endIndex = sociosContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const extractedTabs = sociosContent.substring(startIndex, endIndex);

  // Now we need to remove this from SociosIntranet.jsx
  const newSociosContent = sociosContent.substring(0, startIndex) + sociosContent.substring(endIndex);
  fs.writeFileSync(sociosPath, newSociosContent, 'utf8');

  // Now let's build FinanzasPanel.jsx
  let finanzasPanelCode = `
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
            {selected ? \`\${selected.nombre} (\${selected.rut})\` : 'Seleccionar socio...'}
          </span>
        </div>
        <ChevronDown className={\`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform \${isOpen ? 'rotate-180' : ''}\`} />
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
                  className={\`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-colors \${
                    s.id === selectedId
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }\`}
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

// Necesario si no está en otro lado
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
  }, [newExpense.origenFondo, financialCategories]);

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
            
          const suffix = numMeses > 1 ? \` (\${i + 1}/\${numMeses})\` : '';
          
          cobrosSocio.push({
            socioId: s.id,
            titulo: \`\${newCobro.titulo}\${suffix}\`,
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
        alert(\`¡Se emitieron \${arrayToBatch.length} cobro(s) exitosamente!\`);
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
              className={\`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 \${active ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}\`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Extracted content */}
      \n${extractedTabs}
    </div>
  );
}
`;

  fs.writeFileSync('src/pages/intranet/FinanzasPanel.jsx', finanzasPanelCode, 'utf8');
  console.log("Extraction complete!");
} else {
  console.log("Markers not found");
}
