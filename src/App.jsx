import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Institutional } from './components/Institutional';
import { NewsSection } from './components/NewsSection';
import { DocumentsSection } from './components/DocumentsSection';
import { AuthModal } from './components/AuthModal';
import { SecurityDashboard } from './components/SecurityDashboard';
import { CertificateVerify } from './components/CertificateVerify';
import { PostulacionSocio } from './components/PostulacionSocio';
import { PortalTransparencia } from './components/PortalTransparencia';
import { PrivateRoute } from './components/PrivateRoute';
import { IntranetLayout } from './layouts/IntranetLayout';
import DashboardHome from './pages/intranet/DashboardHome';
import SociosDirectory from './pages/intranet/SociosDirectory';
import DirectorioNacional from './pages/intranet/DirectorioNacional';
import FinanzasPanel from './pages/intranet/FinanzasPanel';
import VoluntariadoLMS from './pages/intranet/VoluntariadoLMS';
import DocumentosCMS from './pages/intranet/DocumentosCMS';
import AuditoriaLogs from './pages/intranet/AuditoriaLogs';

function PublicLayout({ children, onOpenAuth }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans'] text-slate-900">
      <Navbar onOpenAuth={onOpenAuth} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash.includes('type=recovery') || location.search.includes('type=recovery')) {
      setAuthMode('update_password');
      setIsAuthModalOpen(true);
    } else if (location.search.includes('login=required') || location.search.includes('login=true')) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  }, [location.search, location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans'] text-slate-900">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <main className="flex-1">
        <Hero
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onNavigate={(path) => navigate(path)}
        />
        <Institutional />
        <NewsSection />
        <DocumentsSection />
      </main>
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

function PublicPageWrapper({ component: Component, componentProps }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const location = useLocation();

  useEffect(() => {
    if (location.hash.includes('type=recovery') || location.search.includes('type=recovery')) {
      setAuthMode('update_password');
      setIsAuthModalOpen(true);
    } else if (location.search.includes('login=required') || location.search.includes('login=true')) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  }, [location.search, location.hash]);

  return (
    <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
      <Component {...(componentProps || {})} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </PublicLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/institucional" element={<PublicPageWrapper component={Institutional} />} />
      <Route path="/noticias" element={<PublicPageWrapper component={NewsSection} />} />
      <Route path="/documentos" element={<PublicPageWrapper component={DocumentsSection} />} />
      <Route path="/transparencia" element={<PublicPageWrapper component={PortalTransparencia} />} />
      <Route path="/postulacion" element={<PublicPageWrapper component={PostulacionSocio} />} />
      <Route path="/verificar" element={<PublicPageWrapper component={CertificateVerify} />} />
      <Route path="/verificar/:hash" element={<PublicPageWrapper component={CertificateVerify} />} />

      {/* Rutas privadas — Intranet */}
      <Route path="/intranet" element={
        <PrivateRoute>
          <IntranetLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="socios" element={<SociosDirectory />} />
        <Route path="directorio" element={<DirectorioNacional />} />
        <Route path="finanzas" element={<FinanzasPanel />} />
        <Route path="voluntarios" element={<VoluntariadoLMS />} />
        <Route path="admin" element={<DocumentosCMS />} />
        <Route path="auditoria" element={<AuditoriaLogs />} />
        <Route path="seguridad" element={<SecurityDashboard />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Redirigir rutas desconocidas al home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
