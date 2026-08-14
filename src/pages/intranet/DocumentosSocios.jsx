import { Navigate } from 'react-router-dom';
import { DocumentsSection } from '../../components/DocumentsSection';
import { useAuth } from '../../context/AuthContext';

export default function DocumentosSocios() {
  const { currentUser, isMasterUser, isDirectiva } = useAuth();
  const canViewMemberDocuments = isMasterUser || isDirectiva || currentUser?.role === 'socio';

  if (!canViewMemberDocuments) return <Navigate to="/intranet/dashboard" replace />;
  return <DocumentsSection visibility="socios" />;
}
