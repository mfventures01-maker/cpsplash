import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Product } from '../../types/database.types';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface ProductCarouselProps {
  products: Product[];
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
  title?: string;
  subtitle?: string;
}

export function ProductCarousel({
  products,
  onNavigate,
  onOpenOrderModal,
  title = "Signature Blends Discovery",
  subtitle = "Swipe or navigate through our cold-crafted botanical juice collection."
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

    // Compute approximate active slide
    const cardWidth = el.querySelector<HTMLElement>('[data-carousel-card]')?.offsetWidth || 320;
    const gap = 24;
    const newIdx = Math.round(scrollLeft / (cardWidth + gap));
    setActiveSlideIndex(Math.min(Math.max(newIdx, 0), Math.max(0, products.length - 1)));
  }, [products.length]);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, products.length]);

  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const cardWidth = el.querySelector<HTMLElement>('[data-carousel-card]')?.offsetWidth || 320;
    const scrollAmount = cardWidth + 24; // card width + gap
    const targetScroll = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByDirection('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByDirection('right');
    }
  };

  if (products.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-stone-200 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-stone-900">No Products Published Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            All storefront items are dynamically loaded from our Supabase PostgreSQL database. Published products will appear here automatically.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/admin')}
          className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs transition-colors cursor-pointer"
        >
          Open Admin CMS to Add Products
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header with Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Product Carousel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            {title}
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm max-w-xl mt-1">
            {subtitle}
          </p>
        </div>

        {/* Previous / Next Controls */}
        {products.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-stone-400 hidden sm:inline">
              Slide {activeSlideIndex + 1} of {products.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'bg-white hover:bg-stone-50 text-stone-900 border-stone-300 shadow-xs hover:scale-105 active:scale-95'
                    : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed opacity-50'
                }`}
                aria-label="Previous product slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  canScrollRight
                    ? 'bg-white hover:bg-stone-50 text-stone-900 border-stone-300 shadow-xs hover:scale-105 active:scale-95'
                    : 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed opacity-50'
                }`}
                aria-label="Next product slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrolling Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth scrollbar-thin snap-x snap-mandatory focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-3xl"
        tabIndex={-1}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            data-carousel-card
            className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start transition-transform duration-300"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${products.length}: ${product.name}`}
          >
            <ProductCard
              product={product}
              onNavigate={onNavigate}
              onOpenOrderModal={onOpenOrderModal}
            />
          </div>
        ))}
      </div>

      {/* Slide Navigator Dots for Mobile */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:hidden pt-2">
          {products.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                const el = scrollContainerRef.current;
                if (!el) return;
                const cardWidth = el.querySelector<HTMLElement>('[data-carousel-card]')?.offsetWidth || 280;
                el.scrollTo({
                  left: idx * (cardWidth + 24),
                  behavior: prefersReducedMotion ? 'auto' : 'smooth',
                });
              }}
              className={`transition-all rounded-full cursor-pointer ${
                activeSlideIndex === idx ? 'w-6 h-2 bg-rose-600' : 'w-2 h-2 bg-stone-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
