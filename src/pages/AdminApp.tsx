import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { TENANT_ID } from '../lib/supabase';
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

export function AdminApp({ onExitAdmin, onNavigatePublic, initialTab = 'dashboard' }: AdminAppProps) {
  const { user } = useAdminAuth();
  const routeStateKey = `cp-splash:admin-route:${TENANT_ID}:${user?.id || 'anonymous'}`;
  const validTabs: AdminTab[] = ['dashboard', 'commercial_brain', 'sales_leads', 'orders', 'products', 'product_new', 'product_edit', 'pricing', 'media', 'claims', 'blog', 'social', 'campaigns', 'retailers', 'analytics', 'settings'];
  const [restoredRoute] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(routeStateKey);
      const saved = raw ? JSON.parse(raw) as { tab?: AdminTab; productId?: string | null } : null;
      return saved && saved.tab && validTabs.includes(saved.tab)
        ? { tab: saved.tab, productId: saved.productId || null }
        : { tab: initialTab, productId: null };
    } catch {
      return { tab: initialTab, productId: null };
    }
  });
  const [currentTab, setCurrentTab] = useState<AdminTab>(restoredRoute.tab);
  const [editingProductId, setEditingProductId] = useState<string | null>(restoredRoute.productId);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(routeStateKey, JSON.stringify({
        tab: currentTab,
        productId: editingProductId,
        updatedAt: Date.now(),
      }));
    } catch (routeError) {
      console.warn('[CP SPLASH ADMIN ROUTE] Could not persist active admin route:', routeError);
    }
  }, [routeStateKey, currentTab, editingProductId]);

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId);
    setCurrentTab('product_edit');
  };

  const handleNewProduct = () => {
    setEditingProductId(null);
    setCurrentTab('product_new');
  };

  const handleProductSaved = (savedProduct: Product) => {
    setCurrentTab('products');
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onExitAdmin={onExitAdmin}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboard onSelectTab={setCurrentTab} />
      )}

      {currentTab === 'commercial_brain' && (
        <AdminCommercialBrain />
      )}

      {currentTab === 'sales_leads' && (
        <AdminLeadsManager />
      )}

      {currentTab === 'orders' && (
        <AdminOrdersManager />
      )}

      {currentTab === 'products' && (
        <AdminProductList
          onNewProduct={handleNewProduct}
          onEditProduct={handleEditProduct}
          onViewLive={(slug) => onNavigatePublic(`/products/${slug}`)}
        />
      )}

      {(currentTab === 'product_new' || currentTab === 'product_edit') && (
        <AdminProductEditor
          productId={editingProductId}
          onBack={() => setCurrentTab('products')}
          onSaved={handleProductSaved}
        />
      )}

      {currentTab === 'pricing' && (
        <AdminPriceManager />
      )}

      {currentTab === 'claims' && (
        <AdminClaimsManager />
      )}

      {currentTab === 'media' && (
        <AdminMediaManager />
      )}

      {currentTab === 'blog' && (
        <AdminBlogManager />
      )}

      {currentTab === 'social' && (
        <AdminSocialManager />
      )}

      {currentTab === 'campaigns' && (
        <AdminCampaignManager />
      )}

      {currentTab === 'retailers' && (
        <AdminRetailerManager />
      )}

      {currentTab === 'analytics' && (
        <AdminAnalyticsViewer />
      )}

      {currentTab === 'settings' && (
        <AdminSettings />
      )}
    </AdminLayout>
  );
}
