import React, { useState } from 'react';
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

function MainLayout() {
  const { activeTab, setActiveTab } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Plus_Jakarta_Sans'] text-slate-900">
      
      {/* Navigation Header */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero 
              onOpenAuth={() => setIsAuthModalOpen(true)} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
            <Institutional />
            <NewsSection onOpenPublishModal={() => setActiveTab('admin')} />
            <DocumentsSection />
          </>
        )}

        {activeTab === 'institutional' && <Institutional />}
        {activeTab === 'postulacion' && <PostulacionSocio onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'news' && <NewsSection onOpenPublishModal={() => setActiveTab('admin')} />}
        {activeTab === 'docs' && <DocumentsSection />}
        {activeTab === 'socios' && <SociosIntranet />}
        {activeTab === 'voluntarios' && <VoluntariosIntranet />}
        {activeTab === 'admin' && <AdminCMS />}
        {activeTab === 'security' && <SecurityDashboard />}
        {activeTab === 'verificar' && <CertificateVerify />}
      </main>

      {/* Footer */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
