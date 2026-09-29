import React, { useEffect, useState } from 'react';
import { blogService } from '../../services/blogService';
import { productsService } from '../../services/productsService';
import { BlogPost, Product } from '../../types/database.types';
import { Plus, Edit2, Trash2, Globe, FileText, CheckCircle2 } from 'lucide-react';

export function AdminBlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredMedia, setFeaturedMedia] = useState('');
  const [relatedProductId, setRelatedProductId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [ctaText, setCtaText] = useState('Order on WhatsApp');

  const fetchPosts = async () => {
    const [pData, prodData] = await Promise.all([
      blogService.getAllPosts(),
      productsService.getAllProducts(),
    ]);
    setPosts(pData);
    setProducts(prodData.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleEdit = (post: BlogPost) => {
    setIsEditing(true);
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || '');
    setContent(post.content);
    setFeaturedMedia(post.featured_media || '');
    setRelatedProductId(post.related_product_id || '');
    setStatus(post.status === 'published' ? 'published' : 'draft');
    setCtaText(post.cta_text || 'Order on WhatsApp');
  };

  const handleNew = () => {
    setIsEditing(true);
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setFeaturedMedia('https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80');
    setRelatedProductId(products[0]?.id || '');
    setStatus('published');
    setCtaText('Order on WhatsApp');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    if (editingPostId) {
      await blogService.updatePost(editingPostId, {
        title,
        slug,
        excerpt,
        content,
        featured_media: featuredMedia,
        related_product_id: relatedProductId || null,
        status,
        cta_text: ctaText,
      });
    } else {
      await blogService.createPost({
        title,
        slug,
        excerpt,
        content,
        featured_media: featuredMedia,
        related_product_id: relatedProductId || null,
        status,
        cta_text: ctaText,
      });
    }

    setIsEditing(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete article?')) {
      await blogService.deletePost(id);
      fetchPosts();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
            Supabase blog_posts Table
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Blog & Content Engine
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Architecture: BLOG → PRODUCT → WHATSAPP
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleNew}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
            {editingPostId ? 'Edit Article' : 'Compose New Article'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Article Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingPostId) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Excerpt / Summary</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Featured Image URL</label>
            <input
              type="text"
              value={featuredMedia}
              onChange={(e) => setFeaturedMedia(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Related Product (for WhatsApp CTA)</label>
              <select
                value={relatedProductId}
                onChange={(e) => setRelatedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
              >
                <option value="">No product linked</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Article Body Content *</label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-700 text-white font-bold"
            >
              Save Article
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase">
              <tr>
                <th className="py-3 px-6 font-bold">Article</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Linked Product</th>
                <th className="py-3 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {posts.map(post => {
                const prod = products.find(p => p.id === post.related_product_id);
                return (
                  <tr key={post.id} className="hover:bg-stone-50">
                    <td className="py-4 px-6 font-semibold text-stone-900">
                      <div>{post.title}</div>
                      <span className="text-[10px] text-stone-400 font-mono">/blog/{post.slug}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-stone-600 font-medium">
                      {prod?.name || 'None'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => handleEdit(post)} className="text-stone-600 hover:text-stone-900 font-bold">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-700 font-bold">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
