import React, { useState, useEffect, useRef } from 'react';
import {
  ProductMediaRelation,
  ProductAnimationConfig,
  MediaSequenceRole
} from '../../types/database.types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Layers,
  RotateCw
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { mediaService } from '../../services/mediaService';
import {
  BRAND_PLACEHOLDER_IMAGE,
  SEQUENCE_ROLES_META,
  DEFAULT_ANIMATION_CONFIG
} from '../../services/productHelpers';

interface ProductGalleryProps {
  media?: ProductMediaRelation[];
  productName: string;
  productId?: string;
  animationConfig?: ProductAnimationConfig;
  metadata?: Record<string, unknown>;
}

export function ProductGallery({
  media = [],
  productName,
  productId,
  animationConfig,
  metadata
}: ProductGalleryProps) {
  // Resolve animation settings from props or metadata
  const config: ProductAnimationConfig = animationConfig || {
    ...DEFAULT_ANIMATION_CONFIG,
    ...((metadata?.animation_config as Partial<ProductAnimationConfig>) || {})
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.autoplay);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check user's prefers-reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsPlaying(false);
    }

    const handler = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      if (e.matches) setIsPlaying(false);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Map media to the 6 authoritative sequence roles
  // Each sequence slot represents one of the six constitutional stages
  const sequenceSlots = SEQUENCE_ROLES_META.map(meta => {
    // 1. Try to find media explicitly tagged with this role in metadata or item.role
    const rawSeq = metadata?.media_sequence as Array<{ role: string; media_id: string; enabled?: boolean }> | undefined;
    const explicitEntry = rawSeq?.find(s => s.role === meta.role && s.enabled !== false);

    let matchedItem: ProductMediaRelation | undefined;
    if (explicitEntry) {
      matchedItem = media.find(m => m.media_id === explicitEntry.media_id);
    }

    // 2. Fallback to sort_order matching the position
    if (!matchedItem) {
      matchedItem = media.find(m => m.sort_order === meta.position);
    }

    // 3. Fallback to array index if available
    if (!matchedItem && media[meta.position - 1]) {
      matchedItem = media[meta.position - 1];
    }

    return {
      meta,
      item: matchedItem || null,
      asset: matchedItem ? (matchedItem.media_assets || matchedItem.asset) : null
    };
  });

  // Filter to active presentation slides: if product has media, use assigned slots, else show slot 1
  const activeSlides = sequenceSlots.filter(s => s.item !== null);
  const displaySlides = activeSlides.length > 0 ? activeSlides : [sequenceSlots[0]];
  const totalSlides = displaySlides.length;

  const currentSlot = displaySlides[currentIndex] || displaySlides[0];
  const currentAsset = currentSlot.asset;
  const currentUrl = currentAsset ? mediaService.getMediaAssetUrl(currentAsset) : BRAND_PLACEHOLDER_IMAGE;
  const isVideo = Boolean(
    currentAsset?.media_type?.includes('video') ||
    currentAsset?.mime_type?.startsWith('video/') ||
    currentUrl.endsWith('.mp4') ||
    currentUrl.endsWith('.webm') ||
    currentUrl.includes('.mp4?') ||
    currentUrl.includes('.webm?')
  );

  // Poster fallback image (first static image in sequence if available)
  const posterAsset = sequenceSlots.find(s => s.asset && !s.asset.media_type?.includes('video') && !s.asset.mime_type?.startsWith('video/'))?.asset;
  const posterUrl = posterAsset ? mediaService.getMediaAssetUrl(posterAsset) : undefined;

  // Animation autoplay loop timer
  useEffect(() => {
    if (!isPlaying || isReducedMotion || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(1500, (config.duration_seconds || 4.5) * 1000);
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev + 1 >= totalSlides) {
          if (!config.loop) {
            setIsPlaying(false);
            return prev;
          }
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isReducedMotion, totalSlides, config.duration_seconds, config.loop]);

  const handleSelectIndex = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(false); // Pause sequence when user manually interacts
    if (productId && displaySlides[idx]?.asset) {
      analyticsService.trackEvent('media_sequence_step', {
        productId,
        metadata: {
          stepIndex: idx,
          role: displaySlides[idx].meta.role,
          label: displaySlides[idx].meta.label
        }
      });
    }
  };

  const handlePrev = () => {
    handleSelectIndex(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    handleSelectIndex(currentIndex + 1 >= totalSlides ? 0 : currentIndex + 1);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoPlay = () => {
    if (productId && currentAsset) {
      analyticsService.trackEvent('product_video_play', {
        productId,
        metadata: { media_id: currentAsset.id, role: currentSlot.meta.role }
      });
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Sequence Header & Animation Engine Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-rose-800/60 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>Sequence 0{currentSlot.meta.position}</span>
          </span>
          <span className="font-semibold text-stone-800 text-[11px] truncate max-w-[200px] sm:max-w-xs">
            {currentSlot.meta.label}
          </span>
        </div>

        {totalSlides > 1 && !isReducedMotion && (
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayback}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
              title={isPlaying ? "Pause auto-presentation" : "Play auto-presentation"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-stone-700" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Presentation Viewport */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-stone-950 border border-stone-200/90 shadow-xl group">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              key={currentUrl}
              src={currentUrl}
              poster={posterUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
              autoPlay={!isReducedMotion && config.autoplay}
              loop={config.loop}
              muted={isVideoMuted}
              onPlay={handleVideoPlay}
            />
            <button
              onClick={() => setIsVideoMuted(!isVideoMuted)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-900/80 backdrop-blur-md text-white hover:bg-stone-900 transition-colors cursor-pointer z-20"
              title={isVideoMuted ? "Unmute" : "Mute"}
            >
              {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <img
            key={currentUrl}
            src={currentUrl}
            alt={currentAsset?.alt_text || `${productName} - ${currentSlot.meta.label}`}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Semantic Role Tag Overlay */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider border border-white/20 shadow-md">
            {currentSlot.meta.role.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Visual Sequence Step Navigator Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-1.5 z-20">
            {displaySlides.map((slide, idx) => (
              <button
                key={slide.meta.role}
                onClick={() => handleSelectIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-2 bg-rose-500 shadow-md'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                title={slide.meta.label}
              />
            ))}
          </div>
        )}

        {/* Previous & Next arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
              aria-label="Previous sequence position"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
              aria-label="Next sequence position"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Six-Part Sequence Trackers / Thumbnails */}
      <div className="grid grid-cols-6 gap-2 pt-1">
        {SEQUENCE_ROLES_META.map((meta, idx) => {
          const slot = sequenceSlots[idx];
          const hasAsset = Boolean(slot.asset);
          const thumbUrl = slot.asset ? mediaService.getMediaAssetUrl(slot.asset) : null;
          const isSelected = displaySlides[currentIndex]?.meta.role === meta.role;

          return (
            <button
              key={meta.role}
              onClick={() => {
                if (hasAsset) {
                  const targetIdx = displaySlides.findIndex(s => s.meta.role === meta.role);
                  if (targetIdx !== -1) handleSelectIndex(targetIdx);
                }
              }}
              disabled={!hasAsset}
              className={`group flex flex-col items-center text-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-rose-600 bg-rose-50/50 shadow-sm scale-102 ring-2 ring-rose-500/20'
                  : hasAsset
                    ? 'border-stone-200 bg-white hover:border-stone-400 opacity-80 hover:opacity-100'
                    : 'border-dashed border-stone-200 bg-stone-50/60 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-stone-100 relative mb-1">
                {thumbUrl ? (
                  <img src={thumbUrl} alt={meta.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400 font-mono">
                    0{meta.position}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono font-bold text-stone-700 truncate w-full">
                0{meta.position}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
