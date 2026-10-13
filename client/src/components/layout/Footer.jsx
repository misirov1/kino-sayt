import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              KINO<span className="text-red-500">VERSE</span>
            </span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            O‘zbekistondagi ilk innovatsion virtual kino platformasi. Sevimli filmlaringizni do‘stlaringiz bilan virtual xonada, divanda birga o‘tirib tomosha qiling.
          </p>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-medium">Barcha serverlar va real-time xonalar aktiv</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Katalog</h4>
          <ul className="space-y-2">
            <li><Link to="/movies?category=Yangi kinolar" className="hover:text-red-400 transition-colors">Yangi kinolar 2024–2026</Link></li>
            <li><Link to="/movies?category=O‘zbek kinolari" className="hover:text-red-400 transition-colors">O‘zbek milliy kinosi</Link></li>
            <li><Link to="/movies?category=O‘zbek tilidagi kinolar" className="hover:text-red-400 transition-colors">Professional dublyaj</Link></li>
            <li><Link to="/movies?sort=popular" className="hover:text-red-400 transition-colors">Eng mashhur filmlar</Link></li>
            <li><Link to="/movies?category=Seriallar" className="hover:text-red-400 transition-colors">Seriallar</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Janrlar</h4>
          <ul className="space-y-2">
            <li><Link to="/movies?genre=Jangari" className="hover:text-red-400 transition-colors">Jangari va Triller</Link></li>
            <li><Link to="/movies?genre=Komediya" className="hover:text-red-400 transition-colors">Komediya</Link></li>
            <li><Link to="/movies?genre=Drama" className="hover:text-red-400 transition-colors">Drama va Tarixiy</Link></li>
            <li><Link to="/movies?genre=Fantastika" className="hover:text-red-400 transition-colors">Fantastika va Sarguzasht</Link></li>
            <li><Link to="/movies?genre=Multfilm" className="hover:text-red-400 transition-colors">Bolalar va Multfilmlar</Link></li>
          </ul>
        </div>

        {/* Features & Innovation */}
        <div>
          <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Imkoniyatlar</h4>
          <div className="space-y-2 text-zinc-400">
            <p className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>4 kishilik Virtual Divan Xonasi</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-500" />
              <span>Sinxron video pleyer (Play/Pause/Seek)</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              <span>Jonli emojilar va xona chati</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>4K / Full HD yuqori sifat</span>
            </p>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
        <p>© 2026 KINOVERSE. Barcha huquqlar himoyalangan.</p>
        <p className="flex items-center gap-1">
          O‘zbekistonda muhabbat bilan yaratilgan <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
        </p>
      </div>
    </footer>
  );
}
