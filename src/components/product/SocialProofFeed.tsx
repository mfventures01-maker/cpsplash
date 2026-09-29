import React from 'react';
import { SocialContent } from '../../types/database.types';
import { Instagram, Video, MessageCircle, ExternalLink, Heart } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface SocialProofFeedProps {
  items: SocialContent[];
  onProductClick?: (productId: string) => void;
}

export function SocialProofFeed({ items, onProductClick }: SocialProofFeedProps) {
  if (!items || items.length === 0) return null;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
      case 'tiktok':
        return <Video className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Heart className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  const handlePostClick = (item: SocialContent) => {
    analyticsService.trackEvent('social_click', {
      productId: item.product_id,
      content: item.post_url,
      metadata: { creator: item.creator, platform: item.platform }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
            Community Love & Social Proof
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
            Seen Across Nigeria & Sapele
          </h3>
        </div>
        <p className="text-xs text-stone-500 max-w-sm">
          Tag <strong>#CPSplash #TasteNature</strong> on Instagram & TikTok to be featured on our official commerce feed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
              <img
                src={item.thumbnail}
                alt={item.caption || 'Social post'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                {getPlatformIcon(item.platform)}
                <span className="capitalize">{item.platform}</span>
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 block mb-1">
                  {item.creator || 'CP Splash Fan'}
                </span>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  "{item.caption}"
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <a
                  href={item.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePostClick(item)}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>View Post</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {item.product_id && (
                  <button
                    onClick={() => onProductClick && onProductClick(item.product_id!)}
                    className="text-stone-500 hover:text-stone-900 font-medium"
                  >
                    View Product
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
