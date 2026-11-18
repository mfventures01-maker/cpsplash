import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminCommercialBrain } from '../components/admin/AdminCommercialBrain';
import { AdminLeadsManager } from '../components/admin/AdminLeadsManager';
import { AdminOrdersManager } from '../components/admin/AdminOrdersManager';
import { AdminProductList } from '../components/admin/AdminProductList';
import { AdminProductEditor } from '../components/admin/AdminProductEditor';
import { AdminPriceManager } from '../components/admin/AdminPriceManager';
import { AdminClaimsManager } from '../components/admin/AdminClaimsManager';
import { AdminMediaManager } from '../components/admin/AdminMediaManager';
import { AdminBlogManager } from '../components/admin/AdminBlogManager';
import { AdminSocialManager } from '../components/admin/AdminSocialManager';
import { AdminCampaignManager } from '../components/admin/AdminCampaignManager';
import { AdminRetailerManager } from '../components/admin/AdminRetailerManager';
import { AdminAnalyticsViewer } from '../components/admin/AdminAnalyticsViewer';
import { AdminSettings } from '../components/admin/AdminSettings';
import { Product } from '../types/database.types';

interface AdminAppProps {
  onExitAdmin: () => void;
  onNavigatePublic: (path: string) => void;
  initialTab?: AdminTab;
}

const TAB_PATHS: Record<Exclude<AdminTab, 'product_new' | 'product_edit'>, string> = {
  dashboard: '/admin',
  commercial_brain: '/admin/commercial-brain',
  sales_leads: '/admin/sales-leads',
  orders: '/admin/orders',
  products: '/admin/products',
  pricing: '/admin/pricing',
  media: '/admin/media',
  claims: '/admin/claims',
  blog: '/admin/blog',
  social: '/admin/social',
  campaigns: '/admin/campaigns',
  retailers: '/admin/retailers',
  analytics: '/admin/analytics',
  settings: '/admin/settings',
};

const VALID_TABS: AdminTab[] = [
  'dashboard', 'commercial_brain', 'sales_leads', 'orders', 'products',
  'product_new', 'product_edit', 'pricing', 'media', 'claims', 'blog',
  'social', 'campaigns', 'retailers', 'analytics', 'settings',
];

function resolveAdminRoute(pathname: string, fallback: AdminTab = 'dashboard') {
  const path = pathname.replace(/\\/+$/, '') || '/admin';
  const editMatch = path.match(/^\/admin\/products\/([^/]+)\/edit$/);

  if (editMatch) {
    return { tab: 'product_edit' as AdminTab, productId: decodeURIComponent(editMatch[1]) };
  }
  if (path === '/admin/products/new') return { tab: 'product_new' as AdminTab, productId: null };

  const matchedTab = (Object.entries(TAB_PATHS) as [Exclude<AdminTab, 'product_new' | 'product_edit'>, string][])
    .find(([, routePath]) => routePath === path)?.[0];

  return {
    tab: matchedTab && VALID_TABS.includes(matchedTab) ? matchedTab : fallback,
    productId: null,
  };
}

function getAdminPath(tab: AdminTab, productId: string | null): string {
  if (tab === 'product_edit' && productId) {
    return `/admin/products/${encodeURIComponent(productId)}/edit`;
  }
  if (tab === 'product_new') return '/admin/products/new';
  return TAB_PATHS[tab as Exclude<AdminTab, 'product_new' | 'product_edit'>] || '/admin';
}

export function AdminApp({ onExitAdmin, onNavigatePublic, initialTab = 'dashboard' }: AdminAppProps) {
  const { user } = useAdminAuth();
  const [route, setRoute] = useState(() => resolveAdminRoute(window.location.pathname, initialTab));
  const { tab: currentTab, productId: editingProductId } = route;

  // The URL is the source of truth for CMS navigation. This survives refreshes,
  // remounts, copied links, and browser Back/Forward without falling back to Dashboard.
  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveAdminRoute(window.location.pathname, initialTab));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialTab]);

  const navigateTab = (tab: AdminTab, productId: string | null = null) => {
    const nextPath = getAdminPath(tab, productId);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ admin: true, tab, productId }, '', nextPath);
    }
    setRoute({ tab, productId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditProduct = (productId: string) => {
    navigateTab('product_edit', productId);
  };

  const handleNewProduct = () => {
    navigateTab('product_new');
  };

  const handleProductSaved = (_savedProduct: Product) => {
    navigateTab('products');
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => navigateTab(tab)}
      onExitAdmin={onExitAdmin}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboard onSelectTab={(tab) => navigateTab(tab)} />
      )}

      {currentTab === 'commercial_brain' && <AdminCommercialBrain />}
      {currentTab === 'sales_leads' && <AdminLeadsManager />}
      {currentTab === 'orders' && <AdminOrdersManager />}

      {currentTab === 'products' && (
        <AdminProductList
          onNewProduct={handleNewProduct}
          onEditProduct={handleEditProduct}
          onViewLive={(slug) => onNavigatePublic(`/products/${slug}`)}
        />
      )}

      {(currentTab === 'product_new' || currentTab === 'product_edit') && (
        <AdminProductEditor
          key={`${currentTab}:${editingProductId || 'new'}`}
          productId={editingProductId}
          onBack={() => navigateTab('products')}
          onSaved={handleProductSaved}
        />
      )}

      {currentTab === 'pricing' && <AdminPriceManager />}
      {currentTab === 'claims' && <AdminClaimsManager />}
      {currentTab === 'media' && <AdminMediaManager />}
      {currentTab === 'blog' && <AdminBlogManager />}
      {currentTab === 'social' && <AdminSocialManager />}
      {currentTab === 'campaigns' && <AdminCampaignManager />}
      {currentTab === 'retailers' && <AdminRetailerManager />}
      {currentTab === 'analytics' && <AdminAnalyticsViewer />}
      {currentTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
}
