import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Download, 
  PlusCircle, 
  Trash2, 
  ShieldCheck, 
  FileText, 
  Search, 
  PieChart,
  CheckCircle2,
  Info
} from 'lucide-react';

export const PortalTransparencia = () => {
  const { 
    donacionesList, 
    addDonacion, 
    deleteDonacion, 
    expensesList, 
    sociosList,
    canManageFinances,
    financialCategories = [],
    balancesList = [],
    addBalance = () => {},
    deleteBalance = () => {}
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDonacionModalOpen, setIsAddDonacionModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState({ titulo: '', anio: '', urlDocumento: '' });

  // Donación Form State (Campos opcionales flexibilizados)
  const [newDonacion, setNewDonacion] = useState({
    donante: '',
    rutODocumentoDonante: '',
    monto: '',
    banco: 'BancoEstado (Cta. Corriente PRUANED A.G.)',
    numeroComprobante: '',
    categoria: ''
  });

  const donationIncomeCategories = financialCategories.filter(category => (
    category.tipo === 'donacion_ingreso' && category.activo
  ));

  useEffect(() => {
    if (!newDonacion.categoria && donationIncomeCategories[0]) {
      setNewDonacion(previous => ({ ...previous, categoria: donationIncomeCategories[0].nombre }));
    }
  }, [donationIncomeCategories, newDonacion.categoria]);

  // Financial Calculations
  const totalDonaciones = donacionesList.reduce((acc, don) => acc + Number(don.monto || 0), 0);
  const totalIngresos = totalDonaciones;
  const totalEgresosDonaciones = expensesList.filter(e => e.origenFondo === 'Fondo Donaciones').reduce((acc, exp) => acc + Number(exp.monto || 0), 0);
  const saldoCaja = totalIngresos - totalEgresosDonaciones;

  const handleAddBalanceSubmit = (e) => {
    e.preventDefault();
    if (newBalance.titulo && newBalance.anio && newBalance.urlDocumento) {
      addBalance({
        ...newBalance,
        fechaSubida: new Date().toISOString().split('T')[0]
      });
      setNewBalance({ titulo: '', anio: '', urlDocumento: '' });
      alert('¡Memoria/Balance anual publicado exitosamente!');
    }
  };

  const filteredDonaciones = donacionesList.filter(d => 
    (d.donante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.numeroComprobante || '').includes(searchTerm) ||
    (d.categoria || d.destinoAporte || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDonacionSubmit = async (e) => {
    e.preventDefault();
    if (newDonacion.monto && newDonacion.categoria) {
      const finalDonante = newDonacion.donante.trim() || 'Aporte Anónimo / Depósito Directo por Caja';
      const finalRut = newDonacion.rutODocumentoDonante.trim() || 'No Especificado';
      const finalComprobante = newDonacion.numeroComprobante.trim() || `DEP-${Date.now().toString().slice(-6)}`;

      try {
        await addDonacion({
          donante: finalDonante,
          rutODocumentoDonante: finalRut,
          monto: Number(newDonacion.monto),
          banco: newDonacion.banco,
          numeroComprobante: finalComprobante,
          categoria: newDonacion.categoria,
          fecha: new Date().toISOString().split('T')[0],
          publico: true
        });

        setIsAddDonacionModalOpen(false);
        setNewDonacion({
          donante: '',
          rutODocumentoDonante: '',
          monto: '',
          banco: 'BancoEstado (Cta. Corriente PRUANED A.G.)',
          numeroComprobante: '',
          categoria: donationIncomeCategories[0]?.nombre || ''
        });
        alert('¡Donación bancaria registrada exitosamente!');
      } catch (error) {
        alert(error.message || 'No fue posible registrar la donación.');
      }
    }
  };

  return (
    <section className="py-12 bg-slate-50 text-slate-900 min-h-screen font-['Plus_Jakarta_Sans'] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Portal de Transparencia Abierta
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Rendición de Cuentas, Donaciones & Balance
            </h2>
            <p className="text-slate-600 text-xs mt-1">
              Registro público de donaciones bancarias y balance financiero conforme al Decreto Ley N° 2.757.
            </p>
          </div>

          {canManageFinances && (
            <button
              onClick={() => setIsAddDonacionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-transform hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Donación Bancaria
            </button>
          )}
        </div>

        {/* Info Banner for Flexible Data Entry */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-blue-950 shadow-sm">
          <Info className="w-5 h-5 text-blue-700 flex-shrink-0" />
          <p>
            <strong>Flexibilidad Contable:</strong> Si un depósito bancario no incluye el RUT, el nombre del donante o el destino específico, el sistema asigna automáticamente las etiquetas <i>"Aporte Anónimo / Depósito por Caja"</i> y <i>"Fondo General"</i>. Lo fundamental para cuadrar la caja es ingresar el <strong>Monto ($ CLP)</strong>.
          </p>
        </div>

        {/* Global Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Donaciones Recibidas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
              ${totalDonaciones.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">{donacionesList.length} aportes institucionales</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Egresos del Fondo</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 font-['Outfit']">
              ${totalEgresosDonaciones.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">Rendición de gastos de donaciones</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
              <span>Saldo Neto del Fondo</span>
              <Wallet className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">
              ${saldoCaja.toLocaleString('es-CL')} CLP
            </div>
            <p className="text-[11px] text-slate-500">Saldo exclusivo de donaciones</p>
          </div>
        </div>

        {/* DONACIONES BANCARIAS TABLE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Registro Público de Donaciones Bancarias Recibidas
              </h3>
              <p className="text-xs text-slate-500">
                Aportes depositados en las cuentas oficiales de la Asociación Gremial PRUANED A.G.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar donante o N° comprobante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-3 px-4">Fecha / Comprobante</th>
                  <th className="py-3 px-4">Donante / Identificación</th>
                  <th className="py-3 px-4">Cuenta Bancaria Destino</th>
                  <th className="py-3 px-4">Destino del Aporte</th>
                  <th className="py-3 px-4">Monto Donado</th>
                  {canManageFinances && <th className="py-3 px-4 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonaciones.map((don) => (
                  <tr key={don.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900">{don.numeroComprobante}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{don.fecha}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{don.donante}</div>
                      <div className="text-[11px] text-slate-500 font-mono">RUT/Doc: {don.rutODocumentoDonante}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {don.banco}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full">
                        {don.categoria || don.destinoAporte || 'Aporte libre'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                      +${Number(don.monto).toLocaleString('es-CL')} CLP
                    </td>

                    {canManageFinances && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteDonacion(don.id).catch(error => alert(error.message || 'No fue posible eliminar el registro.'))}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MEMORIAS Y BALANCES ANUALES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-900" />
              Memorias y Balances Anuales
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Documentos oficiales de rendición anual aprobados por asamblea.
            </p>
          </div>

          {canManageFinances && (
            <form onSubmit={handleAddBalanceSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mb-6">
              <h4 className="text-sm font-bold text-slate-800">Publicar Nuevo Documento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Título (Ej. Memoria 2025)"
                  value={newBalance.titulo}
                  onChange={e => setNewBalance({ ...newBalance, titulo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  required
                  placeholder="Año"
                  value={newBalance.anio}
                  onChange={e => setNewBalance({ ...newBalance, anio: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="url"
                  required
                  placeholder="URL del PDF"
                  value={newBalance.urlDocumento}
                  onChange={e => setNewBalance({ ...newBalance, urlDocumento: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors">
                <PlusCircle className="w-3.5 h-3.5" /> Agregar Documento
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {balancesList.map(balance => (
              <div key={balance.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-sm">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full">
                      {balance.anio}
                    </span>
                    {canManageFinances && (
                      <button onClick={() => deleteBalance(balance.id)} className="text-rose-500 hover:text-rose-700" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 mt-2 mb-1">{balance.titulo}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Publicado: {balance.fechaSubida}</p>
                </div>
                <a
                  href={balance.urlDocumento}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar PDF
                </a>
              </div>
            ))}
            {balancesList.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aún no se han publicado memorias ni balances anuales.
              </div>
            )}
          </div>
        </div>

        {/* MODAL REGISTRAR DONACIÓN BANCARIA (FLEXIBLE) */}
        {isAddDonacionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border border-slate-200">
              <button
                onClick={() => setIsAddDonacionModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div>
                <h3 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  Registrar Donación Bancaria Recibida
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Solo el monto es obligatorio. Si desconoces algún dato, el sistema lo catalogará automáticamente.
                </p>
              </div>

              <form onSubmit={handleAddDonacionSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monto de la Donación ($ CLP) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 150000"
                    value={newDonacion.monto}
                    onChange={(e) => setNewDonacion({...newDonacion, monto: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-extrabold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Donante / Entidad (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Si se desconoce, queda como 'Aporte Anónimo / Depósito por Caja'"
                    value={newDonacion.donante}
                    onChange={(e) => setNewDonacion({...newDonacion, donante: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RUT / ID (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: 65.102.940-2"
                      value={newDonacion.rutODocumentoDonante}
                      onChange={(e) => setNewDonacion({...newDonacion, rutODocumentoDonante: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">N° Comprobante (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: TRF-992014"
                      value={newDonacion.numeroComprobante}
                      onChange={(e) => setNewDonacion({...newDonacion, numeroComprobante: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cuenta Bancaria Destino</label>
                  <select
                    value={newDonacion.banco}
                    onChange={(e) => setNewDonacion({...newDonacion, banco: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="BancoEstado (Cta. Corriente PRUANED A.G.)">BancoEstado (Cta. Corriente Oficial)</option>
                    <option value="Banco de Chile (Cta. Vista PRUANED)">Banco de Chile (Cta. Vista)</option>
                    <option value="Itaú (Cta. Dólares Internacional)">Itaú (Cta. Dólares Internacional)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría del ingreso</label>
                  <select
                    required
                    disabled={!donationIncomeCategories.length}
                    value={newDonacion.categoria}
                    onChange={(e) => setNewDonacion({...newDonacion, categoria: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {!donationIncomeCategories.length && <option value="">Configura categorías en Finanzas</option>}
                    {donationIncomeCategories.map(category => <option key={category.id} value={category.nombre}>{category.nombre}</option>)}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDonacionModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Registrar Donación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
