import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export const EMPTY_SERVER_PERMISSIONS = Object.freeze({
  isMasterUser: false,
  isDirectiva: false,
  canManageCategoriesAndCargos: false,
  canManageVoluntarios: false,
  canManageFinances: false,
  canPublishCMS: false
});

const getEmptyPermissions = () => ({ ...EMPTY_SERVER_PERMISSIONS });

export const useServerPermissions = ({ supabaseReady, email }) => {
  const [serverPermissions, setServerPermissions] = useState(getEmptyPermissions);

  useEffect(() => {
    if (!supabaseReady || !email) {
      setServerPermissions(getEmptyPermissions());
      return undefined;
    }

    let cancelled = false;
    const loadServerPermissions = async () => {
      try {
        const [masterRes, directivaRes, categoriesRes, voluntariosRes, financesRes, cmsRes] = await Promise.all([
          supabase.rpc('pruaned_is_master_user'),
          supabase.rpc('pruaned_is_directiva'),
          supabase.rpc('pruaned_can_manage_categories'),
          supabase.rpc('pruaned_can_manage_voluntarios'),
          supabase.rpc('pruaned_can_manage_finances'),
          supabase.rpc('pruaned_can_publish_cms')
        ]);
        if (cancelled) return;
        setServerPermissions({
          isMasterUser: Boolean(masterRes.data),
          isDirectiva: Boolean(directivaRes.data),
          canManageCategoriesAndCargos: Boolean(categoriesRes.data),
          canManageVoluntarios: Boolean(voluntariosRes.data),
          canManageFinances: Boolean(financesRes.data),
          canPublishCMS: Boolean(cmsRes.data)
        });
      } catch (error) {
        console.error('Error cargando permisos desde Supabase:', error);
        if (!cancelled) setServerPermissions(getEmptyPermissions());
      }
    };

    void loadServerPermissions();
    return () => { cancelled = true; };
  }, [email, supabaseReady]);

  return serverPermissions;
};

/** Combina los permisos autorizados por el servidor con compatibilidad offline. */
