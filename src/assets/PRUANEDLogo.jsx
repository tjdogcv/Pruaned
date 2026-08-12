import React from 'react';
import logoImg from './pruaned-official-logo.png';

export const PRUANEDLogo = ({ className = "h-12 w-auto", showText = true, style = {} }) => {
  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`} style={{ maxHeight: '100%', ...style }}>
      <img
        src={logoImg}
        alt="PRUANED A.G. Escudo Oficial"
        className="h-full w-auto object-contain flex-shrink-0"
        style={{ maxHeight: '100%', width: 'auto', display: 'block' }}
      />
      {showText && (
        <div className="flex flex-col leading-tight whitespace-nowrap">
          <span className="font-extrabold text-base text-slate-900 tracking-wider font-['Outfit']">
            PRUANED <span className="text-[10px] px-1.5 py-0.5 bg-blue-900 text-white rounded font-normal">A.G.</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Gestión del Riesgo de Desastres Animal
          </span>
        </div>
      )}
    </div>
  );
};
