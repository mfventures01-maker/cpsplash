import React, { useState } from 'react';
import { ProductMediaRelation } from '../../types/database.types';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { mediaService } from '../../services/mediaService';

interface ProductGalleryProps {
  media?: ProductMediaRelation[];
  productName: string;
  productId?: string;
}

export function ProductGallery({ media, productName, productId }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  if (!media || media.length === 0) {
    return (
      <div className="aspect-square bg-stone-100 rounded-3xl flex items-center justify-center text-stone-400 text-sm">
        No media uploaded for this product
      </div>
    );
  }

  const activeItem = media[selectedIndex] || media[0];
  const activeAsset = activeItem.media_assets || activeItem.asset;
  const activeUrl = mediaService.getMediaAssetUrl(activeAsset);
  const isVideo = activeAsset?.media_type?.includes('video') || activeUrl.endsWith('.mp4');

  const handleVideoPlay = () => {
    if (productId && activeAsset) {
      analyticsService.trackEvent('product_video_play', {
        productId,
        metadata: { media_id: activeAsset.id, url: activeUrl }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Viewport */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-stone-900 border border-stone-200 shadow-md">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              src={activeUrl}
              className="w-full h-full object-cover"
              controls
              autoPlay
              loop
              muted={isVideoMuted}
              onPlay={handleVideoPlay}
            />
            <button
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition-colors cursor-pointer"
              title={isVideoMuted ? "Unmute" : "Mute"}
            >
              {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <img
            src={activeUrl || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'}
            alt={activeAsset?.alt_text || productName}
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}

        {/* Media Type Badge */}
        {activeAsset && (
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-mono border border-white/20 uppercase">
            {activeAsset.media_type}
          </div>
        )}
      </div>

      {/* Thumbnails row */}
      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {media.map((item, index) => {
            const asset = item.media_assets || item.asset;
            const itemUrl = mediaService.getMediaAssetUrl(asset);
            const isItemVideo = asset?.media_type?.includes('video') || itemUrl.endsWith('.mp4');
            const isSelected = selectedIndex === index;

            return (
              <button
                key={item.media_id || index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected ? 'border-rose-600 scale-105 shadow-md' : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={itemUrl}
                  alt={asset?.alt_text || `Thumb ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isItemVideo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
