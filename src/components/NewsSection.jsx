import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Newspaper, Search, Calendar, User, ArrowRight, PlusCircle, Trash2 } from 'lucide-react';

export const NewsSection = ({ onOpenPublishModal }) => {
  const { newsList, currentUser, deleteNews } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveArticle(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const categories = ['Todas', ...new Set(newsList.map(n => n.category))];

  const filteredNews = newsList.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          news.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || news.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <section className="py-16 bg-white text-slate-900 min-h-screen border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              <Newspaper className="w-3.5 h-3.5" /> Informes & Comunicados Oficiales
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Noticias & Novedades PRUANED
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Publicación continua de simulacros, convenios y operativos de emergencia.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenPublishModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-transform hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              Publicar Noticia
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar noticia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <Newspaper className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-sm">No se encontraron noticias con los criterios seleccionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((news) => (
              <article
                key={news.id}
                className="card-inst overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 bg-blue-900 text-white font-bold text-[10px] rounded-full uppercase shadow">
                        {news.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> {news.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" /> {news.author}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-['Outfit'] group-hover:text-blue-900 transition-colors leading-snug">
                      {news.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 font-normal leading-relaxed">
                      {news.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-3">
                  <button
                    onClick={() => setActiveArticle(news)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors pt-3"
                  >
                    Leer noticia <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => deleteNews(news.id)}
                      title="Eliminar Noticia"
                      className="text-rose-600 hover:text-rose-800 p-1 rounded transition-colors pt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal Article Reader */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" role="presentation" onMouseDown={() => setActiveArticle(null)}>
            <div role="dialog" aria-modal="true" aria-labelledby="noticia-activa-titulo" onMouseDown={(event) => event.stopPropagation()} className="bg-white text-slate-900 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveArticle(null)}
                aria-label="Cerrar noticia"
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>

              <div className="relative h-52 rounded-xl overflow-hidden bg-slate-100">
                <img src={activeArticle.image} alt={activeArticle.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-blue-900 text-white font-bold text-xs rounded-full">
                  {activeArticle.category}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span><Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-600" /> {activeArticle.date}</span>
                  <span><User className="w-3.5 h-3.5 inline mr-1 text-emerald-600" /> {activeArticle.author}</span>
                </div>

                <h3 id="noticia-activa-titulo" className="text-xl font-bold text-slate-900 font-['Outfit']">
                  {activeArticle.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100 font-normal">
                  {activeArticle.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2 bg-blue-900 text-white font-bold rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
