import { supabase, isSupabaseReady } from './supabase';

export const BUCKET_ALIASES = {
  documentosVoluntarios: 'documentos-voluntarios'
};

const INLINE_FALLBACK_MAX_BYTES = 1.5 * 1024 * 1024;

const dataURItoBlob = (dataURI) => {
  const arr = dataURI.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const sanitizeStorageFileName = (name = 'documento') => String(name || 'documento')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9._-]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(-90) || 'documento';

export const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
  reader.readAsDataURL(file);
});

export const uploadToSupabaseStorage = async (bucketName, fileName, base64OrFile, contentType = 'image/webp') => {
  if (!isSupabaseReady()) {
    return typeof base64OrFile === 'string' ? base64OrFile : '';
  }

  try {
    const fileBody = typeof base64OrFile === 'string' && base64OrFile.startsWith('data:')
      ? dataURItoBlob(base64OrFile)
      : base64OrFile;

    const filePath = `${Date.now()}_${sanitizeStorageFileName(fileName)}`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn(`[Storage] No se pudo subir a bucket '${bucketName}', usando fallback:`, error.message);
      return typeof base64OrFile === 'string' ? base64OrFile : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn(`[Storage] Excepción en subida a '${bucketName}':`, err);
    return typeof base64OrFile === 'string' ? base64OrFile : '';
  }
};

export const uploadDocumentWithFallback = async (
  file,
  bucketName = BUCKET_ALIASES.documentosVoluntarios,
  maxSizeMB = 10
) => {
  if (!file) throw new Error('Selecciona un archivo válido para subir.');

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`El archivo "${file.name}" supera el máximo permitido de ${maxSizeMB} MB.`);
  }

  const cleanName = sanitizeStorageFileName(file.name);
  const contentType = file.type || 'application/octet-stream';

  if (isSupabaseReady()) {
    const filePath = `voluntarios/${Date.now()}_${cleanName}`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType,
        upsert: true
      });

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        nombre: file.name,
        url: publicUrlData.publicUrl,
        tamano: file.size,
        fecha: new Date().toISOString(),
        storageMode: 'supabase'
      };
    }

    console.warn(`[Storage] Fallback en '${bucketName}':`, error.message);
    if (file.size > INLINE_FALLBACK_MAX_BYTES) {
      throw new Error(
        `No se pudo guardar "${file.name}" en el repositorio (${error.message}). Si el bucket aún no tiene políticas públicas de subida, reduce el archivo a menos de 1,5 MB o envíalo por correo a coordinación.`
      );
    }
  }

  const dataUrl = await readFileAsDataURL(file);
  return {
    nombre: file.name,
    url: dataUrl,
    tamano: file.size,
    fecha: new Date().toISOString(),
    storageMode: 'inline'
  };
};

export const openStoredDocument = (url, fileName = 'documento') => {
  if (!url) return;

  if (typeof url === 'string' && url.startsWith('data:')) {
    try {
      const blob = dataURItoBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return;
    } catch (err) {
      console.warn('[Storage] No se pudo abrir data URL:', err);
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};
