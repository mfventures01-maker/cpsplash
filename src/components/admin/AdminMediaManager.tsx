import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ProductMediaRelation } from '../../types/database.types';
import { mediaService } from '../../services/mediaService';
import { ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

export function AdminMediaManager() {
  const [mediaItems, setMediaItems] = useState<ProductMediaRelation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('product_media')
      .select('*, media_assets(*), product:products(name)')
      .order('created_at', { ascending: false });

    setMediaItems((data as unknown as ProductMediaRelation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (productId: string, mediaId: string) => {
    if (confirm('Delete this media record?')) {
      await mediaService.deleteMedia(productId, mediaId);
      fetchMedia();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
            Supabase Storage & Assets
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Product Media Engine
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Bucket: <code>cp-public</code> • Tables: <code>media_assets</code>, <code>product_media</code>
          </p>
        </div>

        <button
          onClick={fetchMedia}
          className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-stone-400">Loading media assets...</div>
      ) : mediaItems.length === 0 ? (
        <div className="p-12 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200">
          No media assets uploaded yet. Add media from the Product Editor.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => {
            const asset = item.media_assets || item.asset;
            const imgUrl = mediaService.getMediaAssetUrl(asset);

            return (
              <div key={`${item.product_id}-${item.media_id}`} className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-2 p-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 relative">
                  <img src={imgUrl} alt={asset?.alt_text || 'Media'} className="w-full h-full object-cover" />
                  {asset?.media_type && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/80 text-white text-[9px] font-mono uppercase">
                      {asset.media_type}
                    </div>
                  )}
                  {item.is_primary && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase">
                      Primary
                    </div>
                  )}
                </div>

                <div className="px-1 text-xs">
                  <p className="font-semibold text-stone-800 truncate text-[11px]">{asset?.alt_text || asset?.filename || 'Media Asset'}</p>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 hover:text-stone-800 text-[10px] flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.product_id, item.media_id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
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
  );
}
