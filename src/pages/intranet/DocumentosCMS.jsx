import { Navigate } from 'react-router-dom';
import { AdminCMS } from '../../components/AdminCMS';
import { useAuth } from '../../context/AuthContext';

export default function DocumentosCMS() {
  const { canPublishCMS } = useAuth();
  if (!canPublishCMS) return <Navigate to="/intranet/dashboard" replace />;
  return <AdminCMS />;
}
