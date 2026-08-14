import React from 'react';
import logoImg from './pruaned-official-logo.png';

export const PRUANEDLogo = ({
  className = "h-12 w-auto",
  showText = true,
  style = {},
  imageClassName = 'h-full',
  textClassName = '',
  descriptorClassName = 'truncate',
}) => {
  const descriptor = 'Gestión del Riesgo de Desastres Animal';

  return (
    <div className={`inline-flex min-w-0 max-w-full items-center gap-3.5 select-none ${className}`} style={{ maxHeight: '100%', ...style }}>
      <img
        src={logoImg}
        alt="PRUANED A.G. Escudo Oficial"
        className={`w-auto max-w-full object-contain flex-shrink-0 ${imageClassName}`}
        style={{ maxHeight: '100%', width: 'auto', display: 'block' }}
      />
      {showText && (
        <div className={`min-w-0 flex flex-col leading-tight ${textClassName}`}>
          <span className="whitespace-nowrap font-extrabold text-base text-slate-900 tracking-wider font-['Outfit']">
            PRUANED <span className="text-[10px] px-1.5 py-0.5 bg-blue-900 text-white rounded font-normal">A.G.</span>
          </span>
          <span
            className={`block min-w-0 text-[10px] text-slate-500 font-medium ${descriptorClassName}`}
            title={descriptor}
            aria-label={descriptor}
          >
            {descriptor}
          </span>
        </div>
      )}
    </div>
  );
};
