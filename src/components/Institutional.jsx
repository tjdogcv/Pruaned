import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INSTITUTIONAL_INFO, INITIAL_TECHNICAL_DIRECTIONS } from '../data/initialData';
import { 
  Building, 
  ShieldCheck, 
  Users, 
  Activity, 
  ShieldAlert, 
  Globe, 
  Handshake, 
  Heart, 
  Wheat, 
  Feather,
  Award,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export const Institutional = () => {
  const { getDirectorioMember, updateDirectorioCargo, isMasterUser, sociosList } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('directions'); // directions, directorio, estatutos
  const [selectedDirection, setSelectedDirection] = useState(null);

  const presidente = getDirectorioMember('presidenteId');
  const vicepresidente = getDirectorioMember('vicepresidenteId');
  const secretario = getDirectorioMember('secretarioId');
  const tesorero = getDirectorioMember('tesoreroId');

  return (
    <section className="py-16 bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans'] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Building className="w-4 h-4 text-blue-800" /> Estructura Orgánica Gremial
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
            Gobierno Corporativo & Direcciones Técnicas
          </h2>
          
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Decreto Ley N° 2.757 de 1979 • Estructura de gobernanza interdisciplinaria para la gestión del riesgo de desastres animal.
          </p>

          {/* Subtabs Selector */}
          <div className="inline-flex bg-slate-200 p-1.5 rounded-2xl border border-slate-300 gap-1.5 shadow-inner">
            <button
              onClick={() => setActiveSubTab('directions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'directions'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              8 Direcciones Técnicas
            </button>

            <button
              onClick={() => setActiveSubTab('directorio')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'directorio'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Directorio Nacional
            </button>

            <button
              onClick={() => setActiveSubTab('estatutos')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'estatutos'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Estatutos & Membresías
            </button>
          </div>
        </div>

        {/* SUBTAB 1: LAS 8 DIRECCIONES TÉCNICAS */}
        {activeSubTab === 'directions' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {INITIAL_TECHNICAL_DIRECTIONS.map((dir) => (
              <div 
                key={dir.id}
                onClick={() => setSelectedDirection(dir)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold border border-blue-100 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <Building className="w-5 h-5" />
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-blue-900 transition-colors leading-snug">
                    {dir.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {dir.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:translate-x-1 transition-transform">
                  <span>Ver Detalle Operativo</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 2: DIRECTORIO NACIONAL (CON FOTOS DINÁMICAS EN TIEMPO REAL) */}
        {activeSubTab === 'directorio' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
                    <Award className="w-3.5 h-3.5" /> Equipo Ejecutivo
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-3">
                    Directorio Nacional
                  </h2>
                  <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                    Integrantes elegidos conforme al Decreto Ley N° 2.757. Fotos y cargos actualizados en tiempo real.
                  </p>
                </div>
                
                {isMasterUser && (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-900 text-xs font-bold rounded-full flex items-center gap-1.5">
                      👑 Asignación de Cargos Habilitada (Maestro)
                    </span>
                    <button 
                      onClick={() => alert('¡Los cargos del Directorio Nacional han sido guardados exitosamente!')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                )}
              </div>

              {/* DIRECTORIO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* 1. PRESIDENTE / A */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold uppercase rounded-full tracking-wider">
                        Presidente / a
                      </span>
                      {isMasterUser && (
                        <select
                          value={presidente?.id}
                          onChange={(e) => updateDirectorioCargo('presidenteId', e.target.value)}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                        >
                          {sociosList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={presidente?.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(presidente?.nombre || 'Presidente')}&background=0D8ABC&color=fff&size=150`}
                        alt={presidente?.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                          {presidente?.nombre}
                        </h4>
                        <p className="text-xs text-blue-900 font-semibold">{presidente?.profesion}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{presidente?.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-800">Representación Judicial & Estratégica</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Representante legal. Preside la Asamblea General, firma convenios marco y lidera la coordinación en emergencias (Art. 26).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. VICEPRESIDENTE / A */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold uppercase rounded-full tracking-wider">
                        Vicepresidente / a
                      </span>
                      {isMasterUser && (
                        <select
                          value={vicepresidente?.id}
                          onChange={(e) => updateDirectorioCargo('vicepresidenteId', e.target.value)}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                        >
                          {sociosList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={vicepresidente?.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(vicepresidente?.nombre || 'Vicepresidente')}&background=0D8ABC&color=fff&size=150`}
                        alt={vicepresidente?.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                          {vicepresidente?.nombre}
                        </h4>
                        <p className="text-xs text-blue-900 font-semibold">{vicepresidente?.profesion}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{vicepresidente?.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-800">Coordinación de Alianzas</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Subroga al Presidente, articula relaciones interinstitucionales y supervisa las 8 Direcciones Técnicas (Art. 27).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. SECRETARIO / A */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold uppercase rounded-full tracking-wider">
                        Secretario / a
                      </span>
                      {isMasterUser && (
                        <select
                          value={secretario?.id}
                          onChange={(e) => updateDirectorioCargo('secretarioId', e.target.value)}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                        >
                          {sociosList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={secretario?.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(secretario?.nombre || 'Secretario')}&background=0D8ABC&color=fff&size=150`}
                        alt={secretario?.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                          {secretario?.nombre}
                        </h4>
                        <p className="text-xs text-blue-900 font-semibold">{secretario?.profesion}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{secretario?.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-800">Registro & Fe Pública</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Lleva el padrón actualizado de socios y voluntarios, custodia las actas oficiales y gestiona la transparencia (Art. 28).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. TESORERO / A */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold uppercase rounded-full tracking-wider">
                        Tesorero / a
                      </span>
                      {isMasterUser && (
                        <select
                          value={tesorero?.id}
                          onChange={(e) => updateDirectorioCargo('tesoreroId', e.target.value)}
                          className="text-[10px] bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                        >
                          {sociosList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={tesorero?.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(tesorero?.nombre || 'Tesorero')}&background=0D8ABC&color=fff&size=150`}
                        alt={tesorero?.nombre}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-600 shadow-md flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                          {tesorero?.nombre}
                        </h4>
                        <p className="text-xs text-blue-900 font-semibold">{tesorero?.profesion}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{tesorero?.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-800">Tesorería & Rendición</div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Administra el patrimonio, cuotas sociales, presupuesto anual y rinde cuentas trimestrales al Directorio (Art. 29).
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 3: ESTATUTOS & CUOTAS */}
        {activeSubTab === 'estatutos' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  Categorías de Membresía & Suspensión de Cuotas (Art. 42)
                </h3>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <h4 className="font-bold text-emerald-900 text-sm">Categorías de Socios (Art. 9)</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Socios Activos (voz y voto), Socios Adherentes (voz sin voto), Socios Honorarios (exentos de cuota), Colaboraciones Institucionales (Universidades y ONG) y Voluntarios Permanentes vs. Espontáneos (Art. 61).
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                  <h4 className="font-bold text-blue-900 text-sm">Suspensión Temporal de Cuotas (Art. 42)</h4>
                  <p className="text-blue-800 leading-relaxed">
                    Los socios pueden solicitar formalmente al Directorio Nacional la suspensión temporal justificada de su cuota social sin perjudicar su estado como asociado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Direction Detail Modal */}
        {selectedDirection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5 relative border border-slate-200">
              <button
                onClick={() => setSelectedDirection(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-['Outfit']">{selectedDirection.title}</h3>
                  <span className="text-xs text-blue-900 font-semibold">{selectedDirection.director}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedDirection.description}
              </p>

              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-200">
                <div className="font-bold text-slate-800 uppercase">Funciones Clave:</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Planes anuales con indicadores de gestión</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Reportes trimestrales al Directorio Nacional</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Coordinación operativa con autoridades en emergencias</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDirection(null)}
                className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
