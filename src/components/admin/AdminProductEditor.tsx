import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { mediaService } from '../../services/mediaService';
import { claimsService } from '../../services/claimsService';
import {
  Product,
  ProductStatus,
  ClaimType,
  ProductClaim,
  ProductMediaRelation,
  ProductCategory,
  MediaSequenceRole,
  ProductMediaSequenceItem,
  ProductAnimationConfig
} from '../../types/database.types';
import {
  getProductPrice,
  getProductVolume,
  SEQUENCE_ROLES_META,
  DEFAULT_ANIMATION_CONFIG,
  getProductMediaSequence,
  getProductAnimationConfig
} from '../../services/productHelpers';
import {
  ArrowLeft,
  Save,
  Upload,
  Trash2,
  Star,
  Plus,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play,
  Film,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';

export interface StagedMediaFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  formatCategory: 'image' | 'video' | 'animation';
  previewUrl: string;
  isValid: boolean;
  error?: string;
  progress: number;
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const validateMediaFile = (file: File): { isValid: boolean; formatCategory: 'image' | 'video' | 'animation'; error?: string } => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type.toLowerCase();

  const isVideo = type.startsWith('video/') || ['mp4', 'webm'].includes(ext);
  const isGif = type === 'image/gif' || ext === 'gif';
  const isWebp = type === 'image/webp' || ext === 'webp';
  const isStaticImage = ['image/jpeg', 'image/png'].includes(type) || ['jpg', 'jpeg', 'png'].includes(ext);

  if (!isVideo && !isGif && !isWebp && !isStaticImage) {
    return {
      isValid: false,
      formatCategory: 'image',
      error: `Unsupported format (${file.type || ext}). Allowed: JPEG, PNG, WebP, GIF, MP4, WebM.`
    };
  }

  if (isVideo) {
    const maxVideoBytes = 30 * 1024 * 1024; // 30MB
    if (file.size > maxVideoBytes) {
      return {
        isValid: false,
        formatCategory: 'video',
        error: `Video exceeds 30 MB limit (${formatBytes(file.size)}). Transcode to 1-3 MB for optimal web performance.`
      };
    }
    return { isValid: true, formatCategory: 'video' };
  }

  const maxImageBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxImageBytes) {
    return {
      isValid: false,
      formatCategory: isGif ? 'animation' : 'image',
      error: `Image exceeds 10 MB limit (${formatBytes(file.size)}).`
    };
  }

  return {
    isValid: true,
    formatCategory: isGif ? 'animation' : 'image'
  };
};

interface AdminProductEditorProps {
  productId?: string | null;
  onBack: () => void;
  onSaved: (savedProduct: Product) => void;
}

export function AdminProductEditor({ productId, onBack, onSaved }: AdminProductEditorProps) {
  const isEditing = Boolean(productId);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('CP Fruit Splash');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [featured, setFeatured] = useState(false);
  const [basePrice, setBasePrice] = useState<number>(1200);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [volumeMl, setVolumeMl] = useState<number>(500);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Media sequence & Animation engine state
  const [mediaSequence, setMediaSequence] = useState<ProductMediaSequenceItem[]>([]);
  const [animationConfig, setAnimationConfig] = useState<ProductAnimationConfig>(DEFAULT_ANIMATION_CONFIG);
  const [rawMetadata, setRawMetadata] = useState<Record<string, unknown>>({});

  // Media & Claims lists
  const [mediaList, setMediaList] = useState<ProductMediaRelation[]>([]);
  const [claimsList, setClaimsList] = useState<ProductClaim[]>([]);

  // Media upload state & staging queue
  const [stagedFiles, setStagedFiles] = useState<StagedMediaFile[]>([]);
  const [mediaAltText, setMediaAltText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // New Claim state
  const [newClaimText, setNewClaimText] = useState('');
  const [newClaimSource, setNewClaimSource] = useState('');
  const [newClaimType, setNewClaimType] = useState<ClaimType>('health');
  const [addingClaim, setAddingClaim] = useState(false);

  useEffect(() => {
    productsService.getCategories().then(setCategories);

    if (productId) {
      productsService.getProductById(productId).then(({ data, error: err }) => {
        if (err || !data) {
          setError(err || 'Failed to load product');
        } else {
          setName(data.name);
          setSlug(data.slug);
          setSku(data.sku || '');
          setBrand(data.brand || 'CP Fruit Splash');
          setCategoryId(data.category_id || '');
          setShortDescription(data.short_description || '');
          setDescription(data.description || '');
          setStatus(data.status);
          setFeatured(data.featured);
          setSeoTitle(data.seo_title || '');
          setSeoDescription(data.seo_description || '');

          const price = getProductPrice(data);
          setBasePrice(price.amount || 1200);
          setSalePrice(price.compare_at_amount || '');

          const volume = getProductVolume(data);
          setVolumeMl(volume.volume || 500);

          setMediaList(data.media || []);
          setClaimsList(data.claims || []);

          // Load metadata, animation configuration, and media sequence
          setRawMetadata((data.metadata || {}) as Record<string, unknown>);
          setAnimationConfig(getProductAnimationConfig(data));
          setMediaSequence(getProductMediaSequence(data));
        }
        setLoading(false);
      });
    }
  }, [productId]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const mergedMetadata = {
      ...rawMetadata,
      media_sequence: mediaSequence,
      animation_config: animationConfig,
    };

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      sku: sku.trim() || undefined,
      brand: brand.trim() || undefined,
      category_id: categoryId || null,
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      status,
      featured,
      price: Number(basePrice),
      compare_at_price: salePrice === '' ? null : Number(salePrice),
      volume: Number(volumeMl),
      volume_unit: 'ml',
      seo_title: seoTitle || name,
      seo_description: seoDescription || shortDescription,
      metadata: mergedMetadata,
    };

    if (isEditing && productId) {
      const res = await productsService.updateProduct(productId, payload);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        onSaved(res.data);
      }
    } else {
      const res = await productsService.createProduct(payload);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        onSaved(res.data);
      }
    }

    setSaving(false);
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newStaged: StagedMediaFile[] = files.map(file => {
      const validation = validateMediaFile(file);
      return {
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'unknown',
        formatCategory: validation.formatCategory,
        previewUrl: URL.createObjectURL(file),
        isValid: validation.isValid,
        error: validation.error,
        progress: 0,
      };
    });
    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = '';
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleUploadAllStaged = async () => {
    if (!productId) {
      alert('Please save the product first before uploading media.');
      return;
    }
    const validFiles = stagedFiles.filter(f => f.isValid);
    if (validFiles.length === 0) {
      alert('No valid files in staging queue to upload.');
      return;
    }

    setUploadingMedia(true);
    for (let i = 0; i < validFiles.length; i++) {
      const item = validFiles[i];
      setUploadProgressText(`Uploading ${i + 1} of ${validFiles.length}: ${item.name}...`);

      const isPrimary = (!mediaList || mediaList.length === 0) && i === 0;
      const res = await mediaService.uploadMedia(
        productId,
        item.file,
        item.formatCategory,
        mediaAltText || name || item.name,
        isPrimary
      );

      if (res.data) {
        setMediaList(prev => [...prev, res.data!]);
        setStagedFiles(prev => prev.filter(f => f.id !== item.id));
        URL.revokeObjectURL(item.previewUrl);
      } else {
        alert(`Failed to upload ${item.name}: ${res.error}`);
      }
    }

    setUploadingMedia(false);
    setUploadProgressText('');
    setMediaAltText('');
  };

  const handleMoveMedia = async (index: number, direction: 'up' | 'down') => {
    if (!productId || !mediaList || mediaList.length <= 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const updated = [...mediaList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setMediaList(updated);
    const orderedIds = updated.map(m => m.media_id);
    await mediaService.reorderMedia(productId, orderedIds);
  };

  const handleSetPrimaryMedia = async (mediaId: string) => {
    if (!productId) return;
    await mediaService.setPrimaryMedia(productId, mediaId);
    setMediaList(prev => prev.map(m => ({ ...m, is_primary: m.media_id === mediaId })));
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!productId) return;
    if (!confirm('Remove this media asset?')) return;
    await mediaService.deleteMedia(productId, mediaId);
    setMediaList(prev => prev.filter(m => m.media_id !== mediaId));
  };

  const handleAddClaim = async () => {
    if (!productId) {
      alert('Please save the product first before adding claims.');
      return;
    }
    if (!newClaimText || !newClaimSource) {
      alert('Claim and Substantiating Source are required under HOEOS governance.');
      return;
    }

    setAddingClaim(true);
    const res = await claimsService.addClaim(
      productId,
      newClaimText,
      newClaimSource,
      newClaimType,
      'verified'
    );
    if (res.data) {
      setClaimsList(prev => [...prev, res.data!]);
      setNewClaimText('');
      setNewClaimSource('');
    }
    setAddingClaim(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500">Loading product editor...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product List</span>
        </button>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-stone-200 text-stone-700 font-bold">
          {isEditing ? `Editing: ${slug}` : 'New Supabase Record'}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* 1. Identity & Classification */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            1. Identity & Packaging
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. CP Fruit Splash Zobo Sweet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">URL Slug (Authoritative) *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. zobo-sweet"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. CP-FS-ZS-500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="">Uncategorized</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Short Description / Subtitle</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. Taste Nature. Feel Refreshed. Artisanal hibiscus beverage."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Detailed Product Story & Botanical Formulation</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the whole-fruit infusion, Sapele bottling process, and lack of preservatives..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 2. Physical Variant & Pricing */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            2. Sellable Unit & Authoritative Pricing (product_variants & product_prices)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Volume (mL)</label>
              <input
                type="number"
                value={volumeMl}
                onChange={(e) => setVolumeMl(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Retail Price (₦ NGN) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Promotional / Sale Price (₦ NGN)</label>
              <input
                type="number"
                placeholder="Leave blank if no discount"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold focus:ring-2 focus:ring-rose-500 text-rose-700"
              />
            </div>
          </div>
        </div>

        {/* 3. Publication State */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            3. Visibility & Storefront Placement
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="published">Published (Live in public store)</option>
                <option value="draft">Draft (Admin only)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
              />
              <label htmlFor="featuredCheck" className="font-bold text-stone-700 cursor-pointer">
                Feature on Homepage Slider
              </label>
            </div>
          </div>
        </div>

        {/* Submit Form Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-950/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Supabase...' : isEditing ? 'Save Product Changes' : 'Create Product in Supabase'}</span>
          </button>
        </div>
      </form>

      {/* 4. Product Images & Animations (Comprehensive Supabase Media Workspace) */}
      {isEditing && productId && (
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  4. Product Images & Animations
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  cp-public Storage
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Authoritative pipeline for static bottles, animated WebP/GIF sequences, and MP4/WebM video loops.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
              <span className="px-2 py-1 rounded-md bg-stone-100 border border-stone-200">
                {mediaList?.length || 0} assets attached
              </span>
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                ≤30MB Video • ≤10MB Images
              </span>
            </div>
          </div>

          {/* Staged Upload Queue Box */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-rose-600" />
                  <span>Staged Media Upload Queue</span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  Select one or multiple files. Formats validated: JPEG, PNG, WebP, GIF, MP4, WebM.
                </p>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                {stagedFiles.length} file(s) staged
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-stone-700 block mb-1">
                  Select Files from Computer (Multi-Select Supported)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleSelectFiles}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Default Alt Text / SEO Tag
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${name || 'Product'} bottle view`}
                  value={mediaAltText}
                  onChange={(e) => setMediaAltText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
            </div>

            {/* Staged Queue Preview Grid */}
            {stagedFiles.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>Pending Uploads ({stagedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                      setStagedFiles([]);
                    }}
                    className="text-stone-400 hover:text-stone-700 cursor-pointer font-normal"
                  >
                    Clear queue
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stagedFiles.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border bg-white flex items-start gap-3 relative ${
                        item.isValid ? 'border-stone-200' : 'border-rose-300 bg-rose-50/30'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200 relative flex items-center justify-center">
                        {item.formatCategory === 'video' ? (
                          <video
                            src={item.previewUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-[8px] font-mono font-bold text-white text-center py-0.5 uppercase">
                          {item.formatCategory}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 pr-5 space-y-1">
                        <p className="font-semibold text-stone-900 text-xs truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                          <span>{formatBytes(item.size)}</span>
                          <span>•</span>
                          <span className="uppercase">{item.type.split('/')[1] || item.type}</span>
                        </div>
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready to upload
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-medium leading-tight">
                            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> {item.error}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStagedFile(item.id)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-stone-600 font-medium">
                    {uploadProgressText && (
                      <span className="text-rose-700 font-semibold animate-pulse">
                        {uploadProgressText}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadAllStaged}
                    disabled={uploadingMedia || stagedFiles.filter(f => f.isValid).length === 0}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingMedia
                        ? 'Uploading to Supabase Storage...'
                        : `Upload Staged Files (${stagedFiles.filter(f => f.isValid).length})`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current Attached Media Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Current Media Gallery (Storefront Order)
              </h4>
              <span className="text-[11px] text-stone-400">
                Use arrows to adjust display order • Star sets hero media
              </span>
            </div>

            {(!mediaList || mediaList.length === 0) ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-stone-200 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">
                  No media assets uploaded yet for this product.
                </p>
                <p className="text-[11px] text-stone-400">
                  Select and upload images or animation loops in the staging queue above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaList.map((rel, index) => {
                  const asset = rel.media_assets || rel.asset;
                  const imgUrl = mediaService.getMediaAssetUrl(asset);
                  const isVid = Boolean(
                    asset?.media_type?.includes('video') ||
                    asset?.mime_type?.startsWith('video/') ||
                    asset?.filename?.endsWith('.mp4') ||
                    asset?.filename?.endsWith('.webm') ||
                    imgUrl.endsWith('.mp4') ||
                    imgUrl.endsWith('.webm')
                  );
                  const isGif = asset?.mime_type === 'image/gif' || asset?.filename?.endsWith('.gif');

                  return (
                    <div
                      key={rel.media_id}
                      className="group relative rounded-2xl overflow-hidden border border-stone-200 aspect-square bg-stone-950 flex flex-col justify-between"
                    >
                      {/* Media Render */}
                      {isVid ? (
                        <video
                          src={imgUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          autoPlay={false}
                          controls
                        />
                      ) : (
                        <img
                          src={imgUrl}
                          alt={asset?.alt_text || 'Product Media'}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold">
                          #{index + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {isVid && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase shadow-xs flex items-center gap-0.5">
                              <Film className="w-2.5 h-2.5" /> Video
                            </span>
                          )}
                          {isGif && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-bold uppercase shadow-xs">
                              GIF
                            </span>
                          )}
                          {rel.is_primary && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase shadow-xs">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>

                      {/* File Details footer */}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-stone-950/90 to-transparent pointer-events-none z-10">
                        <p className="text-[10px] text-white font-mono truncate">
                          {asset?.filename || 'asset'}
                        </p>
                        {asset?.size_bytes ? (
                          <p className="text-[9px] text-stone-400 font-mono">
                            {formatBytes(asset.size_bytes)}
                          </p>
                        ) : null}
                      </div>

                      {/* Hover Action Overlay */}
                      <div className="absolute inset-0 bg-stone-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 z-20">
                        {/* Move Earlier */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveMedia(index, 'up')}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-stone-900 text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Earlier in Gallery"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Set Primary */}
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryMedia(rel.media_id)}
                          className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            rel.is_primary
                              ? 'bg-rose-600 text-white'
                              : 'bg-white/20 hover:bg-white text-white hover:text-stone-900'
                          }`}
                          title={rel.is_primary ? 'Currently Primary Hero Media' : 'Set as Primary Hero Media'}
                        >
                          <Star className={`w-4 h-4 ${rel.is_primary ? 'fill-white' : ''}`} />
                        </button>

                        {/* Move Later */}
                        <button
                          type="button"
                          disabled={index === mediaList.length - 1}
                          onClick={() => handleMoveMedia(index, 'down')}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white text-white hover:text-stone-900 text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Later in Gallery"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Delete Asset */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(rel.media_id)}
                          className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors cursor-pointer"
                          title="Delete Media Asset"
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

          {/* Authoritative Six-Part Animation Sequence Engine */}
          <div className="p-5 rounded-2xl bg-stone-900 text-white space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-[10px] uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>HOEOS Section 3.3 Product Animation Sequence Engine</span>
                </div>
                <h4 className="text-sm font-black text-white mt-0.5">
                  Six-Part Semantic Sequence Assignment
                </h4>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                Authoritative JSONB in products.metadata
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SEQUENCE_ROLES_META.map(meta => {
                const assignedItem = mediaSequence.find(s => s.role === meta.role);
                const assignedMediaId = assignedItem?.media_id || '';
                const assignedRel = mediaList.find(m => m.media_id === assignedMediaId);
                const assignedAsset = assignedRel?.media_assets || assignedRel?.asset;
                const thumb = assignedAsset ? mediaService.getMediaAssetUrl(assignedAsset) : null;
                const isAssignedVid = Boolean(
                  assignedAsset?.media_type?.includes('video') ||
                  assignedAsset?.mime_type?.startsWith('video/')
                );

                return (
                  <div key={meta.role} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-stone-800 overflow-hidden shrink-0 flex items-center justify-center border border-stone-700 relative">
                      {thumb ? (
                        isAssignedVid ? (
                          <video src={thumb} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={thumb} alt={meta.label} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <span className="text-stone-500 font-mono text-[10px]">0{meta.position}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">0{meta.position}. {meta.label.replace(/^0\d\s*/, '')}</span>
                      </div>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{meta.description}</p>
                      <select
                        value={assignedMediaId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMediaSequence(prev => {
                            const filtered = prev.filter(s => s.role !== meta.role);
                            if (val) {
                              filtered.push({
                                position: meta.position,
                                role: meta.role,
                                media_id: val,
                                custom_label: meta.label,
                                enabled: true,
                              });
                            }
                            return filtered.sort((a, b) => a.position - b.position);
                          });
                          if (meta.role === 'hero_bottle' && val) {
                            handleSetPrimaryMedia(val);
                          }
                        }}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-[11px] text-stone-200 focus:ring-1 focus:ring-rose-500"
                      >
                        <option value="">-- No Asset Assigned --</option>
                        {mediaList.map(m => {
                          const a = m.media_assets || m.asset;
                          return (
                            <option key={m.media_id} value={m.media_id}>
                              {a?.alt_text || a?.filename || `Media ${m.media_id.slice(0, 8)}`} {m.is_primary ? '(Primary)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Animation Playback Settings */}
            <div className="pt-3 border-t border-stone-800">
              <div className="flex items-center gap-2 text-stone-300 font-bold text-xs mb-3">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>Sequence Animation Playback Controls</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Step Duration (Sec)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={0.5}
                    value={animationConfig.duration_seconds || 4.5}
                    onChange={(e) => setAnimationConfig(prev => ({ ...prev, duration_seconds: Number(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">Aspect Ratio</label>
                  <select
                    value={animationConfig.aspect_ratio || 'square'}
                    onChange={(e) => setAnimationConfig(prev => ({ ...prev, aspect_ratio: e.target.value as 'square' | 'portrait' | 'landscape' }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-white text-xs"
                  >
                    <option value="square">1:1 Square</option>
                    <option value="portrait">4:5 Portrait</option>
                    <option value="landscape">16:9 Landscape</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="autoplayConfig"
                    checked={animationConfig.autoplay !== false}
                    onChange={(e) => setAnimationConfig(prev => ({ ...prev, autoplay: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 rounded bg-stone-950 border-stone-700 cursor-pointer"
                  />
                  <label htmlFor="autoplayConfig" className="text-xs text-stone-300 cursor-pointer">
                    Autoplay
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="loopConfig"
                    checked={animationConfig.loop !== false}
                    onChange={(e) => setAnimationConfig(prev => ({ ...prev, loop: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 rounded bg-stone-950 border-stone-700 cursor-pointer"
                  />
                  <label htmlFor="loopConfig" className="text-xs text-stone-300 cursor-pointer">
                    Loop Playback
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Health Claims Management */}
      {isEditing && productId && (
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                5. Product Claims Engine (product_claims)
              </h3>
              <p className="text-xs text-stone-500">
                Only verified claims with documented lab sources are published.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-bold">
              HOEOS Rule 14 Active
            </span>
          </div>

          <div className="space-y-2">
            {claimsList?.map((claim) => (
              <div key={claim.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{claim.claim}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {claim.verification_status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-mono">
                      {claim.claim_type}
                    </span>
                  </div>
                  {claim.evidence_source && (
                    <span className="text-stone-500 text-[11px] block mt-0.5">
                      Source: {claim.evidence_source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Claim Form */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 text-xs">
            <h4 className="font-bold text-emerald-950">Add Substantive Product Claim</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="e.g. 100% Fresh & Natural"
                value={newClaimText}
                onChange={(e) => setNewClaimText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white"
              />
              <input
                type="text"
                placeholder="Substantiating Source (e.g. Lab Batch Verification)"
                value={newClaimSource}
                onChange={(e) => setNewClaimSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white"
              />
            </div>

            <div className="flex justify-between items-center">
              <select
                value={newClaimType}
                onChange={(e) => setNewClaimType(e.target.value as ClaimType)}
                className="px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs"
              >
                <option value="health">Health Claim</option>
                <option value="benefit">Functional Benefit</option>
                <option value="marketing">Marketing Claim</option>
              </select>

              <button
                type="button"
                onClick={handleAddClaim}
                disabled={addingClaim || !newClaimText || !newClaimSource}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {addingClaim ? 'Adding...' : 'Attach Verified Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
