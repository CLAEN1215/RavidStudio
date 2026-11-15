'use client';

import React, { useState } from 'react';
import { Type, Sparkles, Copy, Check, ExternalLink, Bot, ArrowRight, Loader2 } from 'lucide-react';

export default function TitlesPage() {
  const [productText, setProductText] = useState('荷韵茶筅立 [橙红渐变] 宽约6.2cm 高约7cm');
  const [productType, setProductType] = useState('Matcha Whisk Holder');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    titles: Array<{ type: string; title: string }>;
    tags: string[];
    isFallback?: boolean;
  } | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const desc = params.get('desc');
      const type = params.get('type');
      if (desc) setProductText(decodeURIComponent(desc));
      if (type) setProductType(decodeURIComponent(type));
    } catch {
      // ignore
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('studio_options');
      const geminiApiKey = saved ? JSON.parse(saved).geminiApiKey : undefined;

      const res = await fetch('/api/titles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: productText,
          productType,
          apiKey: geminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults({
          titles: data.titles,
          tags: data.tags,
          isFallback: data.isFallback,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Etsy Title & SEO Generator</h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Bot className="w-3 h-3" />
              Powered by Google Gemini AI
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Transform raw Chinese supplier specs or product notes into high-converting Etsy listing titles and 13 tags.
          </p>
        </div>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-gray-800 block">
              Supplier Description or 1688 Text
            </label>
            <textarea
              rows={3}
              value={productText}
              onChange={(e) => setProductText(e.target.value)}
              placeholder="Paste Chinese supplier title, product specs, or English notes..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-gray-800 block">Product Category</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Matcha Whisk Holder">Matcha Whisk Holder (Naoshi)</option>
                <option value="Matcha Bowl">Matcha Bowl (Chawan)</option>
                <option value="Matcha Set">Full Matcha Ceremony Set</option>
                <option value="Ceramic Home Decor">Ceramic Home Decor / Vessel</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !productText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating SEO Titles...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Titles & Tags
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {results && (
        <div className="space-y-6">
          {/* Titles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span>Optimized Etsy Listing Titles</span>
              {results.isFallback && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Rule-based generator (Add Gemini API key in Settings for custom AI generation)
                </span>
              )}
            </h2>

            <div className="space-y-3">
              {results.titles.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between gap-3 group hover:border-emerald-200 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      {t.type}
                    </span>
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed">{t.title}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                      {t.title.length} characters (Etsy limit: 140)
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(t.title, idx)}
                    className="p-2 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200 flex-shrink-0"
                    title="Copy Title"
                  >
                    {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 13 Etsy Tags */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                13 Etsy Search Tags (Click to copy)
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(results.tags.join(', '));
                  setCopiedTag('all');
                  setTimeout(() => setCopiedTag(null), 2000);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {copiedTag === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy All 13 Tags
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {results.tags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => copyTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
                    copiedTag === tag
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span>{tag}</span>
                  <span className="text-[10px] text-gray-400 font-mono">({tag.length})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
