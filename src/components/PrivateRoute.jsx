import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPrivateRouteState } from '../context/authSession';

export const PrivateRoute = ({ children }) => {
  const { currentUser, is2FAVerified, isAuthRestoring } = useAuth();
  const location = useLocation();
  const routeState = getPrivateRouteState({ isAuthRestoring, currentUser, is2FAVerified });

  if (routeState === 'restoring') {
    return <div role="status" aria-live="polite" aria-busy="true">Verificando sesión…</div>;
  }

  if (routeState === 'unauthorized') {
    // Redirigir al home con indicador de que se requiere login
    return <Navigate to="/?login=required" state={{ from: location }} replace />;
  }

  return children;
};
