'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Trophy,
  Sparkles,
  TrendingUp,
  Package,
  ArrowRight,
  Camera,
  Type,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ScoredVariant } from '@/app/api/research/analyze-1688/route';

export default function ResearchPage() {
  const [listingUrl, setListingUrl] = useState(
    'https://detail.1688.com/offer/7829102910.html'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showKeyField, setShowKeyField] = useState(false);
  const [results, setResults] = useState<{
    url: string;
    offerId: string;
    listingTitle: string;
    totalVariantsFound: number;
    top3: ScoredVariant[];
    otherVariants: ScoredVariant[];
    aiSummary: string;
    isGeminiBrain?: boolean;
  } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load existing Gemini key from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('studio_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.geminiApiKey) {
          setHasGeminiKey(true);
          setGeminiKeyInput(parsed.geminiApiKey);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveGeminiKey = (key: string) => {
    try {
      const saved = localStorage.getItem('studio_options');
      const existing = saved ? JSON.parse(saved) : {};
      const updated = { ...existing, geminiApiKey: key.trim() };
      localStorage.setItem('studio_options', JSON.stringify(updated));
      setHasGeminiKey(!!key.trim());
      setShowKeyField(false);
    } catch {
      // ignore
    }
  };

  const handleAnalyze1688 = async (overrideUrl?: string) => {
    const urlToAnalyze = (overrideUrl || listingUrl).trim();
    if (!urlToAnalyze) {
      setErrorMessage('Please paste a 1688 listing URL or product text.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const saved = localStorage.getItem('studio_options');
      const geminiApiKey = saved ? JSON.parse(saved).geminiApiKey : undefined;

      const res = await fetch('/api/research/analyze-1688', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToAnalyze,
          geminiApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze 1688 listing');
      }

      setResults({
        url: data.url,
        offerId: data.offerId,
        listingTitle: data.listingTitle,
        totalVariantsFound: data.totalVariantsFound,
        top3: data.top3,
        otherVariants: data.otherVariants,
        aiSummary: data.aiSummary,
      });

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      console.error('Failed to analyze 1688 listing:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please check the link.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              1688 Product Research & Sales Predictor
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Top 3 Sales Picker
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Paste any 1688 wholesale listing link. The AI evaluates every variant and picks the top 3 products with the highest chance to get the most sales on Etsy.
          </p>
        </div>
      </div>

      {/* 1688 URL Input Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        {/* Gemini Brain Status Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              AI Intelligence Brain:
            </span>
            {hasGeminiKey ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Google Gemini Active
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowKeyField(!showKeyField)}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>⚡ Click to Connect Gemini Key</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowKeyField(!showKeyField)}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline"
          >
            {hasGeminiKey ? 'Change Key' : 'How to get free key'}
          </button>
        </div>

        {/* Gemini Key Input Drawer */}
        {showKeyField && (
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800">
                Paste Google Gemini API Key:
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-medium"
              >
                Get Free Google AI Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => handleSaveGeminiKey(geminiKeyInput)}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Connect Brain
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Enter 1688 Wholesale Listing Link or Product Text
          </label>
          <span className="text-[11px] text-gray-400">
            Auto-detects offer ID & variants
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze1688();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listingUrl}
              onChange={(e) => {
                setListingUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="https://detail.1688.com/offer/..."
              className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm flex-shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating All Variants...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Pick Top 3 Best Products
              </>
            )}
          </button>
        </form>

        {/* Quick Example Button */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="text-gray-400">Instant Test:</span>
          <button
            type="button"
            onClick={() => {
              const testUrl = 'https://detail.1688.com/offer/7829102910.html';
              setListingUrl(testUrl);
              handleAnalyze1688(testUrl);
            }}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Click to Run Sample 1688 Listing (Matcha Teaware Series)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Top 3 Best Products Showcase */}
      {results && (
        <div ref={resultsRef} className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Summary Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Evaluated {results.totalVariantsFound} Factory Variants from Offer #{results.offerId}
              </span>
              <p className="text-sm font-semibold text-gray-900">{results.listingTitle}</p>
              <p className="text-xs text-emerald-900/80 max-w-2xl mt-1 leading-relaxed">
                {results.aiSummary}
              </p>
            </div>
          </div>

          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top 3 Best Products (Highest Sales Potential)
          </h2>

          {/* Top 3 Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.top3.map((item, idx) => {
              const rankThemes = [
                {
                  rankNum: 1,
                  badge: '🥇 #1 HIGHEST SALES CHANCE',
                  badgeClass: 'bg-amber-400 text-amber-950 border-amber-300',
                  cardBorder: 'border-amber-400/80 shadow-md ring-1 ring-amber-400/20',
                  accentBg: 'bg-amber-50/40',
                },
                {
                  rankNum: 2,
                  badge: '🥈 #2 HIGH POTENTIAL',
                  badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
                  cardBorder: 'border-slate-300 shadow-sm',
                  accentBg: 'bg-slate-50/40',
                },
                {
                  rankNum: 3,
                  badge: '🥉 #3 STRONG RUNNER-UP',
                  badgeClass: 'bg-orange-100 text-orange-900 border-orange-200',
                  cardBorder: 'border-orange-200 shadow-sm',
                  accentBg: 'bg-orange-50/30',
                },
              ][idx];

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border ${rankThemes.cardBorder} p-5 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all`}
                >
                  <div className="space-y-3">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${rankThemes.badgeClass} flex items-center gap-1`}
                      >
                        {rankThemes.badge}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Score {item.opportunityScore}/100
                      </span>
                    </div>

                    {/* Image Preview & Details */}
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={item.imageUrl}
                        alt={item.skuNameEn}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                          {item.skuNameEn}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                          {item.skuName}
                        </p>
                      </div>
                    </div>

                    {/* Financial Economics Box */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>1688 Cost:</span>
                        <span className="font-semibold text-gray-900">
                          ¥{item.priceCny} (~${item.priceUsd})
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Landed (with Shipping):</span>
                        <span className="font-semibold text-gray-900">${item.landedCostUsd}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Etsy US Retail Price:</span>
                        <span className="font-bold text-emerald-700">${item.estimatedEtsyRetailUsd}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-gray-200/80">
                        <span>Net Profit Per Unit:</span>
                        <span className="text-emerald-700">
                          +${item.netProfitUsd} ({item.netMarginPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Why this product sells */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Why It Sells on Etsy:
                      </span>
                      {item.salesDrivers.map((driver, dIdx) => (
                        <p key={dIdx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{driver}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <Link
                      href={`/studio?preload=${encodeURIComponent(item.imageUrl)}&title=${encodeURIComponent(item.skuNameEn)}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Create Etsy Photo in Studio
                    </Link>
                    <Link
                      href={`/titles?desc=${encodeURIComponent(item.skuNameEn + ' - ' + item.skuName)}&type=${encodeURIComponent(item.category)}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                    >
                      <Type className="w-3.5 h-3.5 text-emerald-600" />
                      Generate Title & 13 Tags
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accordion: Remaining Variants on this 1688 listing */}
          {results.otherVariants.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <button
                onClick={() => setShowOthers(!showOthers)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors"
              >
                <span>Other Variants on this Listing ({results.otherVariants.length})</span>
                {showOthers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOthers && (
                <div className="space-y-2 pt-2 divide-y divide-gray-100">
                  {results.otherVariants.map((item) => (
                    <div
                      key={item.id}
                      className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Rank #{item.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800">{item.skuNameEn}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.skuName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600 flex-shrink-0">
                        <span>Cost: ¥{item.priceCny}</span>
                        <span>Retail: ${item.estimatedEtsyRetailUsd}</span>
                        <span className="font-semibold text-emerald-700">
                          Margin: {item.netMarginPct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
