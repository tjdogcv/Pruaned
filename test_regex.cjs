const fs = require('fs');

const content = fs.readFileSync('c:/PRUANED/src/components/SociosIntranet.jsx', 'utf8');

const directorio_gestion_regex = /\{\/\* SUBTAB: GESTIÓN DE CARGOS.*?\setActiveTabLocal === 'directorio-gestion'.*?&&\s*\(\s*(<div.*?<\/div>)\s*\)\s*\}/s;
const renuncias_regex = /\{\/\* TAB 2: APROBACIÓN DE RENUNCIAS.*?activeTabLocal === 'renuncias'.*?&&\s*\(\s*(<div.*?<\/div>)\s*\)\s*\}/s;

const req_modal_regex = /\{\s*activeRequestRenunciaModal\s*&&\s*\((.*?)\)\s*\}/s;
const app_modal_regex = /\{\s*activeApproveRenunciaModal\s*&&\s*\((.*?)\)\s*\}/s;

console.log('dir:', !!content.match(directorio_gestion_regex));
console.log('ren:', !!content.match(renuncias_regex));
console.log('req:', !!content.match(req_modal_regex));
console.log('app:', !!content.match(app_modal_regex));
