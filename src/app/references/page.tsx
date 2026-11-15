import type { Metadata } from 'next';
import { Sparkles, CheckCheck, Eye, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Etsy Style Guide & References — RavidStudio',
  description: 'Permanent photographic visual standard derived from Ceramic Cosmic Craft Etsy listings.',
};

export default function ReferencesPage() {
  const references = [
    {
      title: 'Ceramic Green Matcha Set (Hero Listing)',
      filename: 'listing-green-set-full.jpg',
      src: '/references/listing-green-set-full.jpg',
      category: 'Hero Presentation',
      notes: 'Full 4-piece set on woven runner with front-top natural lighting and subtle top-right watermark.',
    },
    {
      title: 'Variant A: Whisk Stand / Naoshi',
      filename: 'listing-green-variant-a-holder.jpg',
      src: '/references/listing-green-variant-a-holder.jpg',
      category: 'Variant Photo',
      notes: 'Single item horizontally centered. Rested firmly on woven runner with tight dual-layer contact shadow.',
    },
    {
      title: 'Variant B: Matcha Chawan Bowl',
      filename: 'listing-green-variant-b-bowl.jpg',
      src: '/references/listing-green-variant-b-bowl.jpg',
      category: 'Variant Photo',
      notes: 'Wide bowl aspect ratio. Baseline aligned to Y=805px on runner.',
    },
    {
      title: 'Variant C: Duo Set (Holder + Bowl)',
      filename: 'listing-green-variant-c-duo.jpg',
      src: '/references/listing-green-variant-c-duo.jpg',
      category: 'Duo Photo',
      notes: 'Two-piece balance across horizontal center line.',
    },
    {
      title: 'Plum Blossom Chawan Full Set',
      filename: 'listing-plum-set-full.jpg',
      src: '/references/listing-plum-set-full.jpg',
      category: 'Hero Presentation',
      notes: 'Plum blossom pattern set demonstrating edge-to-edge runner continuity and neutral wall gradient.',
    },
    {
      title: 'Plum Blossom Variant B (Bowl)',
      filename: 'listing-plum-variant-b-bowl.jpg',
      src: '/references/listing-plum-variant-b-bowl.jpg',
      category: 'Variant Photo',
      notes: 'Individual chawan with authentic Etsy option badge B.',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Etsy Photography Style Guide</h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Ceramic Cosmic Craft Standard
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            These original Etsy listing photographs form the fixed visual identity encoded permanently into RavidStudio.
          </p>
        </div>
      </div>

      {/* Specifications Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Upper Wall</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">Off-White Soft Studio</p>
          <p className="text-[11px] text-gray-500 mt-1">Y = 0 to 630px (~60% height), #DFE0DB tone</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Product Stage</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">Woven Jute Knit Runner</p>
          <p className="text-[11px] text-gray-500 mt-1">Y = 715 to 907px, 25px stitch pitch</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Contact Shadow</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">Dual-Layer Physics</p>
          <p className="text-[11px] text-gray-500 mt-1">Occlusion seam (8px) + Ambient blur (22px)</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">Canvas Output</span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">1024 × 1024 px Square</p>
          <p className="text-[11px] text-gray-500 mt-1">High-res 2048px Ultra-HD export supported</p>
        </div>
      </div>

      {/* Reference Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {references.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
            <div className="aspect-square bg-gray-100 overflow-hidden relative">
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                {item.category}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>{item.filename}</span>
                <span className="text-emerald-700 font-medium">Bundled Asset</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
