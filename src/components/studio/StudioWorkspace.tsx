'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Trash2,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Image as ImageIcon,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Loader2,
  ExternalLink,
  Key,
} from 'lucide-react';
import JSZip from 'jszip';
import { StudioImageItem, StudioOptions } from '@/lib/studio/types';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { StudioSettingsModal } from './StudioSettingsModal';
import { ReferenceComparisonModal } from './ReferenceComparisonModal';

export function StudioWorkspace() {
  const [items, setItems] = useState<StudioImageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPhotoroomKeyInput, setShowPhotoroomKeyInput] = useState(false);
  const [photoroomKeyInput, setPhotoroomKeyInput] = useState('');

  // Global settings
  const [globalOptions, setGlobalOptions] = useState<StudioOptions>({
    baselineY: 805,
    includeWatermark: true,
    variantBadge: 'none',
    shadowIntensity: 0.75,
    outputFormat: 'jpeg',
    outputResolution: 1024,
    apiKey: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key & settings from localStorage & handle URL preloading
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studio_options');
      if (saved) {
        setGlobalOptions((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }

      // Check if arriving with a preloaded variant from Research
      const params = new URLSearchParams(window.location.search);
      const preload = params.get('preload');
      const title = params.get('title');
      if (preload) {
        const id = 'pre_' + Math.random().toString(36).substring(2, 9);
        setItems([
          {
            id,
            name: title ? decodeURIComponent(title) : '1688 Winner Product',
            size: 150000,
            originalDataUrl: decodeURIComponent(preload),
            status: 'idle',
            options: { ...globalOptions },
          },
        ]);
        setSelectedItemId(id);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateOptions = (updated: Partial<StudioOptions>) => {
    const next = { ...globalOptions, ...updated };
    setGlobalOptions(next);
    try {
      localStorage.setItem('studio_options', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Add files to queue
  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: StudioImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      const id = 'img_' + Math.random().toString(36).substring(2, 9);

      reader.onload = (e) => {
        const originalDataUrl = e.target?.result as string;
        setItems((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            originalDataUrl,
            status: 'idle',
            options: { ...globalOptions },
          },
        ]);
        setSelectedItemId((prev) => (prev ? prev : id));
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToQueue(e.dataTransfer.files);
      }
    },
    [globalOptions]
  );

  // Load sample supplier photos for immediate 1-click test
  const handleLoadSamples = async () => {
    try {
      const res = await fetch('/api/studio/test-samples');
      const data = await res.json();
      if (data.samples) {
        const loadedItems: StudioImageItem[] = [];
        for (const sample of data.samples) {
          const id = 'sample_' + Math.random().toString(36).substring(2, 9);
          loadedItems.push({
            id,
            name: sample.filename,
            size: 150000,
            originalDataUrl: sample.url,
            status: 'idle',
            options: { ...globalOptions },
          });
        }
        setItems((prev) => [...prev, ...loadedItems]);
        if (loadedItems.length > 0) {
          setSelectedItemId(loadedItems[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load sample products:', err);
    }
  };

  // Process a single item
  const processItem = async (item: StudioImageItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'processing', error: undefined } : i))
    );

    try {
      const payload = {
        image: item.originalDataUrl,
        filename: item.name,
        options: {
          ...item.options,
          apiKey: globalOptions.apiKey || undefined,
        },
      };

      const res = await fetch('/api/studio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process image');
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                processedDataUrl: data.processedDataUrl,
                dimensions: { width: data.width, height: data.height },
                processedAt: new Date().toLocaleTimeString(),
                usedPhotoroom: data.usedPhotoroom,
              }
            : i
        )
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown processing error';
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: msg } : i))
      );
    }
  };

  // Process all queue items
  const handleProcessAll = async () => {
    setIsProcessingAll(true);
    const uncompleted = items.filter((i) => i.status !== 'completed');

    for (const item of uncompleted) {
      await processItem(item);
    }
    setIsProcessingAll(false);
  };

  // Download single image
  const handleDownloadSingle = (item: StudioImageItem) => {
    if (!item.processedDataUrl) return;
    const link = document.createElement('a');
    link.href = item.processedDataUrl;
    const ext = item.options.outputFormat === 'png' ? 'png' : 'jpg';
    link.download = `${item.name.replace(/\.[^/.]+$/, '')}-etsy-listing.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk ZIP download
  const handleDownloadZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed' && i.processedDataUrl);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('etsy-product-listings');

      for (const item of completedItems) {
        if (!item.processedDataUrl) continue;
        const base64Data = item.processedDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const ext = item.options.outputFormat === 'png' ? 'png' : 'jpg';
        const cleanName = `${item.name.replace(/\.[^/.]+$/, '')}-etsy-standard.${ext}`;
        folder?.file(cleanName, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etsy-listings-batch-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Studio Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F7F7F4] border border-gray-200/80 flex items-center justify-center p-1.5 shadow-sm flex-shrink-0">
            <img
              src="/brand/ravidstudio-icon.png"
              alt="RavidStudio Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                RAVID<span className="font-light text-gray-600">STUDIO</span>
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Transform supplier photos into your shop's established photography standard with 1 click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReferencesOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
            View Etsy References
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Studio Settings
          </button>
        </div>
      </div>

      {/* Photoroom API Status & Quick Key Bar */}
      {globalOptions.apiKey ? (
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Photoroom Studio Cutout AI Connected
              </span>
              <p className="text-[11px] text-emerald-800/80">
                Studio-grade background segmentation active. All black cards, tea boards, and Chinese text will be cleanly stripped.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setPhotoroomKeyInput(globalOptions.apiKey || '');
              setShowPhotoroomKeyInput(!showPhotoroomKeyInput);
            }}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline flex-shrink-0 ml-3"
          >
            {showPhotoroomKeyInput ? 'Close' : 'Update Key'}
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  Background Cutout Engine: Basic Local Fallback Mode
                </span>
                <p className="text-[11px] text-amber-900/80">
                  Photos with dark cards or tea trays (like 1688 spec cards) require a Photoroom API key for clean edge isolation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowPhotoroomKeyInput(!showPhotoroomKeyInput)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-200/70 hover:bg-amber-200 text-amber-950 rounded-xl transition-colors border border-amber-300/80 cursor-pointer"
              >
                {showPhotoroomKeyInput ? 'Hide Input' : '⚡ Connect Photoroom Key'}
              </button>
              <a
                href="https://www.photoroom.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 text-xs font-medium text-amber-900 hover:underline flex items-center gap-1"
              >
                Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {showPhotoroomKeyInput && (
            <div className="p-3.5 bg-white/90 backdrop-blur-xs rounded-xl border border-amber-200 space-y-2 pt-2 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  placeholder="Paste Live or Sandbox key (e.g. sandbox_... or live key)"
                  value={photoroomKeyInput}
                  onChange={(e) => setPhotoroomKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={() => {
                    if (photoroomKeyInput.trim()) {
                      handleUpdateOptions({ apiKey: photoroomKeyInput.trim() });
                      setShowPhotoroomKeyInput(false);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Save & Activate
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                💡 <strong>Sandbox Testing:</strong> Photoroom gives up to <strong>1,000 free test calls/month</strong>. Use your Sandbox key from your Photoroom dashboard, or prefix your key with <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">sandbox_</code>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Area & Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-600 bg-emerald-50/60 scale-[0.99]'
                : 'border-gray-200 bg-white hover:border-emerald-400 hover:bg-gray-50/50'
            } shadow-sm`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && addFilesToQueue(e.target.files)}
            />
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Upload Supplier Product Photographs
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Drag & drop multiple files, or click to browse (JPG, PNG, WEBP)
            </p>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
              <span className="text-[11px] text-gray-400">Quick Test:</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSamples();
                }}
                className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200/60"
              >
                Load Sample Supplier Photos
              </button>
            </div>
          </div>

          {/* Queue Header & Actions */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Processing Queue ({items.length})
                </span>
                <span className="text-emerald-700 font-medium">
                  {completedCount} of {items.length} Ready
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleProcessAll}
                  disabled={isProcessingAll || items.every((i) => i.status === 'completed')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isProcessingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing Pipeline...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Process All
                    </>
                  )}
                </button>

                {completedCount > 0 && (
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isZipping ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileArchive className="w-3.5 h-3.5" />
                    )}
                    ZIP ({completedCount})
                  </button>
                )}

                <button
                  onClick={() => setItems([])}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors border border-gray-200"
                  title="Clear Queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Queue List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const isSelected = item.id === selectedItem?.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.processedDataUrl || item.originalDataUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-white flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.status === 'completed' && (
                              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            )}
                            {item.status === 'processing' && (
                              <span className="text-[10px] text-amber-700 flex items-center gap-0.5 font-medium">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                              </span>
                            )}
                            {item.status === 'idle' && (
                              <span className="text-[10px] text-gray-400">Waiting</span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-[10px] text-red-600 flex items-center gap-0.5 font-medium">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.status !== 'completed' && item.status !== 'processing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              processItem(item);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/60"
                          >
                            Process
                          </button>
                        )}
                        {item.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(item);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Before-and-After Preview & Detail (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 truncate max-w-sm">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedItem.processedDataUrl
                      ? 'Interactive Before & After Comparison'
                      : 'Original Supplier Photograph'}
                  </p>
                </div>

                {selectedItem.processedDataUrl && (
                  <button
                    onClick={() => handleDownloadSingle(selectedItem)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Etsy Image
                  </button>
                )}
              </div>

              {/* Viewer Stage */}
              <div className="w-full max-w-xl mx-auto">
                {selectedItem.processedDataUrl ? (
                  <BeforeAfterSlider
                    beforeUrl={selectedItem.originalDataUrl}
                    afterUrl={selectedItem.processedDataUrl}
                  />
                ) : (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <img
                      src={selectedItem.originalDataUrl}
                      alt={selectedItem.name}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
                      <Sparkles className="w-8 h-8 text-emerald-400 mb-2 animate-pulse" />
                      <p className="text-sm font-semibold">Ready for Transformation</p>
                      <p className="text-xs text-gray-200 mt-1 max-w-xs">
                        Click process to replace supplier background with your Etsy listing standard.
                      </p>
                      <button
                        onClick={() => processItem(selectedItem)}
                        className="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Process This Product
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              {selectedItem.processedDataUrl && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-2.5 rounded-xl bg-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                        Canvas Size
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {selectedItem.dimensions?.width || 1024} × {selectedItem.dimensions?.height || 1024}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                        Shadow Physics
                      </span>
                      <span className="text-xs font-bold text-gray-800">Dual Occlusion</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                        Watermark
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {selectedItem.options.includeWatermark ? 'RavidStudio' : 'None'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                        Cutout Engine
                      </span>
                      <span
                        className={`text-xs font-bold flex items-center justify-center gap-1 ${
                          selectedItem.usedPhotoroom ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {selectedItem.usedPhotoroom ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Photoroom AI
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Basic Fallback
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Fallback Warning Box */}
                  {!selectedItem.usedPhotoroom && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          Notice dark cards or tea tray borders? Paste your free Photoroom API key above for 100% clean cutout.
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPhotoroomKeyInput(true)}
                        className="text-[11px] font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors flex-shrink-0 ml-2"
                      >
                        Paste Key
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800">No Image Selected</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Upload supplier product photographs or click &quot;Load Sample Supplier Photos&quot; to test the studio pipeline immediately.
              </p>
              <button
                onClick={handleLoadSamples}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load 3 Sample Supplier Products
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={globalOptions}
        onChangeOptions={handleUpdateOptions}
      />

      <ReferenceComparisonModal
        isOpen={isReferencesOpen}
        onClose={() => setIsReferencesOpen(false)}
      />
    </div>
  );
}
