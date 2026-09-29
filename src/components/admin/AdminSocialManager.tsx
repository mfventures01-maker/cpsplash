import React, { useEffect, useState } from 'react';
import { socialService } from '../../services/socialService';
import { productsService } from '../../services/productsService';
import { SocialContent, Product, SocialPlatform } from '../../types/database.types';
import { Plus, Trash2, Instagram, Video, Heart, ExternalLink } from 'lucide-react';

export function AdminSocialManager() {
  const [socialItems, setSocialItems] = useState<SocialContent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [postUrl, setPostUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [caption, setCaption] = useState('');
  const [creator, setCreator] = useState('');
  const [productId, setProductId] = useState('');

  const fetchItems = async () => {
    const [sData, pData] = await Promise.all([
      socialService.getAllContent(),
      productsService.getAllProducts(),
    ]);
    setSocialItems(sData);
    setProducts(pData.data);
    if (pData.data.length > 0 && !productId) {
      setProductId(pData.data[0].id);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl || !thumbnail) return;

    await socialService.addSocialContent({
      platform,
      post_url: postUrl,
      thumbnail,
      caption,
      creator,
      product_id: productId || null,
      status: 'published',
    });

    setPostUrl('');
    setThumbnail('');
    setCaption('');
    setCreator('');
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete social post?')) {
      await socialService.deleteSocialContent(id);
      fetchItems();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          Supabase social_content Table
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Social Proof & UGC Engine
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Attach verified Instagram, TikTok, and UGC customer reels to CP Splash product showcases.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Add Community / Influencer Post
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="ugc">User Generated Content (UGC)</option>
              <option value="youtube">YouTube Short</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Creator Handle / Name</label>
            <input
              type="text"
              required
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="e.g. @kapeni_official"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Target Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Original Post URL</label>
            <input
              type="text"
              required
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Thumbnail Image URL</label>
            <input
              type="text"
              required
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-stone-700 block mb-1">Caption / Testimonial Quote</label>
          <input
            type="text"
            required
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Nothing beats ice-cold CP Zobo Sweet after a workout in Sapele!"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
          >
            Publish to Social Commerce Feed
          </button>
        </div>
      </form>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {socialItems.map(item => (
          <div key={item.id} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <div className="aspect-4/3 rounded-xl overflow-hidden bg-stone-100">
              <img src={item.thumbnail} alt={item.creator || 'UGC'} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-900">{item.creator}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100">{item.platform}</span>
              </div>
              <p className="text-stone-600 text-[11px] line-clamp-2">"{item.caption}"</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-xs">
              <a href={item.post_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 font-bold flex items-center gap-1">
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
