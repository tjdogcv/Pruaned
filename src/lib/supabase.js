/**
 * PRUANED A.G. — Cliente Supabase
 * PostgreSQL (base de datos) + Auth JWT + Storage S3-compatible
 *
 * Configura las variables en .env.local:
 *   VITE_SUPABASE_URL=https://TU_ID.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Aviso amigable en desarrollo cuando no están configuradas las credenciales
if (import.meta.env.DEV && (!supabaseUrl || supabaseUrl === 'PENDING')) {
  console.warn(
    '[PRUANED] ⚠️  Supabase pendiente de configuración.\n' +
    'Agrega en .env.local:\n' +
    '  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJ...\n' +
    'La app funciona en modo offline (localStorage) hasta entonces.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** ¿Está Supabase realmente configurado? */
export const isSupabaseReady = () =>
  !!supabaseUrl &&
  supabaseUrl !== 'PENDING' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'PENDING';

/** Buckets de Storage */
export const BUCKETS = {
  perfiles:   'perfiles',
  firmas:     'firmas-oficiales',
  documentos: 'documentos-publicos',
  documentosSocios: 'documentos-socios',
  cartasIntension: 'cartas-intencion',
};

/**
 * Subir archivo a Supabase Storage
 * Si Supabase no está configurado, devuelve la URL de objeto local (DataURL)
 */
export const uploadFile = async (file, bucket, path) => {
  if (!isSupabaseReady()) {
    // Fallback offline: convertir a DataURL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ url: reader.result, error: null });
      reader.readAsDataURL(file);
    });
  }

  const filePath = path || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });

  if (error) return { url: null, error };

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { url: publicUrl, error: null };
};
