const fs = require('fs');
const path = require('path');
const csvPath = 'C:/Users/crist/.gemini/antigravity/brain/3c6b18cd-9ea9-43bc-96fb-fa26d967828f/.user_uploaded/media_1786540789774.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim() !== '');

let sql = '-- ==========================================\n';
sql += '-- REIMPORTACIÓN LIMPIA DE SOCIOS (UTF-8)\n';
sql += '-- ==========================================\n\n';
sql += 'DELETE FROM public.socios;\n\n';
sql += 'INSERT INTO public.socios (rut, nombre, profesion, email, region, categoria, estado_cuota, monto_cuota_mensual, voto)\nVALUES \n';

const values = [];
for(let i=1; i<lines.length; i++) {
  const parts = lines[i].split(';');
  if(parts.length < 5) continue;
  const rut = parts[2].trim();
  const nombre = parts[1].trim().replace(/'/g, "''");
  const profesion = parts[4].trim().replace(/'/g, "''");
  const email = parts[8].trim();
  const region = parts[5].trim();
  values.push(`('${rut}', '${nombre}', '${profesion}', '${email}', '${region}', 'Socio Activo', 'Al Día', 5000, true)`);
}

sql += values.join(',\n') + ';\n\n';
sql += '-- Establecer fecha ministerial\n';
sql += "UPDATE public.socios SET fecha_ingreso = '2025-11-17';\n";

const artifactPath = 'C:/Users/crist/.gemini/antigravity/brain/3c6b18cd-9ea9-43bc-96fb-fa26d967828f/reimportar_socios.md';
const mdContent = '# Reimportar Socios\n\nCopia y pega este código en el SQL Editor de Supabase para borrar los socios con errores y volver a subirlos limpios. Al pegarlo desde aquí se conservarán todas las tildes.\n\n```sql\n' + sql + '\n```\n';
fs.writeFileSync(artifactPath, mdContent, 'utf8');
console.log('Artifact created successfully.');
