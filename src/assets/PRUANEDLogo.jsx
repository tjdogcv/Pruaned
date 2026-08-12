import React from 'react';

export const PRUANEDLogo = ({ className = "h-12 w-auto", showText = true, style = {} }) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`} style={{ maxHeight: '100%', ...style }}>
      <svg 
        viewBox="0 0 400 440" 
        style={{ height: '100%', width: 'auto', maxHeight: '100%', flexShrink: 0 }} 
        className="h-full w-auto flex-shrink-0" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="shield-clip-clean">
            <path d="M 200,20 C 310,20 360,60 360,180 C 360,330 200,410 200,410 C 200,410 40,330 40,180 C 40,60 90,20 200,20 Z" />
          </clipPath>
        </defs>

        {/* Shield Navy Border */}
        <path 
          d="M 200,8 C 322,8 378,52 378,180 C 378,342 200,428 200,428 C 200,428 22,342 22,180 C 22,52 78,8 200,8 Z" 
          fill="#0C2340" 
        />

        {/* Shield Content Clipped */}
        <g clipPath="url(#shield-clip-clean)">
          {/* Q1: Fire Red */}
          <rect x="40" y="20" width="160" height="180" fill="#DC2626" />
          <path d="M 120,150 C 90,150 80,120 90,100 C 100,80 120,60 120,40 C 120,40 130,65 140,80 C 150,95 160,110 150,130 C 145,145 135,150 120,150 Z" fill="#FACC15" />
          <path d="M 120,145 C 105,145 98,130 102,118 C 106,106 120,95 120,80 C 120,80 128,95 132,105 C 138,118 132,145 120,145 Z" fill="#F97316" />

          {/* Q2: Pet Green */}
          <rect x="200" y="20" width="160" height="180" fill="#16A34A" />
          <path d="M 270,160 C 260,140 260,110 270,95 C 275,87 290,75 310,75 C 320,75 330,85 335,80 C 340,75 345,95 340,110 C 335,125 340,140 350,160 Z" fill="#FFFFFF" />
          <circle cx="315" cy="90" r="4" fill="#16A34A" />
          <path d="M 315,160 C 315,140 325,125 335,115 C 340,110 345,100 350,105 C 355,110 355,120 355,130 C 355,145 360,155 360,160 Z" fill="#FFFFFF" />

          {/* Q3: Horse & Bird Brown */}
          <rect x="40" y="200" width="160" height="210" fill="#854D0E" />
          <path d="M 50,380 C 50,310 80,260 120,240 C 150,225 185,250 190,280 C 175,285 160,300 150,320 C 140,340 135,370 135,400 Z" fill="#FFFFFF" />
          <circle cx="140" cy="275" r="4" fill="#854D0E" />
          <path d="M 140,380 C 155,365 170,360 185,370 C 175,385 160,390 140,380 Z M 165,370 C 175,355 185,355 190,365 Z" fill="#FFFFFF" />

          {/* Q4: Alert & Waves Blue */}
          <rect x="200" y="200" width="160" height="210" fill="#0284C7" />
          <polygon points="280,240 320,310 240,310" fill="#DC2626" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
          <polygon points="280,260 300,298 260,298" fill="#FFFFFF" />
          <path d="M 230,340 Q 255,330 280,340 T 330,340" stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M 230,360 Q 255,350 280,360 T 330,360" stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round" />

          {/* White Dividing Lines */}
          <line x1="200" y1="20" x2="200" y2="410" stroke="#FFFFFF" strokeWidth="8" />
          <line x1="40" y1="200" x2="360" y2="200" stroke="#FFFFFF" strokeWidth="8" />

          {/* Star of Life Center */}
          <g transform="translate(200, 200)">
            <g fill="#0C2340" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round">
              <rect x="-14" y="-70" width="28" height="140" rx="6" />
              <rect x="-14" y="-70" width="28" height="140" rx="6" transform="rotate(60)" />
              <rect x="-14" y="-70" width="28" height="140" rx="6" transform="rotate(120)" />
            </g>
            <line x1="0" y1="-50" x2="0" y2="50" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
            <path d="M -15,-40 C 15,-30 15,-10 -15,0 C -20,10 15,25 -10,40" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </svg>

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
