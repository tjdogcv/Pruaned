const fs = require('fs');
let code = fs.readFileSync('c:/PRUANED/src/pages/intranet/DirectorioNacional.jsx', 'utf8');

// The template has `)}` after ___DIR_GESTION___. If ___DIR_GESTION___ included it, we have duplicate `)}`.
code = code.replace(/\s*\)\}\s*\)\}/g, '\n        )}');

fs.writeFileSync('c:/PRUANED/src/pages/intranet/DirectorioNacional.jsx', code);
