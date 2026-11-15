'use client';

import React from 'react';
import { Sparkles, CheckCheck } from 'lucide-react';

interface ReferenceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceComparisonModal({
  isOpen,
  onClose,
}: ReferenceComparisonModalProps) {
  if (!isOpen) return null;

  const references = [
    {
      title: 'Original Etsy Listing: Green Matcha Set (Hero)',
      src: '/references/listing-green-set-full.jpg',
      tags: ['Woven Runner', 'Watermark Top-Right', 'Natural Tabletop'],
    },
    {
      title: 'Original Etsy Listing: Variant A (Whisk Stand)',
      src: '/references/listing-green-variant-a-holder.jpg',
      tags: ['Badge A', 'Centered Placement', 'Contact Shadow'],
    },
    {
      title: 'Original Etsy Listing: Variant B (Chawan Bowl)',
      src: '/references/listing-green-variant-b-bowl.jpg',
      tags: ['Badge B', 'Wide Aspect Ratio', 'Wood Foreground'],
    },
    {
      title: 'Original Etsy Listing: Plum Blossom Chawan Set',
      src: '/references/listing-plum-set-full.jpg',
      tags: ['Plum Blossom Design', 'Edge-to-Edge Runner'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Bundled Reference Listing Photographs
              </h3>
              <p className="text-xs text-gray-500">
                These are your actual Etsy photographs used as the permanent visual standard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-emerald-800">
            <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              The Product Image Studio pipeline uses the fixed background template, positioning rules,
              and shadow physics extracted directly from these photographs. No retraining or re-uploading required.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {references.map((ref, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex flex-col shadow-sm"
              >
                <div className="aspect-square bg-gray-200 overflow-hidden relative">
                  <img
                    src={ref.src}
                    alt={ref.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-white border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{ref.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ref.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
