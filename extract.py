import re
import os

with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const SocioSearchSelect =', 'export const SocioSearchSelect =')

directorio_gestion_regex = re.compile(r"\{\/\* SUBTAB: GESTIÓN DE CARGOS.*?\setActiveTabLocal === 'directorio-gestion'.*?&&\s*\(\s*(<div.*?</div>)\s*\)\s*\}", re.MULTILINE | re.DOTALL)
renuncias_regex = re.compile(r"\{\/\* TAB 2: APROBACIÓN DE RENUNCIAS.*?activeTabLocal === 'renuncias'.*?&&\s*\(\s*(<div.*?</div>)\s*\)\s*\}", re.MULTILINE | re.DOTALL)

dir_gestion_match = directorio_gestion_regex.search(content)
renuncias_match = renuncias_regex.search(content)

dir_gestion_full = re.compile(r"\{\/\* SUBTAB: GESTIÓN DE CARGOS.*?\}\)", re.MULTILINE | re.DOTALL).search(content)
renuncias_full = re.compile(r"\{\/\* TAB 2: APROBACIÓN DE RENUNCIAS.*?\}\)", re.MULTILINE | re.DOTALL).search(content)

request_renuncia_modal_regex = re.compile(r"\{\s*activeRequestRenunciaModal\s*&&\s*\((.*?)\)\s*\}", re.MULTILINE | re.DOTALL)
approve_renuncia_modal_regex = re.compile(r"\{\s*activeApproveRenunciaModal\s*&&\s*\((.*?)\)\s*\}", re.MULTILINE | re.DOTALL)

req_modal_match = request_renuncia_modal_regex.search(content)
app_modal_match = approve_renuncia_modal_regex.search(content)

if dir_gestion_match and renuncias_match and req_modal_match and app_modal_match:
    dir_gestion_jsx = dir_gestion_match.group(1)
    renuncias_jsx = renuncias_match.group(1)
    req_modal_jsx = req_modal_match.group(1)
    app_modal_jsx = app_modal_match.group(1)
    
    handle_req_match = re.search(r'const handleSolicitarRenunciaSubmit =.*?};\n', content, flags=re.DOTALL)
    handle_app_match = re.search(r'const handleAprobarRenunciaSubmit =.*?};\n', content, flags=re.DOTALL)
    
    if handle_req_match and handle_app_match:
        handle_req_str = handle_req_match.group(0)
        handle_app_str = handle_app_match.group(0)
        
        template = """import React, { useState, useEffect } from 'react';
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
  Search
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
        alert(`¡Firma digitalizada de ${cargoKey === 'presidenteFirma' ? 'Presidente' : 'Secretario'} actualizada en certificados y documentos!`);
      };
      reader.readAsDataURL(file);
    }
  };

  ___HANDLE_REQ___
  ___HANDLE_APP___

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
              className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${activeTabLocal === 'directorio-gestion' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Cargos y firmas
            </button>
            <button
              type="button"
              onClick={() => setActiveTabLocal('renuncias')}
              aria-current={activeTabLocal === 'renuncias' ? 'page' : undefined}
              className={`inline-flex min-h-11 flex-none items-center gap-2 border-b-2 px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${activeTabLocal === 'renuncias' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950'}`}
            >
              <UserX className="h-4 w-4" aria-hidden="true" />
              Renuncias
              {renunciasPendientes > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">{renunciasPendientes}</span>}
            </button>
          </nav>
        </header>

        {activeTabLocal === 'directorio-gestion' && canManageCategoriesAndCargos && (
          ___DIR_GESTION___
        )}

        {activeTabLocal === 'renuncias' && (
          ___RENUNCIAS___
        )}
      </div>

      {activeRequestRenunciaModal && (
        ___REQ_MODAL___
      )}

      {activeApproveRenunciaModal && (
        ___APP_MODAL___
      )}
    </section>
  );
}
"""
        template = template.replace('___HANDLE_REQ___', handle_req_str)
        template = template.replace('___HANDLE_APP___', handle_app_str)
        template = template.replace('___DIR_GESTION___', dir_gestion_jsx)
        template = template.replace('___RENUNCIAS___', renuncias_jsx)
        template = template.replace('___REQ_MODAL___', req_modal_jsx)
        template = template.replace('___APP_MODAL___', app_modal_jsx)
        
        with open('c:/PRUANED/src/pages/intranet/DirectorioNacional.jsx', 'w', encoding='utf-8') as f:
            f.write(template)
            
        print("Wrote DirectorioNacional.jsx")
        
        content = content.replace(handle_req_str, '')
        content = content.replace(handle_app_str, '')
        
        content = re.sub(r'const \[activeRequestRenunciaModal[^;]+;\n', '', content)
        content = re.sub(r'const \[activeApproveRenunciaModal[^;]+;\n', '', content)
        content = re.sub(r'const \[motivoRenunciaInput[^;]+;\n', '', content)
        content = re.sub(r'const \[actaDirectorioInput[^;]+;\n', '', content)

        content = content.replace(' && !activeRequestRenunciaModal && !activeApproveRenunciaModal', '')
        
        # fix setActiveRequestRenunciaModal(null); setActiveApproveRenunciaModal(null);
        # we can't reliably replace with exact whitespace, let's use regex
        content = re.sub(r'setActiveRequestRenunciaModal\(null\);\s*setActiveApproveRenunciaModal\(null\);', '', content)
        content = content.replace('activePaymentModal, activeRequestRenunciaModal, activeApproveRenunciaModal', 'activePaymentModal')

        if dir_gestion_full:
            content = content[:dir_gestion_full.start()] + content[dir_gestion_full.end():]
        if renuncias_full:
            content = content[:renuncias_full.start()] + content[renuncias_full.end():]
            
        if req_modal_match:
            req_full = re.compile(r"\{\s*activeRequestRenunciaModal\s*&&\s*\(.*?\)\s*\}", re.MULTILINE | re.DOTALL).search(content)
            if req_full:
                content = content[:req_full.start()] + content[req_full.end():]
                
        if app_modal_match:
            app_full = re.compile(r"\{\s*activeApproveRenunciaModal\s*&&\s*\(.*?\)\s*\}", re.MULTILINE | re.DOTALL).search(content)
            if app_full:
                content = content[:app_full.start()] + content[app_full.end():]
                
        btn_regex = re.compile(r"\{socio\.estadoCuota === 'Solicitud Renuncia Pendiente Directorio'.*?: null\}", re.MULTILINE | re.DOTALL)
        btn_match = btn_regex.search(content)
        if btn_match:
            content = content[:btn_match.start()] + content[btn_match.end():]
            
        with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("Updated SociosIntranet.jsx")
    else:
        print("Could not find handle functions.")
else:
    print("Could not find all JSX matches.")
