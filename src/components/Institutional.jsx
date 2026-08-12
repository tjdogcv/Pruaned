import React, { useState } from 'react';
import { INITIAL_TECHNICAL_DIRECTIONS } from '../data/initialData';
import { 
  Building, 
  Users, 
  Activity, 
  ShieldAlert, 
  Globe, 
  Handshake, 
  Heart, 
  Wheat, 
  Feather, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Layers,
  Award
} from 'lucide-react';

const ICON_MAP = {
  Users: Users,
  Activity: Activity,
  ShieldAlert: ShieldAlert,
  Globe: Globe,
  Handshake: Handshake,
  Heart: Heart,
  Wheat: Wheat,
  Feather: Feather
};

export const Institutional = () => {
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('direcciones');

  return (
    <section className="py-16 bg-slate-50 text-slate-900 min-h-screen border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" /> Estructura Orgánica 2025
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
            Las 8 Direcciones Técnicas & Estatutos
          </h2>
          <p className="text-slate-600 text-sm font-normal">
            Estructura Directiva Administrativa y Técnico-Operativa de respuesta en emergencias (Art. 8 bis).
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center">
          <div className="inline-flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 gap-1">
            <button
              onClick={() => setActiveSubTab('direcciones')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'direcciones'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              8 Direcciones Técnicas
            </button>
            <button
              onClick={() => setActiveSubTab('directiva')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'directiva'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Directorio Nacional (Art. 22)
            </button>
            <button
              onClick={() => setActiveSubTab('estatutos')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeSubTab === 'estatutos'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              Estatutos & Cuotas (Art. 42)
            </button>
          </div>
        </div>

        {/* SUBTAB 1: 8 DIRECTIONS GRID */}
        {activeSubTab === 'direcciones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {INITIAL_TECHNICAL_DIRECTIONS.map((dir) => {
              const IconComponent = ICON_MAP[dir.icon] || Layers;
              return (
                <div
                  key={dir.id}
                  onClick={() => setSelectedDirection(dir)}
                  className="card-inst p-6 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold group-hover:bg-blue-900 group-hover:text-white transition-colors">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-blue-900 transition-colors">
                      {dir.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                      {dir.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-blue-900 font-semibold">
                    <span>Ver funciones</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUBTAB 2: DIRECTORIO NACIONAL */}
        {activeSubTab === 'directiva' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Award className="w-6 h-6 text-blue-900" />
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  Directorio Nacional Fundador (Art. 22)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-blue-900 font-bold uppercase">Presidente / a</span>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Representación Judicial & Estratégica</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Representante legal. Preside la Asamblea General, firma convenios marco y lidera la coordinación en emergencias (Art. 26).
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-blue-900 font-bold uppercase">Vicepresidente / a</span>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Coordinación de Alianzas</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Subroga al Presidente, articula relaciones interinstitucionales y supervisa las 8 Direcciones Técnicas (Art. 27).
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-blue-900 font-bold uppercase">Secretario / a</span>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Registro & Fe Pública</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Lleva el padrón actualizado de socios y voluntarios, custodia las actas oficiales y gestiona la transparencia (Art. 28).
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-blue-900 font-bold uppercase">Tesorero / a</span>
                  <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Tesorería & Rendición</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Administra el patrimonio, cuotas sociales, presupuesto anual y rinde cuentas trimestrales al Directorio (Art. 29).
                  </p>
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
