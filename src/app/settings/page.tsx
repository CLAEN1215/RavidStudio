'use client';

import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle2, Sparkles, Sliders, Save, ExternalLink } from 'lucide-react';
import { StudioOptions } from '@/lib/studio/types';

export default function SettingsPage() {
  const [photoroomKey, setPhotoroomKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [watermarkStyle, setWatermarkStyle] = useState<'ravidstudio' | 'ceramic-cosmic'>('ravidstudio');
  const [outputResolution, setOutputResolution] = useState<1024 | 2048>(1024);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('studio_options');
      if (saved) {
        const parsed: StudioOptions = JSON.parse(saved);
        if (parsed.apiKey) setPhotoroomKey(parsed.apiKey);
        if (parsed.geminiApiKey) setGeminiKey(parsed.geminiApiKey);
        if (parsed.includeWatermark !== undefined) setIncludeWatermark(parsed.includeWatermark);
        if (parsed.watermarkStyle) setWatermarkStyle(parsed.watermarkStyle);
        if (parsed.outputResolution) setOutputResolution(parsed.outputResolution);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      const current = localStorage.getItem('studio_options');
      const existing = current ? JSON.parse(current) : {};
      const updated: StudioOptions = {
        ...existing,
        apiKey: photoroomKey.trim() || undefined,
        geminiApiKey: geminiKey.trim() || undefined,
        includeWatermark,
        watermarkStyle,
        outputResolution,
      };
      localStorage.setItem('studio_options', JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">RavidStudio Settings</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure your Photoroom & Google Gemini API credentials and default studio preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* API Integrations Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            API Integrations
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            You can input these credentials now or anytime after deploying to production.
          </p>
        </div>

        {/* 1. Photoroom API */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
              1. Photoroom API Key (Background Cutout)
            </label>
            <a
              href="https://www.photoroom.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            placeholder="Paste Live key or Sandbox key (e.g. sandbox_... or live key)"
            value={photoroomKey}
            onChange={(e) => setPhotoroomKey(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
          />
          <div className="text-[11px] text-gray-500 space-y-1">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              Removes complex 1688 backgrounds, black display boards, and Chinese text labels.
            </p>
            <p className="text-gray-400">
              💡 <strong>Free Sandbox Mode:</strong> Get up to 1,000 free test cutouts/month with your Photoroom Sandbox key or by prepending <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">sandbox_</code> to your key.
            </p>
          </div>
        </div>

        {/* 2. Google Gemini Pro AI Key */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
              2. Google Gemini Pro AI API Key (Product Analysis & SEO)
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Get Google AI Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            placeholder="Paste your Google AI Studio key (AIza...)"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
          />
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            Powers translation, keyword research, and high-converting Etsy listing title generation.
          </p>
        </div>
      </div>

      {/* Photography Defaults */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Studio Photography Defaults
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Default output resolution and branding applied to transformed images.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <label className="text-xs font-semibold text-gray-800 block">Default Output Resolution</label>
            <select
              value={outputResolution}
              onChange={(e) => setOutputResolution(parseInt(e.target.value) as 1024 | 2048)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value={1024}>1024 × 1024 (Standard Etsy 1:1)</option>
              <option value={2048}>2048 × 2048 (Ultra HD 2K)</option>
            </select>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
            <label className="text-xs font-semibold text-gray-800 block">Watermark Brand Style</label>
            <select
              value={watermarkStyle}
              onChange={(e) => setWatermarkStyle(e.target.value as 'ravidstudio' | 'ceramic-cosmic')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ravidstudio">RavidStudio Logo Emblem</option>
              <option value="ceramic-cosmic">Ceramic Cosmic Craft Logo</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
