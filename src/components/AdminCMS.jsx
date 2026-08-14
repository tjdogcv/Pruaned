import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentManager } from './DocumentManager';
import { Newspaper, FolderPlus, FileText, PlusCircle, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AdminCMS = () => {
  const { newsList, addNews, deleteNews, docCategories, addDocCategory, deleteDocCategory } = useAuth();
  
  const [activeTab, setActiveTab] = useState('news'); // news, categories, docs
  
  // News form state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Institucional');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');

  // Category form state
  const [catNameInput, setCatNameInput] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const handlePublishNews = (e) => {
    e.preventDefault();
    if (newsTitle.trim() && newsSummary.trim()) {
      addNews({
        title: newsTitle,
        category: newsCategory,
        summary: newsSummary,
        content: newsContent || newsSummary,
        image: newsImage,
        date: new Date().toISOString().split('T')[0],
        author: 'Directorio PRUANED'
      });
      setNewsTitle('');
      setNewsSummary('');
      setNewsContent('');
      alert('¡Noticia publicada exitosamente en el sitio público!');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (catNameInput.trim()) {
      try {
        await addDocCategory(catNameInput.trim());
      } catch (error) {
        setCategoryError(error.message || 'No fue posible crear la categoría.');
        return;
      }
      setCatNameInput('');
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    setCategoryError('');
    try {
      await deleteDocCategory(categoryName);
    } catch (error) {
      setCategoryError(error.message || 'No fue posible eliminar la categoría.');
    }
  };

  return (
    <section className="py-16 bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3">
              <FileText className="w-3.5 h-3.5" /> Panel de Administración General (CMS)
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">
              Gestor de Contenidos & Categorías Dinámicas
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Administración de la sección pública de noticias y repositorio documental.
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-800 p-1.5 rounded-2xl border border-slate-700 gap-1">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'news' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Publicar Noticias
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'categories' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Categorías de Documentos
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'documents' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Documentos Publicados
            </button>
          </div>
        </div>

        {/* TAB 1: NEWS CMS */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Form */}
            <div className="lg:col-span-6 bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 space-y-6 shadow-xl">
              <h3 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Publicar Noticia Oficial
              </h3>

              <form onSubmit={handlePublishNews} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Título de la Noticia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PRUANED firma nuevo convenio con SENAPRED"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                    <select
                      value={newsCategory}
                      onChange={(e) => setNewsCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Institucional">Institucional</option>
                      <option value="Operativos">Operativos</option>
                      <option value="Capacitaciones">Capacitaciones</option>
                      <option value="Convenios">Convenios</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">URL Imagen Destacada</label>
                    <input
                      type="text"
                      value={newsImage}
                      onChange={(e) => setNewsImage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Resumen Breve (Bajada)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Descripción resumida para las tarjetas de noticias..."
                    value={newsSummary}
                    onChange={(e) => setNewsSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cuerpo Completo del Artículo</label>
                  <textarea
                    rows={4}
                    placeholder="Desarrollo completo de la noticia..."
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm shadow-lg"
                >
                  Publicar Noticia en Sitio Público
                </button>
              </form>

            </div>

            {/* List of Published News */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                Noticias Actualmente Publicadas ({newsList.length})
              </h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {newsList.map((n) => (
                  <div key={n.id} className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full">
                        {n.category}
                      </span>
                      <h4 className="font-bold text-sm text-white font-['Outfit'] leading-snug">{n.title}</h4>
                      <p className="text-xs text-slate-400 font-mono">{n.date} • Por {n.author}</p>
                    </div>
                    <button
                      onClick={() => deleteNews(n.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar Noticia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY CMS */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-8 space-y-6 shadow-xl">
              <h3 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                Gestor Dinámico de Categorías de Documentos
              </h3>

              <form onSubmit={handleAddCategory} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Escriba el nombre de la nueva categoría..."
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Agregar Categoría
                </button>
              </form>

              {categoryError && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200">{categoryError}</p>}

              <div className="border-t border-slate-700 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categorías Activas:</h4>
                <div className="space-y-2">
                  {docCategories.map((c) => (
                    <div key={c} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm">
                      <span className="font-bold text-white">{c}</span>
                      <button
                        onClick={() => handleDeleteCategory(c)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && <DocumentManager />}

      </div>
    </section>
  );
};
