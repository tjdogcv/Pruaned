import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  FileCheck, 
  PlusCircle, 
  Trash2, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

export const DocumentsSection = () => {
  const { 
    documentsList, 
    docCategories, 
    addDocument, 
    deleteDocument, 
    addDocCategory, 
    deleteDocCategory, 
    currentUser 
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageCatModalOpen, setIsManageCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form para nuevo documento
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: docCategories[0] || 'Estatutos & Reglamentos',
    size: '1.5 MB',
    version: 'v1.0',
    description: '',
    url: '#'
  });

  const filteredDocs = documentsList.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'TODAS' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddDocSubmit = (e) => {
    e.preventDefault();
    if (newDoc.title && newDoc.description) {
      addDocument({
        ...newDoc,
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddModalOpen(false);
      setNewDoc({
        title: '',
        category: docCategories[0] || 'Estatutos & Reglamentos',
        size: '1.5 MB',
        version: 'v1.0',
        description: '',
        url: '#'
      });
    }
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addDocCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  return (
    <section className="py-16 bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans'] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              <FileCheck className="w-3.5 h-3.5" /> Repositorio Documental Transparente
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Documentos Públicos & Normativa Gremial
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Acceso abierto a los Estatutos Oficiales (Estatutos-v-3.pdf), protocolos RRD, guías técnicas e informes auditados de PRUANED A.G.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsManageCatModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Gestionar Categorías
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" /> Subir Documento
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('TODAS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === 'TODAS'
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todas las Categorías
              </button>

              {docCategories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-blue-900 text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => {
            const isOfficialEstatutos = doc.id === 'doc-1' || doc.title.toLowerCase().includes('estatutos');
            const pdfUrl = isOfficialEstatutos ? '/Estatutos-v-3.pdf' : doc.url;

            return (
              <div 
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase">
                      {doc.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold font-mono">
                      {doc.version} • {doc.size}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-['Outfit'] leading-snug">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-light">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Publicado: {doc.date}
                  </span>

                  <div className="flex items-center gap-2">
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      Abrir PDF (Estatutos-v-3.pdf)
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
