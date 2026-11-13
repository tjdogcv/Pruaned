import { supabase, isSupabaseReady } from './supabase';

const dataURItoBlob = (dataURI) => {
  const arr = dataURI.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const uploadToSupabaseStorage = async (bucketName, fileName, base64OrFile, contentType = 'image/webp') => {
  if (!isSupabaseReady()) {
    return typeof base64OrFile === 'string' ? base64OrFile : '';
  }

  try {
    const fileBody = typeof base64OrFile === 'string' && base64OrFile.startsWith('data:')
      ? dataURItoBlob(base64OrFile)
      : base64OrFile;

    const filePath = `${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
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
