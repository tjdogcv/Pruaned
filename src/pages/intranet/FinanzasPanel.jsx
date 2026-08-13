import { Navigate } from 'react-router-dom';
import { SociosIntranet } from '../../components/SociosIntranet';
import { useAuth } from '../../context/AuthContext';

export default function FinanzasPanel() {
  const { canManageFinances } = useAuth();

  if (!canManageFinances) return <Navigate to="/intranet/dashboard" replace />;

  return <SociosIntranet section="finanzas" initialTab="balance" />;
}
