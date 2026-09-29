import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductMedia } from '../../types/database.types';
import { Image as ImageIcon, Video, Trash2, ExternalLink, RefreshCw, Upload } from 'lucide-react';

export function AdminMediaManager() {
  const [mediaItems, setMediaItems] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    setLoading(true);
    const { data } = await supabase.from('product_media').select('*').order('created_at', { ascending: false });
    setMediaItems((data as ProductMedia[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this media record?')) {
      await supabase.from('product_media').delete().eq('id', id);
      fetchMedia();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          Supabase Storage & Assets
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Product Media Engine
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Storage Buckets: <code>product-media</code> (public), <code>ugc-uploads</code> (public), <code>admin-assets</code> (restricted).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems.map((item) => (
          <div key={item.id} className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-2 p-2">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative">
              <img src={item.url} alt={item.alt_text || 'Media'} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/80 text-white text-[9px] font-mono uppercase">
                {item.type.replace('_', ' ')}
              </div>
              {item.is_primary && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase">
                  Hero
                </div>
              )}
            </div>

            <div className="px-1 text-xs">
              <p className="font-semibold text-stone-800 truncate text-[11px]">{item.alt_text || 'Media Asset'}</p>
              <div className="flex items-center justify-between pt-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-500 hover:text-stone-800 text-[10px] flex items-center gap-1"
                >
                  <span>Link</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
