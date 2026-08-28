import sys

with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            return i
    return -1

dir_start = find_line('{/* SUBTAB: GESTIÓN DE CARGOS')
dir_end = find_line('{/* TAB 1: PADRÓN')
ren_start = find_line('{/* TAB 2: APROBACIÓN DE RENUNCIAS')
ren_end = find_line("activeTabLocal === 'donaciones'")
req_start = find_line('{activeRequestRenunciaModal && (')
app_start = find_line('{activeApproveRenunciaModal && (')
socio_start = find_line('{/* SOCIO PERFIL MODAL */}')
handle_req_start = find_line('const handleSolicitarRenunciaSubmit =')
handle_req_end = find_line('const handleAprobarRenunciaSubmit =')
handle_app_end = find_line('const handleAddExpenseSubmit =')

# extract pieces
dir_jsx = "".join(lines[dir_start:dir_end]).strip()
# remove the first and last lines which are the condition wrapper:
# {activeTabLocal === 'directorio-gestion' && canManageCategoriesAndCargos && (
# )}
dir_lines = lines[dir_start:dir_end]
# find the wrapper inside dir_lines
wrap_s = -1
wrap_e = -1
for i, l in enumerate(dir_lines):
    if "activeTabLocal === 'directorio-gestion'" in l:
        wrap_s = i
    if ")}" in l.replace(" ", ""):
        wrap_e = i

if wrap_s != -1 and wrap_e != -1:
    dir_inner = "".join(dir_lines[wrap_s+1:wrap_e])
else:
    dir_inner = dir_jsx

ren_lines = lines[ren_start:ren_end]
wrap_s_ren = -1
wrap_e_ren = -1
for i, l in enumerate(ren_lines):
    if "activeTabLocal === 'renuncias'" in l:
        wrap_s_ren = i
    if ")}" in l.replace(" ", ""):
        wrap_e_ren = i
if wrap_s_ren != -1 and wrap_e_ren != -1:
    ren_inner = "".join(ren_lines[wrap_s_ren+1:wrap_e_ren])
else:
    ren_inner = "".join(ren_lines)

req_lines = lines[req_start:app_start]
# extract inner
req_inner = "".join(req_lines[1:-1])  # remove first and last line

app_lines = lines[app_start:socio_start]
app_inner = "".join(app_lines[1:-1])

handle_req_str = "".join(lines[handle_req_start:handle_req_end])
handle_app_str = "".join(lines[handle_req_end:handle_app_end])

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
template = template.replace('___DIR_GESTION___', dir_inner)
template = template.replace('___RENUNCIAS___', ren_inner)
template = template.replace('___REQ_MODAL___', req_inner)
template = template.replace('___APP_MODAL___', app_inner)

with open('c:/PRUANED/src/pages/intranet/DirectorioNacional.jsx', 'w', encoding='utf-8') as f:
    f.write(template)

# Now remove from SociosIntranet
content = "".join(lines)
content = content.replace(handle_req_str, "")
content = content.replace(handle_app_str, "")
content = content.replace("".join(lines[dir_start:dir_end]), "")
content = content.replace("".join(lines[ren_start:ren_end]), "")
content = content.replace("".join(lines[req_start:app_start]), "")
content = content.replace("".join(lines[app_start:socio_start]), "")

# state
import re
content = re.sub(r'const \[activeRequestRenunciaModal[^;]+;\n', '', content)
content = re.sub(r'const \[activeApproveRenunciaModal[^;]+;\n', '', content)
content = re.sub(r'const \[motivoRenunciaInput[^;]+;\n', '', content)
content = re.sub(r'const \[actaDirectorioInput[^;]+;\n', '', content)

content = content.replace(' && !activeRequestRenunciaModal && !activeApproveRenunciaModal', '')
content = re.sub(r'setActiveRequestRenunciaModal\(null\);\s*setActiveApproveRenunciaModal\(null\);', '', content)
content = content.replace('activePaymentModal, activeRequestRenunciaModal, activeApproveRenunciaModal', 'activePaymentModal')
btn_regex = re.compile(r"\{socio\.estadoCuota === 'Solicitud Renuncia Pendiente Directorio'.*?: null\}", re.MULTILINE | re.DOTALL)
content = btn_regex.sub('', content)

content = content.replace('const SocioSearchSelect =', 'export const SocioSearchSelect =')

with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done python script")
