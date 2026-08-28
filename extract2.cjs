const fs = require('fs');

let content = fs.readFileSync('c:/PRUANED/src/components/SociosIntranet.jsx', 'utf8');

// Helper to extract a balanced block
function extractBlock(startStr, openChar, closeChar) {
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) return null;
    
    // Find first openChar after startStr
    const blockStart = content.indexOf(openChar, startIndex + startStr.length);
    if (blockStart === -1) return null;
    
    let balance = 1;
    let i = blockStart + 1;
    while (i < content.length) {
        if (content[i] === openChar) balance++;
        else if (content[i] === closeChar) {
            balance--;
            if (balance === 0) {
                return {
                    start: startIndex,
                    end: i + 1,
                    content: content.slice(startIndex, i + 1),
                    inner: content.slice(blockStart + 1, i)
                };
            }
        }
        i++;
    }
    return null;
}

const dirGestionBlock = extractBlock("{/* SUBTAB: GESTIÓN DE CARGOS Y DIGITALIZACIÓN", "(", ")");
const renunciasBlock = extractBlock("{/* TAB 2: APROBACIÓN DE RENUNCIAS Y DESVINCULACIÓN", "(", ")");
const reqModalBlock = extractBlock("{activeRequestRenunciaModal && (", "(", ")");
const appModalBlock = extractBlock("{activeApproveRenunciaModal && (", "(", ")");

console.log('dir', !!dirGestionBlock);
console.log('ren', !!renunciasBlock);
console.log('req', !!reqModalBlock);
console.log('app', !!appModalBlock);

if (dirGestionBlock && renunciasBlock && reqModalBlock && appModalBlock) {
    
    let handleReqStart = content.indexOf("const handleSolicitarRenunciaSubmit = (e) => {");
    let handleReqEnd = content.indexOf("};", handleReqStart) + 2;
    let handleReqStr = content.slice(handleReqStart, handleReqEnd);
    
    let handleAppStart = content.indexOf("const handleAprobarRenunciaSubmit = (e) => {");
    let handleAppEnd = content.indexOf("};", handleAppStart) + 2;
    let handleAppStr = content.slice(handleAppStart, handleAppEnd);
    
    const template = `import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SocioSearchSelect } from '../../components/SociosIntranet';
import {
  ClipboardList,
  UserX,
  Crown,
  Award,
  FileText,
  DollarSign,
  PenTool,
  FileCheck2,
  Check,
  X,
  AlertCircle,
  Wallet
} from 'lucide-react';

export default function DirectorioNacional() {
  const { 
    isMasterUser, 
    isDirectiva,
    canManageCategoriesAndCargos,
    sociosList,
    updateDirectorioCargo,
    getDirectorioMember,
    firmasOficiales,
    updateFirmaOficial,
    canManageFinances,
    solicitarRenunciaSocio,
    aprobarRenunciaDirectorio,
    currentUser
  } = useAuth();

  const [activeTabLocal, setActiveTabLocal] = useState('directorio-gestion');

  const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);
  const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);
  const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');
  const [actaDirectorioInput, setActaDirectorioInput] = useState('');

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setActiveRequestRenunciaModal(null);
      setActiveApproveRenunciaModal(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activeRequestRenunciaModal, activeApproveRenunciaModal]);

  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  const presidente = getDirectorioMember('presidenteId');
  const vicepresidente = getDirectorioMember('vicepresidenteId');
  const secretario = getDirectorioMember('secretarioId');
  const tesorero = getDirectorioMember('tesoreroId');

  const handleFileUploadFirma = (cargoKey, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFirmaOficial(cargoKey, reader.result);
        alert(\`¡Firma digitalizada de \${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!\`);
      };
      reader.readAsDataURL(file);
    }
  };

  ${handleReqStr}
  ${handleAppStr}

  const currentSocio = isMasterUser 
    ? { nombre: 'Administrador Maestro', email: 'ag.pruaned@gmail.com', rut: 'ADMIN-0', categoria: 'Sistema', profesion: 'Soporte Gremial', fotoPerfil: '' } 
    : (sociosList.find(s => s.email === currentUser?.email) || {});

  const renunciasPendientes = sociosList.filter(s => s.estadoCuota === 'Solicitud Renuncia Pendiente Directorio').length;

  return (
    <section className="min-h-screen bg-slate-50 py-2 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-slate-200 pb-0">
          <div className="max-w-2xl pb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Directorio nacional</p>
            <h2 className="font-['Outfit'] text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Cargos y firmas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Gestiona la representación institucional y sus firmas oficiales.</p>
          </div>

          <nav className="flex gap-1 overflow-x-auto" aria-label="Opciones">
            <button
              type="button"
              onClick={() => setActiveTabLocal('directorio-gestion')}
              aria-current={activeTabLocal === 'directorio-gestion' ? 'page' : undefined}
              className={\`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 \${activeTabLocal === 'directorio-gestion' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}\`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Cargos y firmas
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('renuncias')}
              aria-current={activeTabLocal === 'renuncias' ? 'page' : undefined}
              className={\`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 \${activeTabLocal === 'renuncias' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}\`}
            >
              <UserX className="h-4 w-4" aria-hidden="true" />
              Renuncias
              {renunciasPendientes > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">{renunciasPendientes}</span>}
            </button>
          </nav>
        </header>

        {activeTabLocal === 'directorio-gestion' && canManageCategoriesAndCargos && (
          ${dirGestionBlock.inner}
        )}

        {activeTabLocal === 'renuncias' && (
          ${renunciasBlock.inner}
        )}
      </div>

      {activeRequestRenunciaModal && (
        ${reqModalBlock.inner}
      )}

      {activeApproveRenunciaModal && (
        ${appModalBlock.inner}
      )}
    </section>
  );
}
`;

    fs.writeFileSync('c:/PRUANED/src/pages/intranet/DirectorioNacional.jsx', template);
    
    // Now remove everything from content
    content = content.replace(dirGestionBlock.content, "");
    content = content.replace(renunciasBlock.content, "");
    content = content.replace(reqModalBlock.content, "");
    content = content.replace(appModalBlock.content, "");
    
    content = content.replace(handleReqStr, "");
    content = content.replace(handleAppStr, "");
    
    content = content.replace("const [activeRequestRenunciaModal, setActiveRequestRenunciaModal] = useState(null);\n", "");
    content = content.replace("const [activeApproveRenunciaModal, setActiveApproveRenunciaModal] = useState(null);\n", "");
    content = content.replace("const [motivoRenunciaInput, setMotivoRenunciaInput] = useState('');\n", "");
    content = content.replace("const [actaDirectorioInput, setActaDirectorioInput] = useState('');\n", "");
    
    content = content.replace(" && !activeRequestRenunciaModal && !activeApproveRenunciaModal", "");
    content = content.replace("setActiveRequestRenunciaModal(null);\n      setActiveApproveRenunciaModal(null);", "");
    content = content.replace("activePaymentModal, activeRequestRenunciaModal, activeApproveRenunciaModal", "activePaymentModal");
    
    const btnRegex = /\{socio\.estadoCuota === 'Solicitud Renuncia Pendiente Directorio'.*?: null\}/s;
    content = content.replace(btnRegex, "");
    
    // Export SocioSearchSelect
    content = content.replace("const SocioSearchSelect =", "export const SocioSearchSelect =");
    
    fs.writeFileSync('c:/PRUANED/src/components/SociosIntranet.jsx', content);
    console.log("DONE");
}
