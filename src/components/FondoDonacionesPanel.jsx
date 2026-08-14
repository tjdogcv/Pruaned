import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  Receipt,
  Settings,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INCOME_CATEGORY = 'donacion_ingreso';
const EXPENSE_CATEGORY = 'donacion_egreso';
const formatCLP = (value) => `$${Number(value || 0).toLocaleString('es-CL')} CLP`;

export const FondoDonacionesPanel = () => {
  const {
    canManageFinances,
    donacionesList = [],
    expensesList = [],
    financialCategories = [],
    financialAccounts = [],
    addDonacion,
    deleteDonacion,
    addFinancialCategory,
    archiveFinancialCategory,
    addFinancialAccount,
    removeFinancialAccount,
    updateFinancialAccountRut
  } = useAuth();

  const incomeCategories = useMemo(
    () => financialCategories.filter(category => category.tipo === INCOME_CATEGORY && category.activo),
    [financialCategories]
  );
  const expenseCategories = useMemo(
    () => financialCategories.filter(category => category.tipo === EXPENSE_CATEGORY && category.activo),
    [financialCategories]
  );
  const activeAccounts = useMemo(
    () => financialAccounts.filter(account => account.activa && account.publicada && account.rutTitular),
    [financialAccounts]
  );
  const pendingRutAccounts = useMemo(
    () => financialAccounts.filter(account => account.activa && !account.rutTitular),
    [financialAccounts]
  );

  const [newDonation, setNewDonation] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    donante: '',
    rutDonante: '',
    numeroComprobante: '',
    cuentaId: '',
    monto: '',
    categoria: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newAccount, setNewAccount] = useState({
    nombre: '',
    banco: '',
    tipoCuenta: 'Cuenta corriente',
    numeroCuenta: '',
    titular: 'PRUANED A.G.',
    rutTitular: ''
  });
  const [categoryType, setCategoryType] = useState(INCOME_CATEGORY);
  const [isSavingDonation, setIsSavingDonation] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [savingAccountRut, setSavingAccountRut] = useState(null);
  const [accountRutDrafts, setAccountRutDrafts] = useState({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!newDonation.categoria && incomeCategories[0]) {
      setNewDonation(previous => ({ ...previous, categoria: incomeCategories[0].nombre }));
    }
  }, [incomeCategories, newDonation.categoria]);

  useEffect(() => {
    if (!newDonation.cuentaId && activeAccounts[0]) {
      setNewDonation(previous => ({ ...previous, cuentaId: activeAccounts[0].id }));
    }
  }, [activeAccounts, newDonation.cuentaId]);

  if (!canManageFinances) return null;

  const donationExpenses = expensesList.filter(expense => expense.origenFondo === 'Fondo Donaciones');
  const totalIncome = donacionesList.reduce((total, donation) => total + Number(donation.monto || 0), 0);
  const totalExpenses = donationExpenses.reduce((total, expense) => total + Number(expense.monto || 0), 0);
  const availableBalance = totalIncome - totalExpenses;
  const activeCategories = categoryType === INCOME_CATEGORY ? incomeCategories : expenseCategories;

  const handleDonationSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    const selectedAccount = activeAccounts.find(account => account.id === newDonation.cuentaId);
    if (!newDonation.categoria || !selectedAccount) {
      setFeedback('Primero crea una categoría y registra una cuenta pública para el ingreso de donación.');
      return;
    }

    try {
      setIsSavingDonation(true);
      await addDonacion({
        ...newDonation,
        donante: newDonation.donante.trim() || 'Aporte anónimo / depósito directo',
        monto: Number(newDonation.monto),
        cuentaId: selectedAccount.id,
        banco: `${selectedAccount.nombre} · ${selectedAccount.banco} · ${selectedAccount.numeroCuenta}`,
        destinoAporte: newDonation.categoria,
        estado: 'Confirmada',
        publico: true
      });
      setNewDonation(previous => ({
        ...previous,
        donante: '',
        rutDonante: '',
        numeroComprobante: '',
        monto: ''
      }));
      setFeedback('Donación registrada en el Fondo de Donaciones.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible registrar la donación. Verifica la migración financiera y tu permiso.');
    } finally {
      setIsSavingDonation(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    try {
      setIsSavingCategory(true);
      await addFinancialCategory(categoryType, newCategory);
      setNewCategory('');
      setFeedback('Categoría creada y disponible para nuevos movimientos.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible crear la categoría.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleArchiveCategory = async (category) => {
    if (!window.confirm(`¿Desactivar “${category.nombre}”? Los movimientos históricos conservarán esa categoría.`)) return;
    setFeedback('');
    try {
      await archiveFinancialCategory(category.id);
      setFeedback('Categoría desactivada.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible desactivar la categoría.');
    }
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');
    try {
      setIsSavingAccount(true);
      const account = await addFinancialAccount(newAccount);
      setNewDonation(previous => ({ ...previous, cuentaId: account.id }));
      setNewAccount({
        nombre: '',
        banco: '',
        tipoCuenta: 'Cuenta corriente',
        numeroCuenta: '',
        titular: 'PRUANED A.G.',
        rutTitular: ''
      });
      setFeedback('Cuenta registrada y publicada en Transparencia.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible registrar la cuenta.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleRemoveAccount = async (account) => {
    if (!window.confirm(`¿Retirar “${account.nombre}” de las cuentas públicas? Las donaciones históricas conservarán su comprobante.`)) return;
    setFeedback('');
    try {
      await removeFinancialAccount(account.id);
      setNewDonation(previous => ({ ...previous, cuentaId: '' }));
      setFeedback('Cuenta retirada de la publicación y de los nuevos registros.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible retirar la cuenta.');
    }
  };

  const handleCompleteAccountRut = async (event, account) => {
    event.preventDefault();
    setFeedback('');
    try {
      setSavingAccountRut(account.id);
      await updateFinancialAccountRut(account.id, accountRutDrafts[account.id] || '');
      setAccountRutDrafts(previous => ({ ...previous, [account.id]: '' }));
      setFeedback('RUT guardado: la cuenta ya está publicada.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible guardar el RUT.');
    } finally {
      setSavingAccountRut(null);
    }
  };

  const handleDeleteDonation = async (donation) => {
    if (!window.confirm(`¿Eliminar el registro de ${formatCLP(donation.monto)}?`)) return;
    setFeedback('');
    try {
      await deleteDonacion(donation.id);
      setFeedback('Registro de donación eliminado.');
    } catch (error) {
      setFeedback(error.message || 'No fue posible eliminar el registro.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Libro separado</p>
            <h3 className="mt-1 flex items-center gap-2 font-['Outfit'] text-xl font-extrabold text-slate-900">
              <DollarSign className="h-5 w-5 text-emerald-600" /> Fondo de Donaciones
            </h3>
            <p className="mt-1 text-sm text-slate-600">Registra ingresos, controla el saldo disponible y gestiona las categorías del fondo.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800">
            Saldo disponible: {formatCLP(availableBalance)}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <p className="mt-4 text-2xl font-extrabold text-emerald-700">{formatCLP(totalIncome)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Ingresos por donaciones</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <TrendingDown className="h-5 w-5 text-rose-600" />
          <p className="mt-4 text-2xl font-extrabold text-rose-700">{formatCLP(totalExpenses)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Egresos imputados al fondo</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Receipt className="h-5 w-5 text-blue-700" />
          <p className={`mt-4 text-2xl font-extrabold ${availableBalance < 0 ? 'text-rose-700' : 'text-blue-900'}`}>{formatCLP(availableBalance)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Saldo exclusivo del fondo</p>
        </div>
      </section>

      {feedback && (
        <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-700">
          {feedback}
        </p>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><PlusCircle className="h-5 w-5" /></div>
            <div>
              <h4 className="font-['Outfit'] text-base font-bold text-slate-900">Registrar ingreso de donación</h4>
              <p className="text-xs text-slate-500">Cada aporte aumenta sólo el saldo del Fondo de Donaciones.</p>
            </div>
          </div>

          <form onSubmit={handleDonationSubmit} className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <label className="block font-bold text-slate-700">Fecha
              <input type="date" required value={newDonation.fecha} onChange={(event) => setNewDonation({ ...newDonation, fecha: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Monto ($ CLP)
              <input type="number" min="1" required placeholder="Ej: 150000" value={newDonation.monto} onChange={(event) => setNewDonation({ ...newDonation, monto: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Donante / entidad
              <input type="text" placeholder="Opcional: Clínica Veterinaria Norte" value={newDonation.donante} onChange={(event) => setNewDonation({ ...newDonation, donante: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">RUT o identificación
              <input type="text" placeholder="Opcional" value={newDonation.rutDonante} onChange={(event) => setNewDonation({ ...newDonation, rutDonante: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Categoría del ingreso
              <select required disabled={!incomeCategories.length} value={newDonation.categoria} onChange={(event) => setNewDonation({ ...newDonation, categoria: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                {!incomeCategories.length && <option value="">Crea una categoría para continuar</option>}
                {incomeCategories.map(category => <option key={category.id} value={category.nombre}>{category.nombre}</option>)}
              </select>
            </label>
            <label className="block font-bold text-slate-700">N° comprobante
              <input type="text" required placeholder="Ej: TRF-992014" value={newDonation.numeroComprobante} onChange={(event) => setNewDonation({ ...newDonation, numeroComprobante: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700 sm:col-span-2">Cuenta receptora pública
              <select required disabled={!activeAccounts.length} value={newDonation.cuentaId} onChange={(event) => setNewDonation({ ...newDonation, cuentaId: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
                {!activeAccounts.length && <option value="">Registra una cuenta pública para continuar</option>}
                {activeAccounts.map(account => <option key={account.id} value={account.id}>{account.nombre} · {account.banco} · {account.numeroCuenta}</option>)}
              </select>
            </label>
            <button type="submit" disabled={isSavingDonation || !incomeCategories.length || !activeAccounts.length} className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
              <PlusCircle className="h-4 w-4" /> {isSavingDonation ? 'Registrando…' : 'Registrar donación'}
            </button>
          </form>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-800"><Settings className="h-5 w-5" /></div>
            <div>
              <h4 className="font-['Outfit'] text-base font-bold text-slate-900">Categorías del fondo</h4>
              <p className="text-xs text-slate-500">Desactivar no modifica los movimientos históricos.</p>
            </div>
          </div>

          <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {[{ value: INCOME_CATEGORY, label: 'Ingresos' }, { value: EXPENSE_CATEGORY, label: 'Egresos' }].map(option => (
              <button key={option.value} type="button" onClick={() => setCategoryType(option.value)} className={`flex-1 rounded-lg px-3 py-2 transition ${categoryType === option.value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500'}`}>
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCategorySubmit} className="mt-4 flex gap-2">
            <label className="sr-only" htmlFor="financial-category-name">Nombre de categoría</label>
            <input id="financial-category-name" required value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nueva categoría" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900" />
            <button type="submit" disabled={isSavingCategory} className="inline-flex items-center gap-1 rounded-xl bg-blue-900 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60">
              <PlusCircle className="h-4 w-4" /> Añadir
            </button>
          </form>

          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {activeCategories.map(category => (
              <li key={category.id} className="flex items-center gap-2 px-3 py-2.5 text-xs">
                <Tags className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 font-semibold text-slate-700">{category.nombre}</span>
                <button type="button" onClick={() => handleArchiveCategory(category)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Desactivar categoría" aria-label={`Desactivar ${category.nombre}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {!activeCategories.length && <li className="px-3 py-5 text-center text-xs italic text-slate-500">No hay categorías activas todavía.</li>}
          </ul>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form onSubmit={handleAccountSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-800"><DollarSign className="h-5 w-5" /></div>
            <div>
              <h4 className="font-['Outfit'] text-base font-bold text-slate-900">Publicar cuenta receptora</h4>
              <p className="text-xs text-slate-500">Estos datos serán visibles en Transparencia y seleccionables en ambos registros.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <label className="block font-bold text-slate-700 sm:col-span-2">Nombre público
              <input required value={newAccount.nombre} onChange={(event) => setNewAccount({ ...newAccount, nombre: event.target.value })} placeholder="Ej: Cuenta de donaciones PRUANED" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Banco
              <input required value={newAccount.banco} onChange={(event) => setNewAccount({ ...newAccount, banco: event.target.value })} placeholder="Ej: BancoEstado" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Tipo de cuenta
              <select value={newAccount.tipoCuenta} onChange={(event) => setNewAccount({ ...newAccount, tipoCuenta: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900"><option>Cuenta corriente</option><option>Cuenta vista</option><option>Cuenta de ahorro</option><option>Cuenta digital</option></select>
            </label>
            <label className="block font-bold text-slate-700">Número de cuenta
              <input required value={newAccount.numeroCuenta} onChange={(event) => setNewAccount({ ...newAccount, numeroCuenta: event.target.value })} placeholder="Número visible al público" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700">Titular
              <input required value={newAccount.titular} onChange={(event) => setNewAccount({ ...newAccount, titular: event.target.value })} placeholder="PRUANED A.G." className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-slate-900" />
            </label>
            <label className="block font-bold text-slate-700 sm:col-span-2">RUT del titular
              <input required value={newAccount.rutTitular} onChange={(event) => setNewAccount({ ...newAccount, rutTitular: event.target.value })} placeholder="Ej: 76.123.456-7" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono text-slate-900" />
            </label>
            <button type="submit" disabled={isSavingAccount} className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"><PlusCircle className="h-4 w-4" /> {isSavingAccount ? 'Publicando…' : 'Registrar y publicar cuenta'}</button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><Receipt className="h-5 w-5" /></div>
            <div><h4 className="font-['Outfit'] text-base font-bold text-slate-900">Cuentas públicas activas</h4><p className="text-xs text-slate-500">Retirar una cuenta la oculta de Transparencia y de nuevos aportes, sin borrar su historial.</p></div>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {activeAccounts.map(account => (
              <li key={account.id} className="flex flex-col gap-2 px-4 py-3 text-xs sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><p className="font-bold text-slate-800">{account.nombre}</p><p className="mt-0.5 text-slate-500">{account.banco} · {account.tipoCuenta} · <span className="font-mono">{account.numeroCuenta}</span> · {account.titular} · RUT <span className="font-mono">{account.rutTitular}</span></p></div>
                <span className="w-fit rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">Pública</span>
                <button type="button" onClick={() => handleRemoveAccount(account)} className="inline-flex w-fit items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Retirar</button>
              </li>
            ))}
            {!activeAccounts.length && <li className="px-4 py-8 text-center text-xs italic text-slate-500">Aún no hay cuentas públicas. Registra la primera para habilitar donaciones.</li>}
          </ul>
          {pendingRutAccounts.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-900">Cuentas pendientes de RUT</p>
              <p className="mt-1 text-[11px] text-amber-800">Completa el RUT para publicarlas y permitir que reciban nuevas donaciones.</p>
              <div className="mt-3 space-y-2">
                {pendingRutAccounts.map(account => (
                  <form key={account.id} onSubmit={(event) => handleCompleteAccountRut(event, account)} className="flex flex-col gap-2 sm:flex-row">
                    <span className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">{account.nombre}</span>
                    <input required value={accountRutDrafts[account.id] || ''} onChange={(event) => setAccountRutDrafts(previous => ({ ...previous, [account.id]: event.target.value }))} placeholder="RUT del titular" className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-slate-900" />
                    <button type="submit" disabled={savingAccountRut === account.id} className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60">{savingAccountRut === account.id ? 'Guardando…' : 'Publicar'}</button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-emerald-700" />
          <h4 className="font-['Outfit'] text-base font-bold text-slate-900">Últimos ingresos del fondo</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Fecha / comprobante</th><th className="px-3 py-3">Registro</th><th className="px-3 py-3">Categoría</th><th className="px-3 py-3 text-right">Monto</th><th className="px-3 py-3 text-right">Acción</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {donacionesList.slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 12).map(donation => (
                <tr key={donation.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3"><p className="font-mono font-bold text-slate-800">{donation.numeroComprobante || donation.nComprobante || 'Sin comprobante'}</p><p className="mt-0.5 text-[10px] text-slate-400">{donation.fecha}</p></td>
                  <td className="px-3 py-3 font-semibold text-slate-500">Donación confidencial</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 font-bold text-emerald-800">{donation.categoria || donation.destinoAporte || 'Aporte libre'}</span></td>
                  <td className="px-3 py-3 text-right font-mono font-extrabold text-emerald-700">+{formatCLP(donation.monto)}</td>
                  <td className="px-3 py-3 text-right"><button type="button" onClick={() => handleDeleteDonation(donation)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Eliminar registro" aria-label={`Eliminar donación de ${formatCLP(donation.monto)}`}><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {!donacionesList.length && <tr><td colSpan="5" className="px-3 py-10 text-center text-sm text-slate-500">Aún no existen ingresos registrados en el Fondo de Donaciones.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
