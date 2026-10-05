import React, { useEffect, useState } from 'react';
import { useProduct, useProducts } from '../hooks/useProducts';
import { ProductGallery } from '../components/product/ProductGallery';
import { VerifiedClaimsBadge } from '../components/product/VerifiedClaimsBadge';
import { ProductCard } from '../components/product/ProductCard';
import { Product, SocialContent, BlogPost } from '../types/database.types';
import { socialService } from '../services/socialService';
import { blogService } from '../services/blogService';
import { analyticsService } from '../services/analyticsService';
import { getProductPrice, getProductVolume } from '../services/productHelpers';
import { MessageCircle, ShieldCheck, ArrowLeft, Share2, MapPin, CheckCircle } from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function ProductDetailPage({ slug, onNavigate, onOpenOrderModal }: ProductDetailPageProps) {
  const { product, loading, error } = useProduct(slug);
  const { products: allProducts } = useProducts();
  const [socialItems, setSocialItems] = useState<SocialContent[]>([]);
  const [relatedBlog, setRelatedBlog] = useState<BlogPost[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (product) {
      analyticsService.trackEvent('product_view', {
        productId: product.id,
        landingPage: `/products/${slug}`,
        metadata: { slug, name: product.name }
      });

      // Fetch related social proof
      socialService.getPublishedContent().then(items => {
        setSocialItems(items.slice(0, 3));
      });

      // Fetch related blog post
      blogService.getPublishedPosts().then(posts => {
        setRelatedBlog(posts.slice(0, 2));
      });
    }
  }, [product, slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-stone-100 animate-pulse" />
          <div className="space-y-6">
            <div className="h-8 bg-stone-100 rounded-lg w-3/4 animate-pulse" />
            <div className="h-6 bg-stone-100 rounded-lg w-1/3 animate-pulse" />
            <div className="h-32 bg-stone-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Product Not Found</h2>
        <p className="text-sm text-stone-500">
          The requested product slug <code>"{slug}"</code> does not exist or has not been published in Supabase.
        </p>
        <button
          onClick={() => onNavigate('/products')}
          className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const price = getProductPrice(product);
  const volumeInfo = getProductVolume(product);
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 2);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.short_description || `Check out ${product.name} on CP Splash!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="space-y-16 py-8 pb-20">
      {/* Breadcrumb / Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('/products')}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Products</span>
        </button>
      </div>

      {/* Main Product Hero & Conversion Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-6">
            <ProductGallery
              media={product.media || []}
              productName={product.name}
              productId={product.id}
            />
          </div>

          {/* Right Column: Information, Pricing, Claims & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header tags */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
                  {volumeInfo.volume}{volumeInfo.unit} Cold Bottle
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  In Stock
                </span>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-full border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {copiedLink && (
              <div className="p-2 text-xs bg-emerald-50 text-emerald-800 rounded-lg text-center font-medium">
                Product link copied to clipboard!
              </div>
            )}

            {/* Title & Short Description */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-base text-stone-600 leading-relaxed font-medium">
                {product.short_description}
              </p>
            </div>

            {/* Authoritative Price Engine Card */}
            <div className="p-5 rounded-3xl bg-stone-900 text-white space-y-3 shadow-lg">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-mono text-stone-400 block uppercase tracking-wider">
                    Authoritative Price (Supabase)
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black">
                      ₦{price.amount.toLocaleString()}
                    </span>
                    {price.compare_at_amount && (
                      <span className="text-sm text-stone-400 line-through">
                        ₦{price.compare_at_amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 block font-bold">
                    ✓ Verified Batch
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Sapele Bottling Plant
                  </span>
                </div>
              </div>

              {/* Instant WhatsApp Order CTA Button */}
              <button
                onClick={() => onOpenOrderModal(product)}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-stone-950 font-black text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-stone-950" />
                <span>Order on WhatsApp (08127700724)</span>
              </button>

              <p className="text-[11px] text-center text-stone-400">
                Direct to Sapele Hub: Opposite Ajimele Junction, Ajogodo, Delta State.
              </p>
            </div>

            {/* HOEOS Verified Health Claims Engine */}
            <VerifiedClaimsBadge claims={product.claims || []} />

            {/* Deep Botanical / Product Story */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                About The Blend & Formulation
              </h3>
              <div className="text-sm text-stone-700 leading-relaxed space-y-2 whitespace-pre-line bg-white p-5 rounded-3xl border border-stone-200">
                {product.description || 'Natural Nigerian botanical blend handcrafted in Sapele, Delta State.'}
              </div>
            </div>

            {/* Delivery & Flagship Assurance */}
            <div className="grid grid-cols-2 gap-3 text-xs text-stone-600 pt-2">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Local Pickup in Sapele or Fast Doorstep Courier</span>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cold-Chain Sealed for Maximum Freshness</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof for this Product */}
      {socialItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-stone-200">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900">
              Community Reactions & UGC
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {socialItems.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                  <p className="text-xs text-stone-700 font-medium">"{item.caption}"</p>
                  <span className="text-[10px] text-stone-400 block">{item.platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedBlog.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-stone-200">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-900">
              Related Botanical Science
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedBlog.map(post => (
                <div 
                  key={post.id}
                  onClick={() => onNavigate(`/blog/${post.slug}`)}
                  className="p-5 rounded-2xl bg-white border border-stone-200 hover:shadow-md transition-shadow cursor-pointer space-y-2"
                >
                  <h4 className="font-bold text-stone-900 hover:text-rose-600 transition-colors text-base">
                    {post.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2">{post.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 border-t border-stone-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-stone-900">You Might Also Love</h3>
            <button
              onClick={() => onNavigate('/products')}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
            >
              View Full Range
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onOpenOrderModal={onOpenOrderModal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
