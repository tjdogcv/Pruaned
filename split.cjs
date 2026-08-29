const fs = require('fs');

function processFile(file, name, initialTab, allowedTabs) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Rename component
    content = content.replace(/export default function SociosDirectory/, 'export default function ' + name);
    
    // Hardcode initial tab
    content = content.replace(/const \[activeTabLocal, setActiveTabLocal\] = useState\(initialTab \?\? \(isMasterUser \? 'padron' : 'mi-cuenta'\)\);/, 
        "const [activeTabLocal, setActiveTabLocal] = useState('" + initialTab + "');");
        
    // Remove the tab buttons UI entirely
    const tabNavRegex = /<nav className="flex space-x-2 overflow-x-auto pb-4 mb-6">[\s\S]*?<\/nav>/;
    content = content.replace(tabNavRegex, '');
    
    // Remove the "activeTabLocal === 'postulaciones'" block entirely
    content = content.replace(/\{activeTabLocal === 'postulaciones'[\s\S]*?\{activeTabLocal === 'donaciones'/g, "{activeTabLocal === 'donaciones'");
    
    // Remove "donaciones" to end of "cobros-especiales"
    content = content.replace(/\{activeTabLocal === 'donaciones'[\s\S]*?\{activeTabLocal === 'auditoria'/g, "{activeTabLocal === 'auditoria'");
    
    // Remove "auditoria" to the end of the sections
    content = content.replace(/\{activeTabLocal === 'auditoria'[\s\S]*?<\/div>\s*<\/section>/, "</div>\n    </section>");

    // Now remove tabs that are not allowed for this file
    if (!allowedTabs.includes('renuncias')) {
        content = content.replace(/\{activeTabLocal === 'renuncias'[\s\S]*?\{activeTabLocal === 'postulaciones'/g, "{activeTabLocal === 'postulaciones'");
    }
    
    if (!allowedTabs.includes('padron')) {
        content = content.replace(/\{activeTabLocal === 'padron'[\s\S]*?\{activeTabLocal === 'renuncias'/g, "{activeTabLocal === 'renuncias'");
    }

    if (!allowedTabs.includes('mi-cuenta')) {
        content = content.replace(/\{activeTabLocal === 'mi-cuenta'[\s\S]*?\{activeTabLocal === 'padron'/g, "{activeTabLocal === 'padron'");
    }
    
    fs.writeFileSync(file, content, 'utf8');
}

processFile('src/pages/intranet/MiPerfil.jsx', 'MiPerfil', 'mi-cuenta', ['mi-cuenta']);
processFile('src/pages/intranet/PadronSocios.jsx', 'PadronSocios', 'padron', ['padron', 'renuncias']);
