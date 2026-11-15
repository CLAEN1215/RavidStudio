/**
 * 1688 Product URL Analyzer
 * Uses Apify to scrape 1688 product data, with a manual fallback.
 * Never bypasses authentication or anti-bot protections.
 */

import type { SupplierProduct } from '@/types';
import { extractOfferId } from '@/lib/utils';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = 'apify~1688-product-scraper'; // May need to be updated based on available actors

export interface ExtractionResult {
  success: boolean;
  product: Partial<SupplierProduct>;
  error?: string;
  method: 'APIFY' | 'MANUAL' | 'PARTIAL';
}

export async function extract1688Product(url: string): Promise<ExtractionResult> {
  const offerId = extractOfferId(url);

  // Attempt Apify extraction if token is configured
  if (APIFY_TOKEN) {
    try {
      const result = await extractViaApify(url, offerId);
      if (result.success) return result;
    } catch (err) {
      console.error('[1688 Extractor] Apify failed:', err);
    }
  }

  // Return partial result with what we can extract from the URL
  return extractFromUrl(url, offerId);
}

async function extractViaApify(url: string, offerId: string | null): Promise<ExtractionResult> {
  if (!APIFY_TOKEN) throw new Error('No Apify token configured');

  // Try to find a suitable 1688 actor
  // We use the Apify API to run an actor and wait for the result
  const actorRunUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(APIFY_ACTOR_ID)}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60`;

  const response = await fetch(actorRunUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url }],
      maxItems: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Apify returned empty dataset');
  }

  const item = data[0];

  // Map Apify response to our SupplierProduct structure
  // Field names may vary depending on the actual actor used
  const product: Partial<SupplierProduct> = {
    source_url: url,
    offer_id: offerId || undefined,
    name_cn: item.title || item.name || item.productName || null,
    name_en: null, // Will be translated by Gemini
    main_image_url: item.mainImage || item.coverImage || item.imageUrl || null,
    additional_images: item.images || item.galleryImages || [],
    price_cny: parseFloat(item.price || item.priceMin || '0') || null,
    price_usd: null, // Will be calculated
    min_order_qty: parseInt(item.minOrder || item.minOrderQuantity || '1', 10) || 1,
    materials: item.materials ? [item.materials] : null,
    dimensions: item.dimensions || null,
    weight: item.weight || null,
    supplier_name: item.shopName || item.sellerName || null,
    supplier_rating: parseFloat(item.shopRating || '0') || null,
    variants: item.skuList || item.variants || [],
    colors: item.colors || [],
    specifications: item.attributes || item.specifications || {},
    extraction_method: 'APIFY',
    extraction_status: 'SUCCESS',
  };

  return { success: true, product, method: 'APIFY' };
}

function extractFromUrl(url: string, offerId: string | null): ExtractionResult {
  // Extract what we can from the URL itself
  const product: Partial<SupplierProduct> = {
    source_url: url,
    offer_id: offerId || undefined,
    extraction_method: 'MANUAL',
    extraction_status: 'PARTIAL',
    extraction_error: APIFY_TOKEN
      ? 'Automatic extraction failed. Please enter product details manually or upload screenshots.'
      : 'Apify API token not configured. Please enter product details manually or configure Apify integration in Settings.',
  };

  return {
    success: false,
    product,
    error: product.extraction_error ?? undefined,
    method: 'MANUAL',
  };
}

// ─── Exchange Rate Helper ──────────────────────────────────────────────────

export async function fetchCNYtoUSDRate(): Promise<number | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  try {
    if (apiKey) {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/CNY/USD`);
      if (res.ok) {
        const data = await res.json();
        return data.conversion_rate ?? null;
      }
    }

    // Fallback: use Open Exchange Rates (no key needed for some endpoints)
    const res = await fetch('https://open.er-api.com/v6/latest/CNY');
    if (res.ok) {
      const data = await res.json();
      return data.rates?.USD ?? null;
    }
  } catch (err) {
    console.error('[Exchange Rate] Failed to fetch rate:', err);
  }

  return null;
}
