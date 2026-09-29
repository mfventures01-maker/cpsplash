import React from 'react';
import { MapPin, Phone, MessageCircle, Heart, ShieldCheck, Droplets, Sparkles } from 'lucide-react';

export function StoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
          Born in Sapele, Delta State
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight">
          The Story of CP Fruit Splash
        </h1>
        <p className="text-stone-600 text-base leading-relaxed font-serif italic">
          "Goodness in Every Sip. Real nature, authentic botanical craftsmanship, zero artificial compromises."
        </p>
      </div>

      {/* Hero Visual Block */}
      <div className="rounded-3xl overflow-hidden aspect-16/9 bg-stone-900 shadow-xl relative">
        <img
          src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80"
          alt="CP Splash Harvest"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-8 sm:p-12">
          <div className="text-white space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
              Flagship Facility
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">
              Opposite Ajimele Junction, Ajogodo, Sapele
            </h3>
          </div>
        </div>
      </div>

      {/* Story Narrative */}
      <div className="prose prose-stone max-w-none text-stone-700 text-sm sm:text-base leading-relaxed space-y-6">
        <p>
          In Nigerian culture, Zobo (hibiscus drink) is more than just refreshment; it is hospitality, celebration, and deeply rooted culinary heritage. Yet for years, consumers seeking bottled beverages faced an uncomfortable choice: synthetic soda concentrates filled with chemical flavorings and artificial colorants, or unstandardized roadside mixes.
        </p>

        <p>
          CP Fruit Splash was created to change that forever. From our modern bottling facility in Sapele, Delta State, we set out to craft beverages that honor the pure vitality of Nigerian botanicals while introducing luxury whole-fruit blends.
        </p>

        <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 w-fit">
              <Droplets className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">Sun-Dried Calyces</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              We source unbroken Nigerian hibiscus flowers, steeped gently to preserve delicate polyphenols and rich ruby color.
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 w-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">Superfruit Luxury</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our Luxury Juice Mix unites pressed pomegranate, orchard apple, strawberries, and wild blueberries + Extra Vitamin C.
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">Zero Preservatives</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cold-chain freshness without artificial potassium sorbate, sodium benzoate, or synthetic food dyes.
            </p>
          </div>
        </div>

        <p>
          Today, CP Fruit Splash is expanding rapidly across Delta State, Benin City, Port Harcourt, and nationwide. Every bottle carries the phone number of our bottling plant: <strong>08127700724</strong>, welcoming feedback, community connections, and direct customer delivery.
        </p>
      </div>

      {/* Direct Flagship Contact */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-rose-950 to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-black">Experience the Goodness in Sapele</h3>
          <p className="text-xs text-rose-200">
            Opposite Ajimele Junction, Ajogodo, Sapele, Delta State • Enquiry: 08127700724
          </p>
        </div>

        <a
          href="https://wa.me/2348127700724"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shrink-0 transition-colors shadow-lg"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat With Flagship</span>
        </a>
      </div>
    </div>
  );
}
