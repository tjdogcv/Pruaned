import re

with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the modals JSX
modal1_start = content.find('{activeRequestRenunciaModal && (')
if modal1_start != -1:
    # find matching closing brace? It's {activeRequestRenunciaModal && (...)}
    # just use regex to remove from {activeRequestRenunciaModal to the next {activeApproveRenunciaModal
    # Actually, it's easier to find the end manually.
    pass

# Let's extract the JSX chunks we need for DirectorioNacional.jsx
directorio_gestion_regex = re.compile(r"\{\/\* SUBTAB: GESTIÓN DE CARGOS.*?\setActiveTabLocal === 'directorio-gestion'[^\{]+(.*?)^\s*\}\)", re.MULTILINE | re.DOTALL)
renuncias_regex = re.compile(r"\{\/\* TAB 2: APROBACIÓN DE RENUNCIAS.*?activeTabLocal === 'renuncias'[^\{]+(.*?)^\s*\}\)", re.MULTILINE | re.DOTALL)

# For modales, let's extract them:
request_renuncia_modal_regex = re.compile(r"\{\s*activeRequestRenunciaModal\s*&&\s*\((.*?)\s*\)\s*\}", re.MULTILINE | re.DOTALL)
approve_renuncia_modal_regex = re.compile(r"\{\s*activeApproveRenunciaModal\s*&&\s*\((.*?)\s*\)\s*\}", re.MULTILINE | re.DOTALL)

dir_gestion_match = directorio_gestion_regex.search(content)
renuncias_match = renuncias_regex.search(content)
req_modal_match = request_renuncia_modal_regex.search(content)
app_modal_match = approve_renuncia_modal_regex.search(content)

# We can replace them in content
if dir_gestion_match:
    content = content[:dir_gestion_match.start()] + content[dir_gestion_match.end():]
if renuncias_match:
    content = content[:renuncias_match.start()] + content[renuncias_match.end():]

req_modal_match_full = request_renuncia_modal_regex.search(content)
if req_modal_match_full:
    content = content[:req_modal_match_full.start()] + content[req_modal_match_full.end():]

app_modal_match_full = approve_renuncia_modal_regex.search(content)
if app_modal_match_full:
    content = content[:app_modal_match_full.start()] + content[app_modal_match_full.end():]

# Remove the buttons from padron tab that trigger these modales
# The buttons are around line 1345:
btn_regex = re.compile(r"\{socio\.estadoCuota === 'Solicitud Renuncia Pendiente Directorio'.*?: null\}", re.MULTILINE | re.DOTALL)
btn_match = btn_regex.search(content)
if btn_match:
    content = content[:btn_match.start()] + content[btn_match.end():]


with open('c:/PRUANED/src/components/SociosIntranet.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Extract done.")
