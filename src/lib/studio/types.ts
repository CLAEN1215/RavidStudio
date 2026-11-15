export interface StudioOptions {
  baselineY?: number; // Target Y baseline on the woven runner (default: 805)
  includeWatermark?: boolean; // Top-right shop watermark (default: true)
  watermarkStyle?: 'ravidstudio' | 'ceramic-cosmic'; // Watermark logo style (default: 'ravidstudio')
  variantBadge?: 'none' | 'A' | 'B' | 'C' | 'D'; // Optional variation badge on top-left
  shadowIntensity?: number; // Shadow strength 0.0 to 1.0 (default: 0.75)
  horizontalAlign?: 'center' | 'left' | 'right'; // Horizontal alignment (default: center)
  customOffsetX?: number; // Custom horizontal offset in px (default: 0)
  outputFormat?: 'jpeg' | 'png'; // Output image format (default: jpeg)
  outputResolution?: 1024 | 2048; // Output resolution in px (default: 1024)
  apiKey?: string; // Photoroom API key (optional override)
  geminiApiKey?: string; // Google Gemini API key (optional)
}

export interface StudioImageItem {
  id: string;
  name: string;
  size: number;
  originalDataUrl: string;
  processedDataUrl?: string;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
  usedPhotoroom?: boolean;
  options: StudioOptions;
  processedAt?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface BatchProcessResponse {
  success: boolean;
  item: {
    id: string;
    processedDataUrl: string;
    width: number;
    height: number;
    processingTimeMs: number;
  };
  error?: string;
}
