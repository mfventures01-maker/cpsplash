import React, { useState } from 'react';
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
  const [currentTab, setCurrentTab] = useState<AdminTab>(initialTab);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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
