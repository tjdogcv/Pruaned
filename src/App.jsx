import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Institutional } from './components/Institutional';
import { NewsSection } from './components/NewsSection';
import { DocumentsSection } from './components/DocumentsSection';
import { AuthModal } from './components/AuthModal';
import { SecurityDashboard } from './components/SecurityDashboard';
import { SociosIntranet } from './components/SociosIntranet';
import { VoluntariosIntranet } from './components/VoluntariosIntranet';
import { AdminCMS } from './components/AdminCMS';
import { CertificateVerify } from './components/CertificateVerify';
import { PostulacionSocio } from './components/PostulacionSocio';
import { PortalTransparencia } from './components/PortalTransparencia';
import { PrivateRoute } from './components/PrivateRoute';

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

function IntranetLayout({ children }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans'] text-slate-900">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('login=required')) {
      setIsAuthModalOpen(true);
    }
  }, [location.search]);

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
      />
    </div>
  );
}

function PublicPageWrapper({ component: Component, componentProps }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('login=required')) {
      setIsAuthModalOpen(true);
    }
  }, [location.search]);

  return (
    <PublicLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
      <Component {...(componentProps || {})} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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
      <Route path="/intranet/socios" element={
        <PrivateRoute>
          <IntranetLayout><SociosIntranet /></IntranetLayout>
        </PrivateRoute>
      } />
      <Route path="/intranet/voluntarios" element={
        <PrivateRoute>
          <IntranetLayout><VoluntariosIntranet /></IntranetLayout>
        </PrivateRoute>
      } />
      <Route path="/intranet/admin" element={
        <PrivateRoute>
          <IntranetLayout><AdminCMS /></IntranetLayout>
        </PrivateRoute>
      } />
      <Route path="/intranet/seguridad" element={
        <PrivateRoute>
          <IntranetLayout><SecurityDashboard /></IntranetLayout>
        </PrivateRoute>
      } />

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
