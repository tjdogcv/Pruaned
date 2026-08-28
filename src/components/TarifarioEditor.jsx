import React, { useState } from 'react';
import { Settings, Save, PenTool } from 'lucide-react';

export const TarifarioEditor = ({ financialSettings, onSave, isMasterUser, canManageCategoriesAndCargos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tarifas, setTarifas] = useState({
    "Socio Activo": financialSettings.cuotasPorCategoria?.["Socio Activo"] ?? 0,
    "Socio Adherente": financialSettings.cuotasPorCategoria?.["Socio Adherente"] ?? 0,
    "Socio Honorario": financialSettings.cuotasPorCategoria?.["Socio Honorario"] ?? 0,
    "Estudiante/Pasante": financialSettings.cuotasPorCategoria?.["Estudiante/Pasante"] ?? 0
  });

  const hasPermission = isMasterUser || canManageCategoriesAndCargos;

  const handleSave = () => {
    onSave(tarifas, financialSettings.cuotaIncorporacionActual);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-900" />
          Tarifario de Cuotas Mensuales
        </h3>
        {hasPermission && (
          isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"><Save className="w-3.5 h-3.5"/> Guardar</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"><PenTool className="w-3.5 h-3.5"/> Editar Tarifas</button>
          )
        )}
      </div>
      
      <p className="text-xs leading-5 text-slate-600">
        Valores vigentes de referencia. Define la cuota correspondiente a cada categoría. 
        Este valor será usado por defecto al incorporar un socio o emitir cobros masivos.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {['Socio Activo', 'Socio Adherente', 'Socio Honorario', 'Estudiante/Pasante'].map(cat => (
          <div key={cat}>
            <label className="block font-bold text-slate-700 mb-1">{cat} ($)</label>
            <input
              type="number"
              value={isEditing ? tarifas[cat] : (financialSettings.cuotasPorCategoria?.[cat] ?? 0)}
              onChange={e => setTarifas({ ...tarifas, [cat]: Number(e.target.value) })}
              readOnly={!isEditing}
              className={`w-full rounded-xl border p-2 text-slate-700 ${isEditing ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-100 outline-none' : 'border-slate-200 bg-slate-100 cursor-default'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};