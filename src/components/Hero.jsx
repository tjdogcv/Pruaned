import React from 'react';
import { PRUANEDLogo } from '../assets/PRUANEDLogo';
import { INSTITUTIONAL_INFO } from '../data/initialData';
import { Shield, Lock, ArrowRight, Award, Flame, Heart, Wheat, Zap } from 'lucide-react';

export const Hero = ({ onOpenAuth, onNavigate }) => {
  return (
    <section className="bg-slate-900 text-white py-14 lg:py-20 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Official Badge */}
        <div className="flex justify-center lg:justify-start mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold shadow-sm">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Asociación Gremial Oficial • {INSTITUTIONAL_INFO.legalId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold font-['Outfit'] leading-tight tracking-tight text-white">
                Inclusión de la Vida Animal en la <br className="hidden sm:inline" />
                <span className="text-blue-400">Gestión del Riesgo de Desastres</span>
              </h1>

              {/* Official Motto */}
              <p className="text-base sm:text-xl font-bold text-amber-400 italic font-['Outfit']">
                "{INSTITUTIONAL_INFO.motto}"
              </p>

              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-light leading-relaxed">
                PRUANED A.G. unifica a profesionales, técnicos y personal operativo capacitado para integrar la dimensión animal en prevención, mitigación, respuesta y recuperación ante catástrofes en Chile.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all border border-emerald-400/30"
              >
                <Lock className="w-4 h-4 text-emerald-100" />
                Ingreso Intranets (Socios & Voluntarios)
              </button>

              <button
                onClick={() => onNavigate('institutional')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                Conocer Estatutos & Reglamentos 2025
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-left">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-extrabold text-white font-['Outfit']">8</div>
                <div className="text-[11px] text-slate-400 font-medium">Direcciones Técnicas</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-extrabold text-emerald-400 font-['Outfit']">One Health</div>
                <div className="text-[11px] text-slate-400 font-medium">Enfoque Transversal</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xl font-extrabold text-blue-400 font-['Outfit']">100% QR</div>
                <div className="text-[11px] text-slate-400 font-medium">Certificados Oficiales</div>
              </div>
            </div>

          </div>

          {/* Right Column: Controlled Size Logo Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm space-y-4">
              
              {/* Crest Logo Box with explicit height constraint */}
              <div className="flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-100 h-36">
                <PRUANEDLogo className="h-28 w-auto" showText={true} />
              </div>

              {/* 4 Quadrants Summary */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                <div className="p-2 bg-red-50 text-red-800 rounded-lg border border-red-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> Incendios & Rescate
                </div>
                <div className="p-2 bg-green-50 text-green-800 rounded-lg border border-green-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> Mascotas & Albergues
                </div>
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Ganado & Pecuario
                </div>
                <div className="p-2 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" /> Fauna & Inundaciones
                </div>
              </div>

              {/* Legal Address Notice */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Domicilio Legal:</span>
                  <span className="font-bold text-slate-900">San Fabián de Alico, Ñuble</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correo Oficial:</span>
                  <span className="font-bold text-blue-900">ag.pruaned@gmail.com</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
