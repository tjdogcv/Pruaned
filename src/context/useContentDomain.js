import { useState } from 'react';
import { INITIAL_DOCUMENTS, INITIAL_DOC_CATEGORIES, INITIAL_NEWS } from '../data/initialData';
import { BUCKETS, supabase } from '../lib/supabase';
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  fileExtension,
  normalizeDocument,
  safeStorageFileName
} from '../lib/authData';

/** Estado y operaciones CMS/documentales; la API pública sigue expuesta por useAuth. */
export const useContentDomain = ({ supabaseReady, currentUser, addSecurityLog }) => {
  const [newsList, setNewsList] = useState(() => {
    const saved = localStorage.getItem('pruaned_news');
    return saved ? JSON.parse(saved) : INITIAL_NEWS;
  });
  const [docCategories, setDocCategories] = useState(INITIAL_DOC_CATEGORIES);
  const [documentsList, setDocumentsList] = useState(() => {
    const saved = localStorage.getItem('pruaned_documents');
    return (saved ? JSON.parse(saved) : INITIAL_DOCUMENTS).map(normalizeDocument);
  });

  const requireCmsPermission = async (rpc, message, unavailableMessage) => {
    if (!supabaseReady) throw new Error(unavailableMessage);
    const { data: allowed, error } = await supabase.rpc(rpc);
    if (error) throw error;
    if (!allowed) throw new Error(message);
  };

  const addNews = async (newsItem) => {
    await requireCmsPermission(
      'pruaned_can_publish_cms',
      'No tienes permisos para publicar contenido institucional.',
      'La publicación de contenido requiere una conexión segura a Supabase.'
    );
    const itemWithId = { ...newsItem, id: `n-${Date.now()}` };
    setNewsList((previous) => [itemWithId, ...previous]);
    try {
      await supabase.from('noticias').insert([{
        id: itemWithId.id,
        titulo: newsItem.titulo,
        contenido: newsItem.contenido,
        fecha_publicacion: newsItem.fechaPublicacion || newsItem.fecha_publicacion,
        autor: newsItem.autor,
        categoria: newsItem.categoria,
        imagen_url: newsItem.imagenUrl || newsItem.imagen_url
      }]);
    } catch (error) {
      console.error('Error addNews Supabase:', error);
    }
  };

  const deleteNews = async (id) => {
    await requireCmsPermission(
      'pruaned_can_publish_cms',
      'No tienes permisos para eliminar contenido institucional.',
      'La eliminación de contenido requiere una conexión segura a Supabase.'
    );
    setNewsList((previous) => previous.filter((news) => news.id !== id));
    try {
      await supabase.from('noticias').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleteNews Supabase:', error);
    }
  };

  const addDocCategory = async (categoryName) => {
    await requireCmsPermission(
      'pruaned_can_manage_categories',
      'No tienes permisos para gestionar categorías de documentos.',
      'Las categorías requieren una conexión segura a Supabase.'
    );
    const category = categoryName.trim();
    if (!category || docCategories.some((item) => item.toLocaleLowerCase('es-CL') === category.toLocaleLowerCase('es-CL'))) return;
    const { data, error } = await supabase.from('document_categories').insert({ name: category }).select('name').single();
    if (error) throw error;
    setDocCategories((previous) => [...previous, data.name].sort((first, second) => first.localeCompare(second, 'es')));
  };

  const deleteDocCategory = async (categoryName) => {
    await requireCmsPermission(
      'pruaned_can_manage_categories',
      'No tienes permisos para eliminar categorías de documentos.',
      'Las categorías requieren una conexión segura a Supabase.'
    );
    if (documentsList.some((document) => document.category === categoryName)) {
      throw new Error('No puedes eliminar una categoría que aún tiene documentos asociados.');
    }
    const { error } = await supabase.from('document_categories').delete().eq('name', categoryName);
    if (error) throw error;
    setDocCategories((previous) => previous.filter((category) => category !== categoryName));
  };

  const addDocument = async ({ file, title, category, description, version = 'v1.0', visibility = 'publico' }) => {
    if (!supabaseReady) throw new Error('La publicación documental requiere una conexión segura a Supabase.');
    if (!(file instanceof File)) throw new Error('Selecciona un archivo para publicar.');
    if (file.size < 1 || file.size > DOCUMENT_MAX_BYTES) throw new Error('El archivo debe tener un tamaño entre 1 byte y 20 MB.');

    const extension = fileExtension(file.name);
    if (!DOCUMENT_EXTENSIONS.has(extension) || (file.type && !DOCUMENT_MIME_TYPES.has(file.type))) {
      throw new Error('Sólo se permiten archivos PDF, DOCX o XLSX.');
    }
    if (!title?.trim() || !category?.trim()) throw new Error('Título y categoría son obligatorios.');
    if (!['publico', 'socios'].includes(visibility)) throw new Error('La visibilidad del documento no es válida.');

    const objectId = crypto.randomUUID();
    const storagePath = `publicados/${new Date().getUTCFullYear()}/${objectId}-${safeStorageFileName(file.name)}`;
    const bucket = visibility === 'socios' ? BUCKETS.documentosSocios : BUCKETS.documentos;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) throw uploadError;

    const publicUrl = visibility === 'publico'
      ? supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
      : storagePath;
    const { data, error } = await supabase.from('documentos').insert({
      titulo: title.trim(), categoria: category.trim(), descripcion: description?.trim() || null,
      url: publicUrl, fecha: new Date().toISOString().slice(0, 10), version: version?.trim() || 'v1.0',
      visibilidad: visibility, archivo_nombre: file.name, archivo_tipo: file.type || `application/${extension}`,
      archivo_bytes: file.size, storage_path: storagePath, publicado: true
    }).select('*').single();
    if (error) {
      await supabase.storage.from(bucket).remove([storagePath]);
      throw error;
    }
    const document = normalizeDocument(data);
    setDocumentsList((previous) => [document, ...previous]);
    addSecurityLog(`PUBLISH_DOCUMENT_${document.id}`, currentUser?.email, 'INFO');
    return document;
  };

  const getDocumentDownloadUrl = async (document) => {
    if (!document || document.visibility !== 'socios' || !document.storagePath) return document?.url || '';
    if (!supabaseReady) throw new Error('El documento exclusivo requiere una conexión segura a Supabase.');
    const { data, error } = await supabase.storage.from(BUCKETS.documentosSocios).createSignedUrl(document.storagePath, 10 * 60);
    if (error) throw error;
    return data.signedUrl;
  };

  const setDocumentPublication = async (id, published) => {
    if (!supabaseReady) throw new Error('La publicación documental requiere una conexión segura a Supabase.');
    const publicationPatch = published ? { publicado: true, archivado_at: null, archivado_por: null } : { publicado: false };
    const { data, error } = await supabase.from('documentos').update(publicationPatch).eq('id', id).select('*').single();
    if (error) throw error;
    const document = normalizeDocument(data);
    setDocumentsList((previous) => previous.map((item) => item.id === id ? document : item));
    addSecurityLog(`${published ? 'RESTORE' : 'ARCHIVE'}_DOCUMENT_${id}`, currentUser?.email, published ? 'INFO' : 'WARN');
    return document;
  };

  return {
    newsList, setNewsList, addNews, deleteNews,
    docCategories, setDocCategories, addDocCategory, deleteDocCategory,
    documentsList, setDocumentsList, addDocument, getDocumentDownloadUrl,
    archiveDocument: (id) => setDocumentPublication(id, false),
    restoreDocument: (id) => setDocumentPublication(id, true),
    deleteDocument: (id) => setDocumentPublication(id, false)
  };
};
