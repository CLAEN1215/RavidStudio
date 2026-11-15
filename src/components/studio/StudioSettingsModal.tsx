'use client';

import React from 'react';
import { StudioOptions } from '@/lib/studio/types';
import { Key, Sparkles, Image as ImageIcon, Sliders, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: StudioOptions;
  onChangeOptions: (updated: Partial<StudioOptions>) => void;
}

export function StudioSettingsModal({
  isOpen,
  onClose,
  options,
  onChangeOptions,
}: StudioSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">RavidStudio Photography Settings</h3>
              <p className="text-xs text-gray-500">Fixed visual standard & API credentials</p>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* API Credentials Section */}
          <div className="space-y-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              API Integrations (Optional / Can Input After Deploy)
            </h4>

            {/* 1. Photoroom API */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  1. Photoroom API Key
                </label>
                {options.apiKey ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    Ready for key
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="Paste Photoroom key (e.g. pt_...)"
                value={options.apiKey || ''}
                onChange={(e) => onChangeOptions({ apiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-all"
              />
              <p className="text-[11px] text-gray-500">
                Removes 1688 backgrounds, black cards, and Chinese spec text.
              </p>
            </div>

            {/* 2. Google Gemini Pro AI API */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  2. Google Gemini Pro AI Key
                </label>
                {options.geminiApiKey ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    Ready for key
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="Paste Google AI Studio key (AIza...)"
                value={options.geminiApiKey || ''}
                onChange={(e) => onChangeOptions({ geminiApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition-all"
              />
              <p className="text-[11px] text-gray-500">
                Powers AI product analysis, translation, and automated Etsy title generation.
              </p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Watermark Branding */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Shop Watermark Branding
                </label>
                <p className="text-xs text-gray-500">
                  Subtle top-right emblem watermark on finished listing photo
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeWatermark ?? true}
                  onChange={(e) => onChangeOptions({ includeWatermark: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {(options.includeWatermark ?? true) && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onChangeOptions({ watermarkStyle: 'ravidstudio' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center gap-2 justify-center transition-all ${
                    (options.watermarkStyle ?? 'ravidstudio') === 'ravidstudio'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <img src="/brand/ravidstudio-icon.png" alt="" className="w-4 h-4 object-contain" />
                  RavidStudio Logo
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOptions({ watermarkStyle: 'ceramic-cosmic' })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center gap-2 justify-center transition-all ${
                    options.watermarkStyle === 'ceramic-cosmic'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Ceramic Cosmic Craft
                </button>
              </div>
            )}
          </div>

          {/* Listing Variant Badge */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              Listing Variation Badge (Top-Left)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['none', 'A', 'B', 'C', 'D'] as const).map((badge) => (
                <button
                  key={badge}
                  onClick={() => onChangeOptions({ variantBadge: badge })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    (options.variantBadge || 'none') === badge
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {badge === 'none' ? 'None' : `Variant ${badge}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Adds the authentic Etsy option circle badge (matching your listing photos A, B, C, D).
            </p>
          </div>

          {/* Shadow Intensity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-800">Contact Shadow Intensity</span>
              <span className="text-gray-500 font-mono">
                {Math.round((options.shadowIntensity ?? 0.75) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={options.shadowIntensity ?? 0.75}
              onChange={(e) => onChangeOptions({ shadowIntensity: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Output Resolution & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Export Resolution</label>
              <select
                value={options.outputResolution ?? 1024}
                onChange={(e) => onChangeOptions({ outputResolution: parseInt(e.target.value) as 1024 | 2048 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={1024}>1024 × 1024 (Standard Etsy 1:1)</option>
                <option value={2048}>2048 × 2048 (Ultra HD 2K)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Image Format</label>
              <select
                value={options.outputFormat ?? 'jpeg'}
                onChange={(e) => onChangeOptions({ outputFormat: e.target.value as 'jpeg' | 'png' })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="jpeg">JPEG (High Quality 95%)</option>
                <option value="png">PNG (Lossless 24-bit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
