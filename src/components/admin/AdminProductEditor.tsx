import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { mediaService } from '../../services/mediaService';
import { claimsService } from '../../services/claimsService';
import { Product, ProductStatus, AvailabilityStatus, MediaType, ProductClaim } from '../../types/database.types';
import { ArrowLeft, Save, Upload, Trash2, Star, Plus, ShieldCheck, Sparkles, Image as ImageIcon, Video, CheckCircle2 } from 'lucide-react';

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
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [featured, setFeatured] = useState(false);
  const [basePrice, setBasePrice] = useState<number>(1200);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('in_stock');
  const [volumeMl, setVolumeMl] = useState<number>(500);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('2348127700724');

  // Media & Claims lists
  const [mediaList, setMediaList] = useState<Product['media']>([]);
  const [claimsList, setClaimsList] = useState<ProductClaim[]>([]);

  // New Media state
  const [uploadUrl, setUploadUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('product_image');
  const [altText, setAltText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // New Claim state
  const [newClaimText, setNewClaimText] = useState('');
  const [newClaimSource, setNewClaimSource] = useState('');
  const [newClaimBadge, setNewClaimBadge] = useState('leaf');
  const [addingClaim, setAddingClaim] = useState(false);

  useEffect(() => {
    if (productId) {
      productsService.getProductById(productId).then(({ data, error: err }) => {
        if (err || !data) {
          setError(err || 'Failed to load product');
        } else {
          setName(data.name);
          setSlug(data.slug);
          setSku(data.sku || '');
          setShortDescription(data.short_description || '');
          setDescription(data.description || '');
          setStatus(data.status);
          setFeatured(data.featured);
          setBasePrice(data.base_price);
          setSalePrice(data.sale_price || '');
          setAvailabilityStatus(data.availability_status);
          setVolumeMl(data.volume_ml);
          setSeoTitle(data.seo_title || '');
          setSeoDescription(data.seo_description || '');
          setWhatsappNumber(data.whatsapp_order_number || '2348127700724');
          setMediaList(data.media || []);
          setClaimsList(data.claims || []);
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

    const payload: Partial<Product> = {
      name,
      slug,
      sku,
      short_description: shortDescription,
      description,
      status,
      featured,
      base_price: Number(basePrice),
      sale_price: salePrice === '' ? null : Number(salePrice),
      availability_status: availabilityStatus,
      volume_ml: Number(volumeMl),
      seo_title: seoTitle || name,
      seo_description: seoDescription || shortDescription,
      whatsapp_order_number: whatsappNumber,
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

  const handleUploadMedia = async () => {
    if (!productId) {
      alert('Please save the product first before attaching media.');
      return;
    }
    if (!uploadUrl) return;

    setUploadingMedia(true);
    const res = await mediaService.uploadMedia(productId, uploadUrl, mediaType, altText, mediaList?.length === 0);
    if (res.data) {
      setMediaList(prev => [...(prev || []), res.data!]);
      setUploadUrl('');
      setAltText('');
    } else {
      alert(res.error || 'Failed to add media');
    }
    setUploadingMedia(false);
  };

  const handleSetPrimaryMedia = async (mediaId: string) => {
    if (!productId) return;
    await mediaService.setPrimaryMedia(productId, mediaId);
    setMediaList(prev => prev?.map(m => ({ ...m, is_primary: m.id === mediaId })));
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Remove this media asset?')) return;
    await mediaService.deleteMedia(mediaId);
    setMediaList(prev => prev?.filter(m => m.id !== mediaId));
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
    const res = await claimsService.addClaim(productId, newClaimText, newClaimSource, newClaimBadge, 'verified');
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
              <label className="font-bold text-stone-700 block mb-1">URL Slug (Supabase Key) *</label>
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
              <label className="font-bold text-stone-700 block mb-1">Volume (mL)</label>
              <input
                type="number"
                value={volumeMl}
                onChange={(e) => setVolumeMl(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 font-mono"
              />
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

        {/* 2. Price Engine */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            2. Price Engine (Supabase Authoritative Pricing)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Base Price (₦ NGN) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Sale Price (Optional ₦)</label>
              <input
                type="number"
                placeholder="Leave blank if no discount"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold focus:ring-2 focus:ring-rose-500 text-rose-700"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Availability</label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="pre_order">Pre-Order</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Publication & Conversion Channels */}
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            3. Visibility & WhatsApp Conversion Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Status</label>
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

            <div>
              <label className="font-bold text-stone-700 block mb-1">WhatsApp Order Line</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="2348127700724"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="featuredCheck"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded"
              />
              <label htmlFor="featuredCheck" className="font-bold text-stone-700 cursor-pointer">
                Feature on Hero Banner
              </label>
            </div>
          </div>
        </div>

        {/* Submit Form Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs"
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

      {/* 4. Media Management (Only available when product exists) */}
      {isEditing && productId && (
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                4. Supabase Storage Media Engine
              </h3>
              <p className="text-xs text-stone-500">
                Manage hero image, gallery assets, and short product videos.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {mediaList?.length || 0} assets attached
            </span>
          </div>

          {/* Current Media Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mediaList?.map((media) => (
              <div key={media.id} className="group relative rounded-2xl overflow-hidden border border-stone-200 aspect-square bg-stone-100">
                <img src={media.url} alt={media.alt_text || 'Product Media'} className="w-full h-full object-cover" />
                
                {media.is_primary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase shadow-xs">
                    Hero Media
                  </span>
                )}

                <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {!media.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryMedia(media.id)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-stone-900 text-xs transition-colors"
                      title="Set as Hero Media"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(media.id)}
                    className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors"
                    title="Delete Media"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Media Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
            <h4 className="font-bold text-stone-800">Add New Media Asset</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Paste Image URL or Storage Link..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as MediaType)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                >
                  <option value="hero_image">Hero Image</option>
                  <option value="product_image">Product Image</option>
                  <option value="lifestyle_image">Lifestyle Image</option>
                  <option value="short_video">Short Video Clip</option>
                  <option value="gallery_image">Gallery Image</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <input
                type="text"
                placeholder="Alt description for SEO..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-1/2 px-3 py-2 rounded-xl border border-stone-300 text-xs"
              />

              <button
                type="button"
                onClick={handleUploadMedia}
                disabled={uploadingMedia || !uploadUrl}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {uploadingMedia ? 'Uploading...' : 'Link to Product'}
              </button>
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
                5. HOEOS Health Claims Engine
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
                      {claim.status}
                    </span>
                  </div>
                  <span className="text-stone-500 text-[11px] block mt-0.5">
                    Source: {claim.source}
                  </span>
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
                value={newClaimBadge}
                onChange={(e) => setNewClaimBadge(e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs"
              >
                <option value="leaf">Leaf (Natural)</option>
                <option value="shield">Shield (Antioxidant / Purity)</option>
                <option value="heart">Heart (Botanical)</option>
                <option value="zap">Zap (Energy / Vitamin C)</option>
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
