import React from 'react';

export function BrandLogo({ className = "h-10", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-rose-700 via-red-600 to-amber-500 shadow-md shadow-red-950/20 text-white font-extrabold text-xl font-serif">
        <span className="text-white drop-shadow-sm">CP</span>
        <span className="absolute -top-1 -right-1 text-emerald-400 text-xs">🌿</span>
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={`text-xl font-black uppercase tracking-wider ${dark ? 'text-white' : 'text-stone-900'}`}>
            Fruit<span className="text-rose-600 ml-1">Splash</span>
          </span>
        </div>
        <span className="text-[10px] tracking-widest font-semibold uppercase text-emerald-600">
          Fresh • Natural • Refreshing
        </span>
      </div>
    </div>
  );
}

export function ZoboBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs font-medium backdrop-blur-sm shadow-sm">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
      <span>100% Pure Nigerian Hibiscus</span>
    </div>
  );
}

export function LuxuryFruitBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs font-medium backdrop-blur-sm shadow-sm">
      <span className="text-amber-400">★</span>
      <span>Pomegranate • Apple • Strawberry • Blueberry</span>
    </div>
  );
}
