import React, { useState, useEffect } from 'react';
import { Header } from './components/navigation/Header';
import { Footer } from './components/navigation/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsCatalogPage } from './pages/ProductsCatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CampaignLandingPage } from './pages/CampaignLandingPage';
import { BlogIndexPage, BlogPostPage } from './pages/BlogPages';
import { FindRetailersPage } from './pages/FindRetailersPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { StoryPage } from './pages/StoryPage';
import { CertificationPage } from './pages/CertificationPage';
import { AdminApp } from './pages/AdminApp';
import { WhatsAppOrderModal } from './components/product/WhatsAppOrderModal';
import { Product } from './types/database.types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Dispatcher
  const renderContent = () => {
    // Admin CMS routes
    if (currentPath.startsWith('/admin')) {
      return (
        <AdminApp
          onExitAdmin={() => navigate('/')}
          onNavigatePublic={(path) => navigate(path)}
        />
      );
    }

    // Dynamic Product Detail: /products/:slug
    if (currentPath.startsWith('/products/')) {
      const slug = currentPath.replace('/products/', '').trim();
      return (
        <ProductDetailPage
          slug={slug}
          onNavigate={navigate}
          onOpenOrderModal={setOrderModalProduct}
        />
      );
    }

    // Products catalog: /products
    if (currentPath === '/products') {
      return (
        <ProductsCatalogPage
          onNavigate={navigate}
          onOpenOrderModal={setOrderModalProduct}
        />
      );
    }

    // Dynamic Campaign: /campaign/:slug
    if (currentPath.startsWith('/campaign/')) {
      const slug = currentPath.replace('/campaign/', '').trim();
      return (
        <CampaignLandingPage
          slug={slug}
          onNavigate={navigate}
          onOpenOrderModal={setOrderModalProduct}
        />
      );
    }

    // Blog routes
    if (currentPath.startsWith('/blog/')) {
      const slug = currentPath.replace('/blog/', '').trim();
      return (
        <BlogPostPage
          slug={slug}
          onNavigate={navigate}
          onOpenOrderModal={setOrderModalProduct}
        />
      );
    }

    if (currentPath === '/blog') {
      return <BlogIndexPage onNavigate={navigate} />;
    }

    // Retailer Directory: /find-cp-splash
    if (currentPath === '/find-cp-splash') {
      return <FindRetailersPage />;
    }

    // Verified Claims
    if (currentPath === '/claims') {
      return <ClaimsPage />;
    }

    // Heritage Story
    if (currentPath === '/story') {
      return <StoryPage />;
    }

    // HOEOS Master Certification
    if (currentPath === '/certification') {
      return <CertificationPage onNavigate={navigate} />;
    }

    // Default Home Page
    return (
      <HomePage
        onNavigate={navigate}
        onOpenOrderModal={setOrderModalProduct}
      />
    );
  };

  const isAdmin = currentPath.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Public Header (hidden on admin) */}
      {!isAdmin && (
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
        />
      )}

      {/* Main Page View */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Public Footer (hidden on admin) */}
      {!isAdmin && (
        <Footer onNavigate={navigate} />
      )}

      {/* WhatsApp Deterministic Order Modal */}
      {orderModalProduct && (
        <WhatsAppOrderModal
          product={orderModalProduct}
          onClose={() => setOrderModalProduct(null)}
        />
      )}
    </div>
  );
}
