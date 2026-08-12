import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { currentUser, is2FAVerified } = useAuth();
  const location = useLocation();

  if (!currentUser || !is2FAVerified) {
    // Redirigir al home con indicador de que se requiere login
    return <Navigate to="/?login=required" state={{ from: location }} replace />;
  }

  return children;
};
