import { Navigate } from 'react-router-dom';
import { SociosIntranet } from '../../components/SociosIntranet';
import { useAuth } from '../../context/AuthContext';

export default function AuditoriaLogs() {
  const { isMasterUser, isDirectiva } = useAuth();

  if (!isMasterUser && !isDirectiva) return <Navigate to="/intranet/dashboard" replace />;

  return <SociosIntranet initialTab="auditoria" />;
}
