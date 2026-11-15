'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Trophy,
  Sparkles,
  TrendingUp,
  Package,
  Camera,
  Type,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  Coffee,
  Palette,
  DollarSign,
  ShieldCheck,
  Layers,
  HelpCircle,
  Info,
  Sliders,
} from 'lucide-react';
import { FormattedRankedVariant } from '@/app/api/research/analyze-1688/route';

export default function ResearchPage() {
  const [activeInputTab, setActiveInputTab] = useState<'url' | 'pasted'>('url');
  const [listingUrl, setListingUrl] = useState('https://detail.1688.com/offer/934267247568.html');
  const [pastedText, setPastedText] = useState('');
  const [productTitleInput, setProductTitleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showKeyField, setShowKeyField] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);

  const [results, setResults] = useState<{
    url: string;
    offerId: string;
    listingTitle: string;
    totalVariantsFound: number;
    top3: FormattedRankedVariant[];
    otherVariants: FormattedRankedVariant[];
    aiSummary: string;
    isGeminiBrain?: boolean;
    marketThesis?: string;
  } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load existing Gemini key from localStorage
  useEffect(() => {
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

  const handleCopyTitle = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyAllTags = (tags: string[]) => {
    navigator.clipboard.writeText(tags.join(', '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const handleCopySingleTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedSingleTag(tag);
    setTimeout(() => setCopiedSingleTag(null), 1500);
  };

  const handleAnalyze1688 = async (overrideUrl?: string, overridePasted?: string) => {
    const urlToAnalyze = (overrideUrl !== undefined ? overrideUrl : listingUrl).trim();
    const textToAnalyze = (overridePasted !== undefined ? overridePasted : pastedText).trim();

    if (!urlToAnalyze && !textToAnalyze) {
      setErrorMessage('Please provide a 1688 listing URL or paste listing text/specifications.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadingStep(0);

    // Dynamic loading step ticker
    const timer1 = setTimeout(() => setLoadingStep(1), 1500);
    const timer2 = setTimeout(() => setLoadingStep(2), 3500);
    const timer3 = setTimeout(() => setLoadingStep(3), 6000);

    try {
      const saved = localStorage.getItem('studio_options');
      const geminiApiKey = saved ? JSON.parse(saved).geminiApiKey : undefined;

      const res = await fetch('/api/research/analyze-1688', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToAnalyze || undefined,
          pastedText: textToAnalyze || undefined,
          rawText: productTitleInput.trim() || undefined,
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
        isGeminiBrain: data.isGeminiBrain,
        marketThesis: data.marketThesis,
      });

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: unknown) {
      console.error('Failed to analyze 1688 listing:', err);
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please check the link.';
      setErrorMessage(msg);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoading(false);
    }
  };

  const winner = results?.top3[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              1688 Matcha Ceramic Set Analyzer
            </h1>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              100-Point US Market Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Predicts the #1 bestselling variant for Etsy US using <strong>market theory, consumer psychology, whisking fluid dynamics, and Etsy search algorithm mechanics</strong>—strictly independent of 1688 supplier sales volume.
          </p>
        </div>

        {/* Gemini Brain Status */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasGeminiKey ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Gemini 2.5 Flash Active</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeyField(!showKeyField)}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connect Gemini Key</span>
            </button>
          )}
        </div>
      </div>

      {/* Gemini Key Input Drawer */}
      {showKeyField && (
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Enter Google Gemini API Key:
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold underline"
            >
              Get Free Key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={() => handleSaveGeminiKey(geminiKeyInput)}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Dual Input Area: URL + Fallback Text/JSON */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveInputTab('url')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeInputTab === 'url'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Primary: 1688 Offer URL
            </button>
            <button
              type="button"
              onClick={() => setActiveInputTab('pasted')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeInputTab === 'pasted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              UI Fallback: Paste Page Text / Variant JSON
            </button>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-gray-400">
            {activeInputTab === 'url' ? 'Playwright DOM & SKU extractor' : '0% chance of CAPTCHA blocks'}
          </span>
        </div>

        {/* URL Input Tab */}
        {activeInputTab === 'url' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze1688();
            }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm flex-shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Evaluating US Market Fit...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 text-amber-300" />
                    Rank Variants for Etsy US
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-gray-400">Instant Presets:</span>
              <button
                type="button"
                onClick={() => {
                  const sampleUrl = 'https://detail.1688.com/offer/934267247568.html';
                  setListingUrl(sampleUrl);
                  handleAnalyze1688(sampleUrl);
                }}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Katakuchi Spouted Matcha Set (Offer #934267247568)
              </button>
            </div>
          </form>
        )}

        {/* Pasted Text / JSON Fallback Tab */}
        {activeInputTab === 'pasted' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze1688();
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Paste 1688 Product Text, Chinese SKU Table, or JSON Specs:
              </label>
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Example:
景德镇手工窑变带嘴抹茶碗4件套 (含茶筅+茶筅立+茶勺)
口径: 12.2cm, 高度: 7.5cm, 容量: 450ml, 釉色: 草木灰窑变釉, 配套: 片口碗+茶筅+筅立
价格: ¥38.00"
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono leading-relaxed"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400">Sample Specs:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sampleChineseText = `景德镇手工粗陶带嘴抹茶碗4件套 (带鹰嘴导流片口 + 茶筅 + 陶瓷茶筅立 + 竹茶勺)
规格参数:
口径: 12.2cm (适合W字形刷茶)
高度: 7.5cm
容量: 460ml
工艺: 景德镇手工拉胚 窑变草木灰釉
配件: 导流嘴片口碗 + 100本立竹茶筅 + 荷韵陶瓷筅立 + 楠竹茶勺
价格: 38.00元 / 套`;
                    setPastedText(sampleChineseText);
                    handleAnalyze1688(undefined, sampleChineseText);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Katakuchi 4-Piece Spouted Set Text
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 text-amber-300" />
                    Evaluate Pasted Specs
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Loading Progress Indicator */}
        {loading && (
          <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                {loadingStep === 0 && 'Extracting SKU specs, spout presence & dimensions...'}
                {loadingStep === 1 && 'Pillar 1 & 2: Testing iced latte JTBD & mobile CTR glaze texture...'}
                {loadingStep === 2 && 'Pillar 3: Matching Japandi & sage green color psychology...'}
                {loadingStep >= 3 && 'Pillar 4: Simulating landed DDP freight & Etsy fee net profit...'}
              </span>
              <span className="text-emerald-700 font-mono">
                {loadingStep === 0 ? '25%' : loadingStep === 1 ? '50%' : loadingStep === 2 ? '75%' : '90%'}
              </span>
            </div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{
                  width: loadingStep === 0 ? '25%' : loadingStep === 1 ? '50%' : loadingStep === 2 ? '75%' : '90%',
                }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ── RESULTS SHOWCASE ─────────────────────────────────────────────── */}
      {results && winner && (
        <div ref={resultsRef} className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Header Summary Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Evaluated {results.totalVariantsFound} Factory Variants strictly via 100-Point US Market Model
              </span>
              <p className="text-sm sm:text-base font-bold text-gray-900">{results.listingTitle}</p>
              <p className="text-xs text-emerald-950/80 max-w-3xl leading-relaxed mt-0.5">
                {results.marketThesis}
              </p>
            </div>
          </div>

          {/* ── #1 PREDICTED BESTSELLER CARD (GOLD HERO) ──────────────────── */}
          <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-xl overflow-hidden ring-4 ring-amber-400/10">
            {/* Top Gold Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-amber-950">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥇</span>
                <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                  #1 PREDICTED BESTSELLER ON ETSY US
                </span>
                <span className="bg-amber-950/15 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Top Algorithmic Pick
                </span>
              </div>
              <div className="flex items-center gap-2 bg-amber-950 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Overall Score: {winner.opportunityScore}/100</span>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              {/* Product Info & Financial Economics */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <img
                  src={winner.imageUrl}
                  alt={winner.skuNameEn}
                  className="w-full lg:w-48 h-48 rounded-2xl object-cover border border-amber-200 bg-amber-50/40 flex-shrink-0 shadow-sm"
                />

                <div className="flex-1 space-y-3 min-w-0 w-full">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                      {winner.skuNameEn}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">{winner.skuName}</p>
                  </div>

                  {/* Economics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">1688 RMB Cost</span>
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        ¥{winner.priceCny} <span className="text-[10px] text-gray-500 font-normal">(~${winner.priceUsd})</span>
                      </span>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Landed DDP Air</span>
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        ${winner.landedCostUsd} <span className="text-[10px] text-gray-500 font-normal">(+$7.50 air)</span>
                      </span>
                    </div>

                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block">Etsy US Sweet Spot</span>
                      <span className="text-xs sm:text-sm font-black text-amber-900">
                        ${winner.estimatedEtsyRetailUsd} USD
                      </span>
                    </div>

                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Net Margin / Unit</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-700">
                        +${winner.netProfitUsd} <span className="text-[10px]">({winner.netMarginPct}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Why #1 Wins Thesis */}
                  <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
                    <span className="text-[10px] font-extrabold text-amber-950 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Theoretical & Algorithmic Winning Rationale:
                    </span>
                    <p className="text-xs text-amber-950/90 leading-relaxed">
                      {winner.winningRationale}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 4-PILLAR 100-POINT ALGORITHMIC BREAKDOWN ─────────────── */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  100-Point Scoring Breakdown by Theoretical Pillar:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pillar 1: US Consumer Behavior & Ergonomics */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-900">
                          1. US Consumer Behavior & JTBD
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {winner.pillars.consumerBehavior.score} / 30 pts
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Pouring Spout (Katakuchi) (+{winner.pillars.consumerBehavior.jtbdSpoutScore} pts):</strong> Solves the #1 US consumer job-to-be-done: transferring whisked matcha into tall iced milk glasses with zero counter drips.
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Whisking Dynamics (+{winner.pillars.consumerBehavior.whiskingErgonomicsScore} pts):</strong> {winner.pillars.consumerBehavior.diameterCm} cm bowl diameter + curved vertical walls allow vigorous &quot;W&quot; figure-eight bamboo whisking without rim splashing.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2: Etsy Search Algorithm & CTR Mechanics */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-900">
                          2. Etsy Search Algorithm & CTR
                        </span>
                      </div>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {winner.pillars.algorithmCTR.score} / 30 pts
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Mobile Visual Pop (+{winner.pillars.algorithmCTR.visualPopScore} pts):</strong> High-contrast tactile {winner.pillars.algorithmCTR.glazeStyle} pops in Etsy mobile search grids against sterile white competitors.
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Curated Bundle AOV (+{winner.pillars.algorithmCTR.bundleAOVScore} pts):</strong> {winner.pillars.algorithmCTR.bundlePieces}-piece gift set triggers gift-giver perceived value, boosting CVR and search momentum over single bowls.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 3: US Color Psychology & Aesthetic Trend Fit */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-gray-900">
                          3. US Color Psychology & Trend Fit
                        </span>
                      </div>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {winner.pillars.aestheticTrend.score} / 20 pts
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 pt-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">{winner.pillars.aestheticTrend.trendName} (+{winner.pillars.aestheticTrend.score} pts):</strong> Aligns with modern US Japandi/minimalist cafe counter decor and warm neutral kitchen palettes.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 4: Unit Economics & Etsy Creativity Standards */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-900">
                          4. Unit Economics & Etsy Policy
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {winner.pillars.unitEconomics.score} / 20 pts
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 pt-1 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Price-Quality Sweet Spot (+{winner.pillars.unitEconomics.priceSignalingScore} pts):</strong> ${winner.pillars.unitEconomics.suggestedRetailUsd} USD retail price yields {winner.pillars.unitEconomics.netMarginPct}% net margin after DDP freight (${winner.pillars.unitEconomics.ddpFreightUsd}) and Etsy fees (~9.5% + $0.45).
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-gray-900">Creativity Standards (+{winner.pillars.unitEconomics.etsyComplianceScore} pts):</strong> Complies as a custom-curated gift bundle (ceramic set paired with custom US brewing guide & branded cloth).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ETSY US SEO TITLE & 13 TAGS ──────────────────────────── */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-emerald-600" />
                      Optimized Etsy US SEO Title:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTitle(winner.etsyTitle)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      {copiedTitle ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 bg-white p-3 rounded-xl border border-gray-200 font-sans leading-snug">
                    {winner.etsyTitle}
                  </p>
                </div>

                {/* 13 Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      13 High-Converting Etsy Search Tags (Click to Copy):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAllTags(winner.etsyTags)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      {copiedTags ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>All 13 Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy All 13 Tags</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {winner.etsyTags.map((tag, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => handleCopySingleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          copiedSingleTag === tag
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                        }`}
                      >
                        <span>{tag}</span>
                        {copiedSingleTag === tag ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-40" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/studio?preload=${encodeURIComponent(winner.imageUrl)}&title=${encodeURIComponent(winner.skuNameEn)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Send #1 Winner to Photo Studio (Transform to Etsy Standard)</span>
                </Link>

                <Link
                  href={`/titles?desc=${encodeURIComponent(winner.skuNameEn + ' - ' + winner.skuName)}&type=Complete Set`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors border border-gray-200 cursor-pointer"
                >
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>Open in Title & SEO Suite</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ── RUNNER-UP PRODUCTS (#2 and #3) ────────────────────────────── */}
          {results.top3.length > 1 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gray-400" />
                Runner-Up Variants (#2 &amp; #3 Ranked)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {results.top3.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {item.salesChanceBadge}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Score {item.opportunityScore}/100
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={item.imageUrl}
                          alt={item.skuNameEn}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                            {item.skuNameEn}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                            {item.skuName}
                          </p>
                        </div>
                      </div>

                      {/* Economics */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>1688 Cost:</span>
                          <span className="font-semibold text-gray-900">¥{item.priceCny} (~${item.priceUsd})</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Landed DDP Air:</span>
                          <span className="font-semibold text-gray-900">${item.landedCostUsd}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Etsy US Retail:</span>
                          <span className="font-bold text-emerald-700">${item.estimatedEtsyRetailUsd}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-gray-200">
                          <span>Net Profit / Unit:</span>
                          <span className="text-emerald-700">+${item.netProfitUsd} ({item.netMarginPct}%)</span>
                        </div>
                      </div>

                      {/* Pillar Highlights */}
                      <div className="space-y-1 text-xs text-gray-600">
                        <p className="text-[11px] text-gray-700 leading-relaxed">
                          {item.winningRationale}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                      <Link
                        href={`/studio?preload=${encodeURIComponent(item.imageUrl)}&title=${encodeURIComponent(item.skuNameEn)}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Create Photo
                      </Link>
                      <Link
                        href={`/titles?desc=${encodeURIComponent(item.skuNameEn + ' - ' + item.skuName)}&type=${encodeURIComponent(item.category)}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                      >
                        <Type className="w-3.5 h-3.5 text-emerald-600" />
                        SEO
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REMAINING VARIANTS ACCORDION ─────────────────────────────── */}
          {results.otherVariants.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowOthers(!showOthers)}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900 transition-colors cursor-pointer"
              >
                <span>Other Variants on this 1688 Listing ({results.otherVariants.length})</span>
                {showOthers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOthers && (
                <div className="space-y-2 pt-2 divide-y divide-gray-100">
                  {results.otherVariants.map((item) => (
                    <div
                      key={item.id}
                      className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                        <span className="text-gray-400 font-mono text-[11px]">
                          Score: {item.opportunityScore}/100
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