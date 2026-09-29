import React, { useState } from 'react';
import { ProductMedia } from '../../types/database.types';
import { Play, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface ProductGalleryProps {
  media: ProductMedia[];
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

  const activeMedia = media[selectedIndex] || media[0];
  const isVideo = activeMedia.type === 'hero_video' || activeMedia.type === 'short_video' || activeMedia.url.endsWith('.mp4');

  const handleVideoPlay = () => {
    if (productId) {
      analyticsService.trackEvent('product_video_play', {
        productId,
        metadata: { media_id: activeMedia.id, url: activeMedia.url }
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
              src={activeMedia.url}
              poster={activeMedia.thumbnail_url || undefined}
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
            src={activeMedia.url}
            alt={activeMedia.alt_text || productName}
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}

        {/* Media Type Badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-mono border border-white/20">
          {activeMedia.type.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Thumbnails row */}
      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {media.map((item, index) => {
            const isItemVideo = item.type.includes('video') || item.url.endsWith('.mp4');
            const isSelected = selectedIndex === index;

            return (
              <button
                key={item.id || index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected ? 'border-rose-600 scale-105 shadow-md' : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.alt_text || `Thumb ${index + 1}`}
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
