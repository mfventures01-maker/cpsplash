import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { mediaService } from '../../services/mediaService';
import { claimsService } from '../../services/claimsService';
import { Product, ProductStatus, ClaimType, ProductClaim, ProductMediaRelation, ProductCategory } from '../../types/database.types';
import { getProductPrice, getProductVolume } from '../../services/productHelpers';
import { ArrowLeft, Save, Upload, Trash2, Star, Plus, ShieldCheck, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

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

  // Media & Claims lists
  const [mediaList, setMediaList] = useState<ProductMediaRelation[]>([]);
  const [claimsList, setClaimsList] = useState<ProductClaim[]>([]);

  // Media upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaAltText, setMediaAltText] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadMedia = async () => {
    if (!productId) {
      alert('Please save the product first before attaching media.');
      return;
    }
    if (!selectedFile) {
      alert('Please select an image file to upload.');
      return;
    }

    setUploadingMedia(true);
    const isPrimary = !mediaList || mediaList.length === 0;
    const res = await mediaService.uploadMedia(
      productId,
      selectedFile,
      'image',
      mediaAltText || name,
      isPrimary
    );

    if (res.data) {
      setMediaList(prev => [...prev, res.data!]);
      setSelectedFile(null);
      setMediaAltText('');
    } else {
      alert(res.error || 'Failed to upload media');
    }
    setUploadingMedia(false);
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

      {/* 4. Media Management (Deterministic Upload Engine) */}
      {isEditing && productId && (
        <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                4. Supabase Storage & Media Assets
              </h3>
              <p className="text-xs text-stone-500">
                Uploaded to <code>cp-public</code> bucket, registered in <code>media_assets</code>, and linked via <code>product_media</code>.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {mediaList?.length || 0} assets attached
            </span>
          </div>

          {/* Current Media Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {mediaList?.map((rel) => {
              const asset = rel.media_assets || rel.asset;
              const imgUrl = mediaService.getMediaAssetUrl(asset);

              return (
                <div key={rel.media_id} className="group relative rounded-2xl overflow-hidden border border-stone-200 aspect-square bg-stone-100">
                  <img src={imgUrl} alt={asset?.alt_text || 'Product Media'} className="w-full h-full object-cover" />

                  {rel.is_primary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase shadow-xs">
                      Primary
                    </span>
                  )}

                  <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    {!rel.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryMedia(rel.media_id)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-stone-900 text-xs transition-colors cursor-pointer"
                        title="Set as Hero Media"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(rel.media_id)}
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs transition-colors cursor-pointer"
                      title="Delete Media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload File Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
            <h4 className="font-bold text-stone-800">Upload New Media Asset to Supabase Storage</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Select File (Image / WebP / JPEG / PNG)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Alt Description / SEO</label>
                <input
                  type="text"
                  placeholder="e.g. CP Splash Zobo bottle chilled"
                  value={mediaAltText}
                  onChange={(e) => setMediaAltText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUploadMedia}
                disabled={uploadingMedia || !selectedFile}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingMedia ? 'Uploading to Storage...' : 'Upload & Attach to Product'}</span>
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
