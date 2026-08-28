import { useState } from 'react';
import { INITIAL_DONACIONES, INITIAL_FINANCIAL_SETTINGS } from '../data/initialData';
import { isSupabaseReady, supabase } from '../lib/supabase';
import { DEFAULT_FINANCIAL_CATEGORIES, formatChileanRut, isValidChileanRut, toPublicDonation } from '../lib/authData';

/** Estado y operaciones financieras; AuthContext conserva la API pública. */
export const useFinanceDomain = ({ supabaseReady, currentUser, addSecurityLog, setSociosList }) => {
const [donacionesList, setDonacionesList] = useState(() => {
  if (supabaseReady) return [];
  const saved = localStorage.getItem('pruaned_donaciones');
  return saved ? JSON.parse(saved) : INITIAL_DONACIONES;
});
const [publicDonationsList, setPublicDonationsList] = useState(() => (
  supabaseReady ? [] : INITIAL_DONACIONES.map(toPublicDonation)
));
const [financialSettings, setFinancialSettings] = useState(INITIAL_FINANCIAL_SETTINGS);
const [expensesList, setExpensesList] = useState([]);
const [financialCategories, setFinancialCategories] = useState(() => (
  supabaseReady ? [] : DEFAULT_FINANCIAL_CATEGORIES
));
const [financialAccounts, setFinancialAccounts] = useState([]);
const [cobrosList, setCobrosList] = useState([]);
const [balancesList, setBalancesList] = useState([]);

const addDonacion = async (donacionData) => {
  const monto = Number(donacionData.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto de la donación debe ser mayor que cero.');
  }
  if (!donacionData.cuentaId && !donacionData.cuenta_id) {
    throw new Error('Selecciona una cuenta pública receptora antes de registrar la donación.');
  }

  let itemWithId;
  if (isSupabaseReady()) {
    const { data, error } = await supabase.from('donaciones').insert([{
      fecha: donacionData.fecha,
      donante: donacionData.donante,
      rut_donante: donacionData.rutDonante || donacionData.rutODocumentoDonante || donacionData.rut_donante || null,
      monto,
      banco: donacionData.banco || null,
      cuenta_id: donacionData.cuentaId || donacionData.cuenta_id || null,
      numero_comprobante: donacionData.numeroComprobante || donacionData.numero_comprobante || null,
      destino_aporte: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre',
      categoria: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre',
      metodo_pago: donacionData.metodoPago || donacionData.metodo_pago || 'Transferencia',
      codigo_transaccion: donacionData.codigoTransaccion || donacionData.codigo_transaccion || null,
      estado: donacionData.estado || 'Confirmada',
      publico: donacionData.publico ?? true
    }]).select().single();

    if (error) throw error;
    itemWithId = {
      ...donacionData,
      id: data.id,
      fecha: data.fecha,
      monto: data.monto,
      donante: data.donante,
      rutDonante: data.rut_donante,
      rutODocumentoDonante: data.rut_donante,
      banco: data.banco,
      cuentaId: data.cuenta_id,
      numeroComprobante: data.numero_comprobante || data.n_comprobante,
      destinoAporte: data.destino_aporte,
      categoria: data.categoria || data.destino_aporte
    };
  } else {
    itemWithId = {
      ...donacionData,
      id: `don-${Date.now()}`,
      monto,
      categoria: donacionData.categoria || donacionData.destinoAporte || 'Aporte libre'
    };
  }

  setDonacionesList(prev => [itemWithId, ...prev]);
  if (donacionData.publico ?? true) setPublicDonationsList(prev => [toPublicDonation(itemWithId), ...prev]);
  addSecurityLog(`ADD_BANK_DONATION_${monto}`, currentUser?.email, "INFO");
  return itemWithId;
};

const deleteDonacion = async (id) => {
  if (isSupabaseReady()) {
    const { error } = await supabase.from('donaciones').delete().eq('id', id);
    if (error) throw error;
  }
  setDonacionesList(prev => prev.filter(d => d.id !== id));
  setPublicDonationsList(prev => prev.filter(d => d.id !== id));
  addSecurityLog(`DELETE_DONATION_${id}`, currentUser?.email, "WARN");
};

const updateFinancialSettings = async (newCuotaMensualOrObject, newCuotaIncorporacion) => {
  let updatedCuotasPorCategoria = financialSettings.cuotasPorCategoria || {
    "Socio Activo": 0, "Socio Adherente": 0, "Socio Honorario": 0, "Estudiante/Pasante": 0
  };
  let updatedCuotaMensualActual = financialSettings.cuotaMensualActual;
  let updatedCuotaIncorporacionActual = Number(newCuotaIncorporacion);
  
  if (typeof newCuotaMensualOrObject === 'object' && newCuotaMensualOrObject !== null) {
      updatedCuotasPorCategoria = {
        "Socio Activo": Number(newCuotaMensualOrObject["Socio Activo"] || 0),
        "Socio Adherente": Number(newCuotaMensualOrObject["Socio Adherente"] || 0),
        "Socio Honorario": Number(newCuotaMensualOrObject["Socio Honorario"] || 0),
        "Estudiante/Pasante": Number(newCuotaMensualOrObject["Estudiante/Pasante"] || 0)
      };
      updatedCuotaMensualActual = updatedCuotasPorCategoria["Socio Activo"];
      if (newCuotaIncorporacion === undefined) {
         updatedCuotaIncorporacionActual = financialSettings.cuotaIncorporacionActual;
      }
  } else {
      updatedCuotaMensualActual = Number(newCuotaMensualOrObject);
      updatedCuotasPorCategoria = {
        ...updatedCuotasPorCategoria,
        "Socio Activo": updatedCuotaMensualActual,
        "Socio Adherente": updatedCuotaMensualActual
      };
  }

  const updated = {
    cuotaMensualActual: updatedCuotaMensualActual,
    cuotaIncorporacionActual: updatedCuotaIncorporacionActual,
    cuotasPorCategoria: updatedCuotasPorCategoria
  };

  setFinancialSettings(updated);
  if (isSupabaseReady()) {
    try {
      await supabase.from('parametros_sistema').upsert({ id: 'financial_settings', valor: updated });
    } catch (err) { console.error('Error updating financial settings:', err); }
  }
  
  // Opcional: Actualizar las cuotas mensuales de los socios en memoria.
  // En un sistema real, el cobro debería usar el tarifario al momento de emitir, 
  // pero mantendremos este mapeo para compatibilidad con el resto del código.
  setSociosList(prev => prev.map(s => {
    const tarifaSocio = updatedCuotasPorCategoria[s.categoria] ?? updatedCuotaMensualActual;
    return { ...s, montoCuotaMensual: tarifaSocio };
  }));
};

const addExpense = async (expenseItem) => {
  const monto = Number(expenseItem.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('El monto del egreso debe ser mayor que cero.');
  }

  if (isSupabaseReady()) {
    const dbItem = {
      fecha: expenseItem.fecha,
      tipo_documento: expenseItem.tipoDocumento,
      numero_documento: expenseItem.numeroDocumento,
      proveedor: expenseItem.proveedor,
      categoria: expenseItem.categoria,
      origen_fondo: expenseItem.origenFondo || 'Fondo Cuotas',
      monto,
      glosa: expenseItem.glosa
    };
    const { data, error } = await supabase.from('egresos').insert([dbItem]).select();
    if (error) throw error;
    if (data && data.length > 0) {
      const d = data[0];
      setExpensesList(prev => [...prev, {
        id: d.id, fecha: d.fecha, tipoDocumento: d.tipo_documento, 
        numeroDocumento: d.numero_documento, proveedor: d.proveedor, 
        categoria: d.categoria, origenFondo: d.origen_fondo, 
        monto: d.monto, glosa: d.glosa
      }]);
    }
  } else {
    const itemWithId = { ...expenseItem, monto, id: `exp-${Date.now()}` };
    setExpensesList(prev => [...prev, itemWithId]);
  }
  addSecurityLog(`ADD_EXPENSE_${expenseItem.origenFondo || 'Fondo Cuotas'}_${monto}`, currentUser?.email, "INFO");
};

const deleteExpense = async (id) => {
  if (isSupabaseReady()) {
    const { error } = await supabase.from('egresos').delete().eq('id', id);
    if (error) throw error;
  }
  setExpensesList(prev => prev.filter(e => e.id !== id));
};

const addFinancialCategory = async (tipo, nombre) => {
  if (!['donacion_ingreso', 'donacion_egreso'].includes(tipo)) {
    throw new Error('Tipo de categoría financiera no válido.');
  }

  const safeName = nombre.trim().replace(/\s+/g, ' ');
  if (safeName.length < 2) throw new Error('Ingresa un nombre de categoría válido.');
  if (financialCategories.some(category => (
    category.tipo === tipo && category.nombre.trim().toLocaleLowerCase('es-CL') === safeName.toLocaleLowerCase('es-CL')
  ))) {
    throw new Error('Esa categoría ya existe.');
  }

  let category;
  if (isSupabaseReady()) {
    const { data, error } = await supabase
      .from('categorias_financieras')
      .insert({ tipo, nombre: safeName })
      .select()
      .single();
    if (error) throw error;
    category = { id: data.id, tipo: data.tipo, nombre: data.nombre, activo: data.activo };
  } else {
    category = { id: `offline-finance-category-${Date.now()}`, tipo, nombre: safeName, activo: true };
  }

  setFinancialCategories(prev => [...prev, category].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  addSecurityLog(`ADD_FINANCIAL_CATEGORY_${tipo}`, currentUser?.email, 'INFO');
  return category;
};

const archiveFinancialCategory = async (id) => {
  if (isSupabaseReady()) {
    const { error } = await supabase
      .from('categorias_financieras')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }
  setFinancialCategories(prev => prev.map(category => (
    category.id === id ? { ...category, activo: false } : category
  )));
  addSecurityLog('ARCHIVE_FINANCIAL_CATEGORY', currentUser?.email, 'WARN');
};

const addFinancialAccount = async (accountData) => {
  const nombre = accountData.nombre?.trim().replace(/\s+/g, ' ');
  const banco = accountData.banco?.trim().replace(/\s+/g, ' ');
  const tipoCuenta = accountData.tipoCuenta?.trim();
  const numeroCuenta = accountData.numeroCuenta?.trim().replace(/\s+/g, ' ');
  const titular = accountData.titular?.trim().replace(/\s+/g, ' ');
  const rutTitular = formatChileanRut(accountData.rutTitular);

  if (!nombre || !banco || !tipoCuenta || !numeroCuenta || !titular || !rutTitular) {
    throw new Error('Completa nombre público, banco, tipo, número, titular y RUT de la cuenta.');
  }
  if (!isValidChileanRut(rutTitular)) throw new Error('El RUT del titular no es válido.');

  let account;
  if (isSupabaseReady()) {
    const { data, error } = await supabase
      .from('cuentas_financieras')
      .insert({
        nombre,
        banco,
        tipo_cuenta: tipoCuenta,
        numero_cuenta: numeroCuenta,
        titular,
        rut_titular: rutTitular,
        publicada: true,
        activa: true
      })
      .select()
      .single();
    if (error) throw error;
    account = {
      id: data.id,
      nombre: data.nombre,
      banco: data.banco,
      tipoCuenta: data.tipo_cuenta,
      numeroCuenta: data.numero_cuenta,
      titular: data.titular,
      rutTitular: data.rut_titular,
      publicada: data.publicada,
      activa: data.activa
    };
  } else {
    account = {
      id: `offline-financial-account-${Date.now()}`,
      nombre,
      banco,
      tipoCuenta,
      numeroCuenta,
      titular,
      rutTitular,
      publicada: true,
      activa: true
    };
  }

  setFinancialAccounts(previous => [...previous, account].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  addSecurityLog('ADD_PUBLIC_FINANCIAL_ACCOUNT', currentUser?.email, 'INFO');
  return account;
};

const removeFinancialAccount = async (id) => {
  if (isSupabaseReady()) {
    const { error } = await supabase
      .from('cuentas_financieras')
      .update({ activa: false, publicada: false })
      .eq('id', id);
    if (error) throw error;
  }
  setFinancialAccounts(previous => previous.filter(account => account.id !== id));
  addSecurityLog('REMOVE_PUBLIC_FINANCIAL_ACCOUNT', currentUser?.email, 'WARN');
};

const updateFinancialAccountRut = async (id, rawRut) => {
  const rutTitular = formatChileanRut(rawRut);
  if (!isValidChileanRut(rutTitular)) throw new Error('El RUT del titular no es válido.');
  if (isSupabaseReady()) {
    const { error } = await supabase
      .from('cuentas_financieras')
      .update({ rut_titular: rutTitular, publicada: true, activa: true })
      .eq('id', id);
    if (error) throw error;
  }
  setFinancialAccounts(previous => previous.map(account => (
    account.id === id ? { ...account, rutTitular, publicada: true, activa: true } : account
  )));
  addSecurityLog('UPDATE_PUBLIC_FINANCIAL_ACCOUNT_RUT', currentUser?.email, 'INFO');
};

const addCobrosBatch = async (cobrosArray) => {
  if (isSupabaseReady()) {
    const dbItems = cobrosArray.map(c => ({
      socio_id: c.socioId,
      titulo: c.titulo,
      monto: c.monto,
      pagado: c.pagado || false
    }));
    const { data, error } = await supabase.from('cobros').insert(dbItems).select();
    if (!error && data) {
      const camelData = data.map(d => ({
        id: d.id, socioId: d.socio_id, titulo: d.titulo, monto: d.monto, pagado: d.pagado, fechaCreacion: d.fecha_creacion
      }));
      setCobrosList(prev => [...prev, ...camelData]);
    }
  } else {
    const localData = cobrosArray.map((c, i) => ({ ...c, id: `cobro-${Date.now()}-${i}` }));
    setCobrosList(prev => [...prev, ...localData]);
  }
};

  return {
    donacionesList, setDonacionesList, publicDonationsList, setPublicDonationsList, addDonacion, deleteDonacion,
    financialSettings, setFinancialSettings, updateFinancialSettings,
    expensesList, setExpensesList, addExpense, deleteExpense,
    financialCategories, setFinancialCategories, addFinancialCategory, archiveFinancialCategory,
    financialAccounts, setFinancialAccounts, addFinancialAccount, removeFinancialAccount, updateFinancialAccountRut,
    cobrosList, setCobrosList, addCobrosBatch, balancesList, setBalancesList
  };
};
