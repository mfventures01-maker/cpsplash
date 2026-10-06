import React, { useEffect, useState } from 'react';
import { blogService } from '../services/blogService';
import { mediaService } from '../services/mediaService';
import { productsService } from '../services/productsService';
import { BlogPost, Product } from '../types/database.types';
import { analyticsService } from '../services/analyticsService';
import { getProductPrice } from '../services/productHelpers';
import { ArrowLeft, ArrowRight, MessageCircle, Calendar, Sparkles } from 'lucide-react';

interface BlogIndexProps {
  onNavigate: (path: string) => void;
}

export function BlogIndexPage({ onNavigate }: BlogIndexProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.trackEvent('page_view', { landingPage: '/blog' });
    blogService.getPublishedPosts().then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>The Fresh Knowledge Hub</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Fruit Science, Botanical Stories & Wellness
        </h1>
        <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
          Explore the artisanal cold-crafting process, superfruit profiles, and botanical heritage behind CP Fruit Splash.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="h-80 rounded-3xl bg-stone-100 animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-sm">
          No published articles available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map(post => {
            const mediaUrl = typeof post.featured_media === 'string'
              ? post.featured_media
              : post.featured_media?.path
                ? mediaService.getPublicUrl(post.featured_media.path)
                : null;
            return (
              <div
                key={post.id}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {mediaUrl && (
                  <div className="aspect-16/9 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={mediaUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-rose-700 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-rose-600">
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}

interface BlogPostPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function BlogPostPage({ slug, onNavigate, onOpenOrderModal }: BlogPostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedProduct, setRelatedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService.getPostBySlug(slug).then((p) => {
      setPost(p);
      if (p) {
        document.title = p.seo_title || `${p.title} | CP Fruit Splash Knowledge Hub`;
        analyticsService.trackEvent('page_view', {
          landingPage: `/blog/${slug}`,
          content: p.title,
        });
      } else {
        document.title = 'Article Not Found | CP Fruit Splash';
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="h-64 rounded-3xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">Article Not Found</h2>
        <p className="text-stone-500 text-sm">The requested blog post does not exist.</p>
        <button
          onClick={() => onNavigate('/blog')}
          className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold"
        >
          Return to Blog
        </button>
      </div>
    );
  }

  // AEO/SEO Structured Article Data
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.seo_title || post.title,
    'description': post.seo_description || post.excerpt,
    'datePublished': post.published_at || post.created_at,
    'dateModified': post.updated_at || post.created_at,
    'author': {
      '@type': 'Organization',
      'name': 'CP Fruit Splash'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'CP Fruit Splash',
      'url': 'https://cp-splash-nine.vercel.app'
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />

      <button
        onClick={() => onNavigate('/blog')}
        className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 text-xs font-bold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Articles</span>
      </button>

      <div className="space-y-4">
        <span className="text-xs font-mono text-stone-400">
          Published: {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Live'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-base text-stone-600 leading-relaxed font-serif italic border-l-4 border-rose-500 pl-4">
            {post.excerpt}
          </p>
        )}
      </div>

      {(() => {
        const mediaUrl = typeof post.featured_media === 'string'
          ? post.featured_media
          : post.featured_media?.path
            ? mediaService.getPublicUrl(post.featured_media.path)
            : null;
        return mediaUrl ? (
          <div className="rounded-3xl overflow-hidden aspect-16/9 bg-stone-100 shadow-md">
            <img src={mediaUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        ) : null;
      })()}

      {/* Main Post Body (AEO Direct Answer Paragraphs) */}
      <div className="prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line py-4">
        {post.content}
      </div>

      {/* DETERMINISTIC COMMERCIAL DESTINATION BANNER (AEO Internal Linking) */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white space-y-6 shadow-xl border border-stone-800">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 block">
            Commercial Supply & Bulk Distribution
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            Planning Beverages for Your Team, Event, or School?
          </h3>
          <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Get cold-chain delivery directly from our Sapele hub with tiered wholesale rates, official purchase invoicing, and dedicated WhatsApp dispatch.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => onNavigate('/sports')}
            className="p-3 rounded-xl bg-white/10 hover:bg-rose-600 text-white text-xs font-bold text-left transition-colors cursor-pointer"
          >
            Sports & Gyms →
          </button>
          <button
            onClick={() => onNavigate('/events')}
            className="p-3 rounded-xl bg-white/10 hover:bg-amber-600 text-white text-xs font-bold text-left transition-colors cursor-pointer"
          >
            Parties & Events →
          </button>
          <button
            onClick={() => onNavigate('/hotels')}
            className="p-3 rounded-xl bg-white/10 hover:bg-purple-600 text-white text-xs font-bold text-left transition-colors cursor-pointer"
          >
            Hotels & Lounges →
          </button>
          <button
            onClick={() => onNavigate('/schools')}
            className="p-3 rounded-xl bg-white/10 hover:bg-emerald-600 text-white text-xs font-bold text-left transition-colors cursor-pointer"
          >
            Schools & Admin →
          </button>
        </div>
      </div>

      {/* BLOG -> PRODUCT -> WHATSAPP Conversion Box */}
      {relatedProduct && (
        <div className="p-6 sm:p-8 rounded-3xl bg-stone-900 text-white space-y-4 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
            Featured In This Story
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black">{relatedProduct.name}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{relatedProduct.short_description}</p>
              <div className="mt-2 text-xl font-black text-white">
                ₦{getProductPrice(relatedProduct).amount.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => onOpenOrderModal(relatedProduct)}
              className="py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950" />
              <span>Order on WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
