import React, { useEffect, useState } from 'react';
import { blogService } from '../services/blogService';
import { productsService } from '../services/productsService';
import { BlogPost, Product } from '../types/database.types';
import { analyticsService } from '../services/analyticsService';
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
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => onNavigate(`/blog/${post.slug}`)}
              className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              {post.featured_media && (
                <div className="aspect-16/9 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={post.featured_media}
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
          ))}
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
    blogService.getPostBySlug(slug).then(async (p) => {
      setPost(p);
      if (p) {
        analyticsService.trackEvent('blog_view', {
          landingPage: `/blog/${slug}`,
          content: p.title,
        });

        if (p.related_product_id) {
          const { data: prod } = await productsService.getProductById(p.related_product_id);
          setRelatedProduct(prod);
        }
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
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

      {post.featured_media && (
        <div className="rounded-3xl overflow-hidden aspect-16/9 bg-stone-100 shadow-md">
          <img src={post.featured_media} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main Post Body */}
      <div className="prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line py-4">
        {post.content}
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
                ₦{((relatedProduct.sale_price || relatedProduct.base_price) as number).toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => onOpenOrderModal(relatedProduct)}
              className="py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950" />
              <span>{post.cta_text || 'Order on WhatsApp'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
