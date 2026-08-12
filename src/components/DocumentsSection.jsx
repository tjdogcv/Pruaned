import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Search, FolderPlus, PlusCircle, Trash2, Tag } from 'lucide-react';

export const DocumentsSection = () => {
  const { 
    documentsList, 
    docCategories, 
    addDocCategory, 
    deleteDocCategory, 
    addDocument, 
    deleteDocument, 
    currentUser 
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newDocData, setNewDocData] = useState({
    title: '',
    category: docCategories[0] || 'Estatutos & Reglamentos',
    size: '1.5 MB',
    version: 'v1.0',
    description: ''
  });

  const filteredDocs = documentsList.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addDocCategory(newCatName);
      setNewCatName('');
    }
  };

  const handleCreateDoc = (e) => {
    e.preventDefault();
    if (newDocData.title.trim()) {
      addDocument({
        ...newDocData,
        date: new Date().toISOString().split('T')[0],
        url: '#'
      });
      setIsAddDocModalOpen(false);
      setNewDocData({
        title: '',
        category: docCategories[0] || 'Estatutos & Reglamentos',
        size: '1.5 MB',
        version: 'v1.0',
        description: ''
      });
    }
  };

  const handleSimulateDownload = (doc) => {
    const element = document.createElement("a");
    const file = new Blob([
      `DOCUMENTO OFICIAL PRUANED A.G.\n\nTítulo: ${doc.title}\nCategoría: ${doc.category}\nVersión: ${doc.version}\nFecha: ${doc.date}\nDescripción: ${doc.description}\n\nSello de Verificación Digital PRUANED A.G. 2025`
    ], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, '_')}_PRUANED.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <section className="py-16 bg-slate-50 text-slate-900 min-h-screen border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5" /> Repositorio Público Abierto
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Documentos Importantes & Categorías
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Descarga de estatutos, reglamentos, guías técnicas y convenios marco.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                Gestor Categorías
              </button>
              <button
                onClick={() => setIsAddDocModalOpen(true)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Agregar Documento
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
                placeholder="Buscar documento por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Tag className="w-4 h-4 text-blue-900" /> Categorías disponibles: {docCategories.length}
            </div>
          </div>

          {/* Dynamic Categories Pill Selector */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'Todas'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas las Categorías
            </button>
            {docCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-sm">No hay documentos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="card-inst p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 font-bold text-[10px] rounded-full border border-blue-200 uppercase">
                      {doc.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {doc.date}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 space-x-2 font-mono">
                    <span className="font-bold text-slate-700">{doc.version}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {doc.htmlUrl && (
                      <a
                        href={doc.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform hover:scale-105"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> Ver HTML
                      </a>
                    )}
                    <a
                      href={doc.url !== '#' ? doc.url : `javascript:void(0)`}
                      onClick={doc.url === '#' ? () => handleSimulateDownload(doc) : undefined}
                      download={doc.url !== '#' ? `Estatutos_PRUANED_AG_Redisenados.pdf` : undefined}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Categorías Dinámicas */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border border-slate-200">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-emerald-600" />
                  Gestión Dinámica de Categorías
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Crea o elimina categorías de documentos públicos.
                </p>
              </div>

              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva categoría..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Agregar
                </button>
              </form>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700">Categorías Existentes:</div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {docCategories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <button
                        onClick={() => deleteDocCategory(cat)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
