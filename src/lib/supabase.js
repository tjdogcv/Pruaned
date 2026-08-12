/**
 * PRUANED A.G. - Módulo de Integración Supabase / PostgreSQL & Bucket S3
 * Configuración para conexión con base de datos relacional y almacenamiento de archivos PDF en la nube.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://pruaned-db.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabaseClientConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  storageBuckets: {
    cartasIntencion: "cartas-intencion-pdf",
    facturasEgresos: "facturas-egresos-pdf",
    memoriasAnuales: "memorias-anuales-pdf"
  }
};

/**
 * Simulación / Helper para subir archivos a S3 / Supabase Storage
 */
export const uploadFileToS3Bucket = async (file, bucketName) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${Date.now()}_${file.name}`;
      resolve({
        success: true,
        url: mockUrl,
        filename: file.name
      });
    }, 500);
  });
};
