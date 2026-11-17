import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MediaAsset, MediaPlacement, PlacementScopeType, Product, ProductMediaRelation } from '../../types/database.types';
import { mediaService, ACCEPTED_IMAGE_MIME_TYPES } from '../../services/mediaService';
import { placementService } from '../../services/placementService';
import { productsService } from '../../services/productsService';
import {
  ExternalLink,
  RefreshCw,
  Trash2,
  Upload,
  Plus,
  Layers,
  Image as ImageIcon,
  Film,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

const FUNNEL_SLUGS = [
  { slug: 'sports', label: 'Sports & Athletics' },
  { slug: 'parties-events', label: 'Parties & Events' },
  { slug: 'hotels-hospitality', label: 'Hotels & Hospitality' },
  { slug: 'schools', label: 'Schools & Campuses' },
  { slug: 'individuals', label: 'Individuals & Direct' }
];

export function AdminMediaManager() {
  const [activeTab, setActiveTab] = useState<'library' | 'placements' | 'products'>('library');

  // Library state
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetFilter, setAssetFilter] = useState<'all' | 'image' | 'animation' | 'video'>('all');

  // Placements state
  const [placements, setPlacements] = useState<MediaPlacement[]>([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  // Product media state
  const [products, setProducts] = useState<Product[]>([]);
  const [productMediaList, setProductMediaList] = useState<ProductMediaRelation[]>([]);
  const [loadingProductMedia, setLoadingProductMedia] = useState(true);

  // Upload Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [allowOversized, setAllowOversized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Placement modal state
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [modalMediaId, setModalMediaId] = useState<string>('');
  const [modalScopeType, setModalScopeType] = useState<PlacementScopeType>('homepage_hero');
  const [modalScopeId, setModalScopeId] = useState<string>('');
  const [modalPlacementKey, setModalPlacementKey] = useState<string>('');
  const [modalSortOrder, setModalSortOrder] = useState<number>(0);
  const [modalAltOverride, setModalAltOverride] = useState<string>('');
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [funnelSlotSelections, setFunnelSlotSelections] = useState<Record<string, string>>({});
  const [savingFunnelSlot, setSavingFunnelSlot] = useState<string | null>(null);
  const [funnelSlotFeedback, setFunnelSlotFeedback] = useState<Record<string, string>>({});

  // Product link modal state
  const [showProductLinkModal, setShowProductLinkModal] = useState(false);
  const [linkMediaId, setLinkMediaId] = useState<string>('');
  const [linkProductId, setLinkProductId] = useState<string>('');
  const [linkIsPrimary, setLinkIsPrimary] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Data fetchers
  const fetchAssets = async () => {
    setLoadingAssets(true);
    const data = await mediaService.getAllMediaAssets();
    setAssets(data);
    setLoadingAssets(false);
  };

  const fetchPlacements = async () => {
    setLoadingPlacements(true);
    const data = await placementService.getAllPlacements();
    setPlacements(data);
    setLoadingPlacements(false);
  };

  const fetchProductMedia = async () => {
    setLoadingProductMedia(true);
    const [{ data: pList }, { data: pmData }] = await Promise.all([
      productsService.getAllProducts(),
      supabase
        .from('product_media')
        .select('*, media_assets(*), product:products(name, slug)')
        .order('created_at', { ascending: false })
    ]);
    if (pList) setProducts(pList);
    setProductMediaList((pmData as unknown as ProductMediaRelation[]) || []);
    setLoadingProductMedia(false);
  };

  const refreshAll = () => {
    fetchAssets();
    fetchPlacements();
    fetchProductMedia();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // File selection & preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);
    const objUrl = URL.createObjectURL(file);
    setFilePreview(objUrl);

    if (!uploadAltText) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadAltText(nameWithoutExt.replace(/[-_]/g, ' '));
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress('Validating file signature & format...');
    setUploadError(null);
    setUploadSuccess(null);

    try {
      setUploadProgress('Transferring to Supabase Storage (cp-public)...');
      const result = await mediaService.uploadAsset(selectedFile, {
        altText: uploadAltText.trim(),
        caption: uploadCaption.trim() || undefined,
        allowOversizedAnimation: allowOversized,
      });

      if (result.error || !result.data) {
        setUploadError(result.error || 'Upload failed');
      } else {
        setUploadSuccess(
          result.warning
            ? `Asset processed: ${result.warning}`
            : `Successfully uploaded ${result.data.filename}!`
        );
        setSelectedFile(null);
        setFilePreview(null);
        setUploadAltText('');
        setUploadCaption('');
        setAllowOversized(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAssets();
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed unexpectedly');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Open placement modal for an asset
  const handleOpenPlacementModal = (assetId: string) => {
    setModalMediaId(assetId);
    setModalScopeType('homepage_hero');
    setModalScopeId('');
    setModalPlacementKey(`placement_${Date.now()}`);
    setModalSortOrder(placements.length + 1);
    setModalAltOverride('');
    setPlacementError(null);
    setShowPlacementModal(true);
  };

  // Save placement
  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMediaId || !modalPlacementKey.trim()) {
      setPlacementError('Placement key and media asset are required');
      return;
    }

    const { data: createdPlacement, error } = await placementService.createPlacement({
      media_id: modalMediaId,
      placement_key: modalPlacementKey.trim(),
      scope_type: modalScopeType,
      scope_id: modalScopeType.startsWith('funnel') || modalScopeType === 'campaign' || modalScopeType === 'sales_journey' ? modalScopeId : null,
      sort_order: modalSortOrder,
      active: true,
      alt_text_override: modalAltOverride.trim() || null,
    });

    if (error || !createdPlacement) {
      setPlacementError(error || 'Publication verification failed: placement could not be confirmed in Supabase.');
    } else {
      setShowPlacementModal(false);
      fetchPlacements();
      setActiveTab('placements');
    }
  };

  // Save one independently managed hero/card image for a specific funnel.
  const handleSaveFunnelSlot = async (slug: string, slot: 'funnel_hero' | 'funnel_card') => {
    const slotKey = `${slug}:${slot}`;
    const mediaId = funnelSlotSelections[slotKey] || '';
    if (!mediaId) {
      setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: 'Choose an image before saving.' }));
      return;
    }

    const selectedAsset = assets.find(asset => asset.id === mediaId);
    if (!selectedAsset || selectedAsset.media_type !== 'image' || !ACCEPTED_IMAGE_MIME_TYPES.has((selectedAsset.mime_type || '').toLowerCase())) {
      setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: 'Select a supported image asset, not a video.' }));
      return;
    }

    setSavingFunnelSlot(slotKey);
    setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: '' }));
    try {
      const existing = placements.filter(item =>
        item.scope_type === slot && item.scope_id === slug && item.active
      );
      let failure: string | null = null;

      // Deactivate competing active placements so the public funnel resolves one deterministic image.
      for (const item of existing) {
        if (item.media_id === mediaId) continue;
        const result = await placementService.updatePlacement(item.id, { active: false });
        if (result.error) { failure = result.error; break; }
      }

      if (!failure) {
        const current = existing.find(item => item.media_id === mediaId);
        if (current) {
          const result = await placementService.updatePlacement(current.id, { active: true });
          failure = result.error;
        } else {
          const result = await placementService.createPlacement({
            media_id: mediaId,
            placement_key: `funnel_${slot === 'funnel_hero' ? 'hero' : 'card'}_${slug}`,
            scope_type: slot,
            scope_id: slug,
            sort_order: 1,
            active: true,
          });
          failure = result.error;
        }
      }

      if (failure) {
        setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: failure || 'Could not save this image.' }));
      } else {
        await fetchPlacements();
        setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: 'Saved and verified in Supabase.' }));
      }
    } catch (err) {
      setFunnelSlotFeedback(prev => ({ ...prev, [slotKey]: err instanceof Error ? err.message : 'Could not save this image.' }));
    } finally {
      setSavingFunnelSlot(null);
    }
  };

  // Toggle placement active
  const handleTogglePlacementActive = async (placement: MediaPlacement) => {
    await placementService.updatePlacement(placement.id, {
      active: !placement.active
    });
    fetchPlacements();
  };

  // Move placement order
  const handleMovePlacement = async (index: number, direction: 'up' | 'down') => {
    const filtered = filteredPlacements;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    const currentItem = filtered[index];
    const targetItem = filtered[targetIndex];

    await Promise.all([
      placementService.updatePlacement(currentItem.id, { sort_order: targetItem.sort_order }),
      placementService.updatePlacement(targetItem.id, { sort_order: currentItem.sort_order })
    ]);

    fetchPlacements();
  };

  // Delete placement
  const handleDeletePlacement = async (id: string) => {
    if (confirm('Remove this placement? The media asset itself will NOT be deleted.')) {
      await placementService.deletePlacement(id);
      fetchPlacements();
    }
  };

  // Open product link modal
  const handleOpenProductLinkModal = (assetId: string) => {
    setLinkMediaId(assetId);
    setLinkProductId(products[0]?.id || '');
    setLinkIsPrimary(false);
    setLinkError(null);
    setShowProductLinkModal(true);
  };

  // Save product link
  const handleSaveProductLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkMediaId || !linkProductId) {
      setLinkError('Product and media asset are required');
      return;
    }

    const { error } = await mediaService.linkAssetToProduct(
      linkProductId,
      linkMediaId,
      linkIsPrimary
    );

    if (error) {
      setLinkError(error);
    } else {
      setShowProductLinkModal(false);
      fetchProductMedia();
      setActiveTab('products');
    }
  };

  // Delete product media relation
  const handleDeleteProductMedia = async (productId: string, mediaId: string) => {
    if (confirm('Unlink this media from the product?')) {
      await mediaService.deleteMedia(productId, mediaId);
      fetchProductMedia();
    }
  };

  // Filtered Assets
  const filteredAssets = assets.filter(a => {
    if (assetFilter === 'all') return true;
    if (assetFilter === 'animation') return a.mime_type === 'image/gif' || a.mime_type === 'image/webp';
    if (assetFilter === 'image') return a.media_type === 'image' && a.mime_type !== 'image/gif';
    if (assetFilter === 'video') return a.media_type === 'video';
    return true;
  });

  // Filtered Placements
  const filteredPlacements = placements.filter(p => {
    if (scopeFilter === 'all') return true;
    if (scopeFilter === 'homepage_hero') return p.scope_type === 'homepage_hero';
    if (scopeFilter === 'homepage_carousel') return p.scope_type === 'homepage_carousel';
    if (scopeFilter === 'product_menu') return p.scope_type === 'product_menu';
    if (scopeFilter.startsWith('funnel:')) {
      const slug = scopeFilter.split(':')[1];
      return p.scope_type === 'funnel_hero' && p.scope_id === slug;
    }
    return true;
  });

  const selectedFileIsAnimation = Boolean(
    selectedFile && (
      selectedFile.type === 'image/gif' ||
      selectedFile.name.toLowerCase().endsWith('.gif')
    )
  );
  const selectedFileIsOversizedAnimation = Boolean(
    selectedFileIsAnimation && (selectedFile?.size || 0) > 102400
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
            Supabase Storage & Placements SSOT
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Media & Placements Engine
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Bucket: <code>cp-public</code> • Formats: JPEG, PNG, WebP, GIF (animated) • Targets: Homepage, Product Menu & 5 Sales Funnels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'library'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Media Library & Upload ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('placements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'placements'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Persistent Placements ({placements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Product Media Links ({productMediaList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEDIA LIBRARY & UPLOADER */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-8">
          {/* Uploader Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Upload Media Asset</h3>
                <p className="text-xs text-stone-500">
                  Upload static images or animated GIFs directly to Supabase Storage independent of product creation.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                cp-public bucket
              </span>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* File picker drop area */}
                <div className="md:col-span-6 space-y-3">
                  <label className="block text-xs font-bold text-stone-700">
                    File Selection (JPG, PNG, WebP, GIF, MP4)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-rose-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-rose-50/20"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-stone-700">
                      {selectedFile ? selectedFile.name : 'Click to select or drop media file'}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Max file size: 30 MB. Animations recommended under 100 KB.
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3 rounded-xl bg-stone-100 text-xs flex items-center justify-between font-mono">
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <span className="font-bold text-stone-600">
                        {Math.round(selectedFile.size / 1024)} KB
                      </span>
                    </div>
                  )}
                </div>

                {/* Preview & Metadata */}
                <div className="md:col-span-6 space-y-4">
                  {filePreview ? (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-700 block">
                        Live Preview (Animation Intact)
                      </span>
                      <div className="aspect-video w-full max-h-48 rounded-2xl bg-stone-900 border border-stone-200 overflow-hidden flex items-center justify-center relative">
                        {selectedFile?.type.startsWith('video/') ? (
                          <video src={filePreview} controls className="max-h-full max-w-full object-contain" />
                        ) : (
                          <img
                            src={filePreview}
                            alt="Upload preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                        {selectedFileIsAnimation && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wide">
                            GIF Animation
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full max-h-48 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-xs text-stone-400">
                      Preview will display here upon file selection
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Alt Text (Accessibility & SEO)
                      </label>
                      <input
                        type="text"
                        value={uploadAltText}
                        onChange={(e) => setUploadAltText(e.target.value)}
                        placeholder="e.g. CP Splash Zesty Orange Cold Bottle"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Optional Caption
                      </label>
                      <input
                        type="text"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="e.g. Sapele Flagship Fresh Production"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                      />
                    </div>

                    {/* Oversized Animation Warning & Confirmation */}
                    {selectedFileIsOversizedAnimation && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Animation Exceeds 100 KB Optimization Target</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          This animated GIF is {Math.round((selectedFile?.size || 0) / 1024)} KB. Mobile performance recommends under 100 KB. Check the box below to authorize this oversized asset upload.
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950 pt-1">
                          <input
                            type="checkbox"
                            checked={allowOversized}
                            onChange={(e) => setAllowOversized(e.target.checked)}
                            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Authorize linked-media upload for this animation</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress and status messages */}
              {isUploading && uploadProgress && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading || (selectedFileIsOversizedAnimation && !allowOversized)}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-900/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading & Persisting...' : 'Upload & Persist Asset'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Library Assets Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Persisted Media Assets</h3>
                <p className="text-xs text-stone-500">
                  Select an asset to assign to the homepage, product menu, or one of the 5 sales funnels.
                </p>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setAssetFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    assetFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({assets.length})
                </button>
                <button
                  onClick={() => setAssetFilter('animation')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    assetFilter === 'animation' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Animations / GIFs
                </button>
                <button
                  onClick={() => setAssetFilter('image')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    assetFilter === 'image' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Static Images
                </button>
                <button
                  onClick={() => setAssetFilter('video')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    assetFilter === 'video' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Videos
                </button>
              </div>
            </div>

            {loadingAssets ? (
              <div className="p-12 text-center text-xs text-stone-400">Loading assets from Supabase...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200">
                No media assets match the selected filter. Upload a media asset above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => {
                  const imgUrl = mediaService.getMediaAssetUrl(asset);
                  const isGif = asset.mime_type === 'image/gif';

                  return (
                    <div
                      key={asset.id}
                      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-2 p-2 flex flex-col justify-between"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative">
                        {asset.media_type === 'video' ? (
                          <video src={imgUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={imgUrl}
                            alt={asset.alt_text || asset.filename || 'Asset'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}

                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/80 text-white text-[9px] font-mono uppercase">
                          {isGif ? 'GIF Animation' : asset.mime_type || asset.media_type}
                        </div>

                        {asset.status === 'active' && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold uppercase">
                            Active
                          </div>
                        )}
                      </div>

                      <div className="px-1 text-xs space-y-2">
                        <div>
                          <p className="font-semibold text-stone-800 truncate text-[11px]" title={asset.alt_text || asset.filename || ''}>
                            {asset.alt_text || asset.filename}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {asset.size_bytes ? `${Math.round(asset.size_bytes / 1024)} KB` : 'N/A'} • {asset.bucket}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-1 border-t border-stone-100 flex flex-col gap-1.5">
                          <button
                            onClick={() => handleOpenPlacementModal(asset.id)}
                            className="w-full py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Assign Placement</span>
                          </button>

                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => handleOpenProductLinkModal(asset.id)}
                              className="py-1 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>Link Product</span>
                            </button>

                            <a
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-500 hover:text-stone-800 p-1 rounded hover:bg-stone-100"
                              title="Open public Storage URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERSISTENT PLACEMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Storefront & Funnel Placements</h3>
              <p className="text-xs text-stone-500">
                Manage persistent assignments for Homepage Hero, Product Menu, and the 5 Sales Funnels.
              </p>
            </div>

            <button
              onClick={() => {
                if (assets.length > 0) handleOpenPlacementModal(assets[0].id);
                else alert('Upload at least one media asset first.');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Placement</span>
            </button>
          </div>

          {/* Five-funnel independent hero and card image controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {FUNNEL_SLUGS.map((funnel) => (
              <div key={funnel.slug} className="rounded-2xl border border-stone-200 bg-white p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{funnel.label}</h4>
                  <p className="text-[11px] text-stone-500">Hero and card images are saved independently for this funnel.</p>
                </div>
                {(['funnel_hero', 'funnel_card'] as const).map((slot) => {
                  const slotKey = `${funnel.slug}:${slot}`;
                  const activePlacement = placements.find(item => item.scope_type === slot && item.scope_id === funnel.slug && item.active);
                  const selectedValue = funnelSlotSelections[slotKey] ?? activePlacement?.media_id ?? '';
                  const imageAssets = assets.filter(asset =>
                    asset.status === 'active' &&
                    asset.media_type === 'image' &&
                    ACCEPTED_IMAGE_MIME_TYPES.has((asset.mime_type || '').toLowerCase())
                  );
                  return (
                    <div key={slot} className="space-y-2">
                      <label className="block text-xs font-semibold text-stone-700">
                        {slot === 'funnel_hero' ? 'Hero image' : 'Card image'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedValue}
                          onChange={(event) => setFunnelSlotSelections(prev => ({ ...prev, [slotKey]: event.target.value }))}
                          className="min-w-0 flex-1 text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                        >
                          <option value="">Choose uploaded image…</option>
                          {imageAssets.map(asset => (
                            <option key={asset.id} value={asset.id}>
                              {asset.filename || asset.alt_text || asset.id.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveFunnelSlot(funnel.slug, slot)}
                          disabled={savingFunnelSlot === slotKey || imageAssets.length === 0}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {savingFunnelSlot === slotKey ? 'Saving…' : 'Save image'}
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {activePlacement ? `Currently published: ${activePlacement.media_assets?.filename || activePlacement.media_id.slice(0, 8)}` : 'No active image published'}
                      </p>
                      {funnelSlotFeedback[slotKey] && (
                        <p className={`text-[11px] ${funnelSlotFeedback[slotKey].startsWith('Saved') ? 'text-emerald-700' : 'text-red-600'}`}>
                          {funnelSlotFeedback[slotKey]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Scope Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Scopes
            </button>
            <button
              onClick={() => setScopeFilter('homepage_hero')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === 'homepage_hero' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Homepage Hero
            </button>
            <button
              onClick={() => setScopeFilter('product_menu')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                scopeFilter === 'product_menu' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Product Menu
            </button>
            {FUNNEL_SLUGS.map((f) => (
              <button
                key={f.slug}
                onClick={() => setScopeFilter(`funnel:${f.slug}`)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  scopeFilter === `funnel:${f.slug}` ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Funnel: {f.label}
              </button>
            ))}
          </div>

          {/* Placements List */}
          {loadingPlacements ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading media placements...</div>
          ) : filteredPlacements.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 space-y-2">
              <p className="font-semibold">No placements configured for this scope.</p>
              <p className="text-[11px]">Click "New Placement" or select an asset from the Library to assign media.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
              {filteredPlacements.map((placement, index) => {
                const asset = placement.media_assets || placement.asset;
                const imgUrl = mediaService.getMediaAssetUrl(asset);
                const isGif = asset?.mime_type === 'image/gif';

                return (
                  <div key={placement.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 relative">
                        <img
                          src={imgUrl}
                          alt={placement.alt_text_override || asset?.alt_text || 'Placement'}
                          className="w-full h-full object-cover"
                        />
                        {isGif && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[8px] font-bold uppercase">
                            GIF
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            {placement.placement_key}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold uppercase">
                            {placement.scope_type}
                            {placement.scope_id ? ` (${placement.scope_id})` : ''}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              placement.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {placement.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          Alt Text: <span className="text-stone-700 italic">{placement.alt_text_override || asset?.alt_text || asset?.filename || 'None'}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          Sort Order: #{placement.sort_order} • Asset: {asset?.filename || placement.media_id}
                        </p>
                      </div>
                    </div>

                    {/* Order & Management Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center bg-stone-100 rounded-xl p-0.5">
                        <button
                          onClick={() => handleMovePlacement(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMovePlacement(index, 'down')}
                          disabled={index === filteredPlacements.length - 1}
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-white disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleTogglePlacementActive(placement)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          placement.active
                            ? 'border-stone-200 hover:bg-stone-100 text-stone-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                        title={placement.active ? 'Deactivate placement' : 'Activate placement'}
                      >
                        {placement.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[11px]">{placement.active ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      <button
                        onClick={() => handleDeletePlacement(placement.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                        title="Remove placement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT MEDIA LINKS */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Product Media Relations</h3>
              <p className="text-xs text-stone-500">
                Media linked directly to products in the catalog. Setting primary media satisfies the publication gate.
              </p>
            </div>

            <button
              onClick={() => {
                if (assets.length > 0) handleOpenProductLinkModal(assets[0].id);
                else alert('Upload at least one media asset first.');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Link Asset to Product</span>
            </button>
          </div>

          {loadingProductMedia ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading product media links...</div>
          ) : productMediaList.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 space-y-2">
              <p className="font-semibold">No product media links found.</p>
              <p className="text-[11px]">Attach existing assets to products or add media from the Product Editor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productMediaList.map((item) => {
                const asset = item.media_assets || item.asset;
                const imgUrl = mediaService.getMediaAssetUrl(asset);
                const isGif = asset?.mime_type === 'image/gif';

                return (
                  <div
                    key={`${item.product_id}-${item.media_id}`}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-2 p-2 flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative">
                      <img src={imgUrl} alt={asset?.alt_text || 'Product Media'} className="w-full h-full object-cover" />
                      {isGif && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/80 text-white text-[9px] font-mono uppercase">
                          GIF Animation
                        </div>
                      )}
                      {item.is_primary && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase">
                          Primary
                        </div>
                      )}
                    </div>

                    <div className="px-1 text-xs space-y-1.5">
                      <div>
                        <p className="font-bold text-stone-900 truncate text-[11px]">
                          {(item as unknown as { product?: { name?: string } }).product?.name || item.product_id}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate">
                          Asset: {asset?.alt_text || asset?.filename || item.media_id}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                        <button
                          onClick={async () => {
                            await mediaService.setPrimaryMedia(item.product_id, item.media_id);
                            fetchProductMedia();
                          }}
                          disabled={item.is_primary}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:hover:text-rose-600 cursor-pointer"
                        >
                          {item.is_primary ? '★ Primary' : 'Set Primary'}
                        </button>

                        <button
                          onClick={() => handleDeleteProductMedia(item.product_id, item.media_id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Unlink from product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PLACEMENT CREATION MODAL */}
      {/* ========================================================================= */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">Assign Media Placement</h3>
              <button
                onClick={() => setShowPlacementModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlacement} className="space-y-4">
              {/* Media Asset Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Selected Media Asset
                </label>
                <select
                  value={modalMediaId}
                  onChange={(e) => setModalMediaId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                  required
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.filename || a.alt_text} ({a.mime_type}) - {a.id.substring(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Placement Scope
                </label>
                <select
                  value={modalScopeType}
                  onChange={(e) => {
                    const st = e.target.value as PlacementScopeType;
                    setModalScopeType(st);
                    if (st === 'funnel_hero' && !modalScopeId) {
                      setModalScopeId('sports');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                >
                  <option value="homepage_hero">Homepage Hero Slider</option>
                  <option value="homepage_carousel">Homepage Carousel</option>
                  <option value="product_menu">Product Menu Feature</option>
                  <option value="funnel_hero">Sales Funnel Hero</option>
                  <option value="funnel_card">Sales Funnel Section Card</option>
                  <option value="campaign">Marketing Campaign</option>
                  <option value="sales_journey">Sales Journey</option>
                </select>
              </div>

              {/* Scope Identifier (Funnels) */}
              {(modalScopeType === 'funnel_hero' || modalScopeType === 'funnel_card') && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Select Sales Funnel / Territory
                  </label>
                  <select
                    value={modalScopeId}
                    onChange={(e) => setModalScopeId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                    required
                  >
                    {FUNNEL_SLUGS.map((f) => (
                      <option key={f.slug} value={f.slug}>
                        {f.label} ({f.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope Identifier (Campaign / Sales Journey) */}
              {(modalScopeType === 'campaign' || modalScopeType === 'sales_journey') && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Target {modalScopeType === 'campaign' ? 'Campaign ID (UUID)' : 'Sales Journey ID (UUID)'}
                  </label>
                  <input
                    type="text"
                    value={modalScopeId}
                    onChange={(e) => setModalScopeId(e.target.value)}
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500 font-mono"
                    required
                  />
                </div>
              )}

              {/* Placement Key */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Unique Placement Key
                </label>
                <input
                  type="text"
                  value={modalPlacementKey}
                  onChange={(e) => setModalPlacementKey(e.target.value)}
                  placeholder="e.g. hero_slide_1, menu_banner, sports_hero"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                  required
                />
              </div>

              {/* Alt Text Override */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Alt Text Override (Optional)
                </label>
                <input
                  type="text"
                  value={modalAltOverride}
                  onChange={(e) => setModalAltOverride(e.target.value)}
                  placeholder="Defaults to media asset alt text if blank"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={modalSortOrder}
                  onChange={(e) => setModalSortOrder(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                />
              </div>

              {placementError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{placementError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPlacementModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT LINK MODAL */}
      {/* ========================================================================= */}
      {showProductLinkModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">Link Asset to Product</h3>
              <button
                onClick={() => setShowProductLinkModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Product
                </label>
                <select
                  value={linkProductId}
                  onChange={(e) => setLinkProductId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Selected Media Asset
                </label>
                <select
                  value={linkMediaId}
                  onChange={(e) => setLinkMediaId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                  required
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.filename || a.alt_text} ({a.mime_type})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 pt-1">
                <input
                  type="checkbox"
                  checked={linkIsPrimary}
                  onChange={(e) => setLinkIsPrimary(e.target.checked)}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Set as Primary Product Image (Publication Prerequisite)</span>
              </label>

              {linkError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductLinkModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Link to Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
