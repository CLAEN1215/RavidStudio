/**
 * Etsy Market Research Engine
 * Uses Etsy API (when configured) + Gemini interpretation
 * Falls back to Gemini-only research when API unavailable
 */

import type { CompetitorListing, MarketResearch } from '@/types';
import { interpretMarketData } from '@/lib/gemini';

const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_BASE_URL = 'https://openapi.etsy.com/v3';

export async function runMarketResearch(
  productName: string,
  keywords: string[],
): Promise<MarketResearch> {
  const sources: string[] = [];
  let competitorListings: CompetitorListing[] = [];
  let etsySearchContext = '';

  // ── Attempt Etsy API research ─────────────────────────────────────────
  if (ETSY_API_KEY) {
    try {
      const etsyResults = await searchEtsyListings(keywords, productName);
      if (etsyResults.listings.length > 0) {
        competitorListings = etsyResults.listings;
        etsySearchContext = etsyResults.context;
        sources.push('Etsy Open API v3');
      }
    } catch (err) {
      console.error('[Etsy Research] API search failed:', err);
      sources.push('Etsy API (failed)');
    }
  }

  // ── Gemini market interpretation ──────────────────────────────────────
  const geminiInput = competitorListings.map(l => ({
    title: l.title,
    price: l.price_usd,
  }));

  const interpretation = await interpretMarketData(productName, geminiInput, etsySearchContext);
  sources.push('Gemini AI market interpretation');

  // ── Build price stats from actual listings ─────────────────────────────
  let priceMin: number | null = null;
  let priceMax: number | null = null;
  let priceAvg: number | null = null;

  if (competitorListings.length > 0) {
    const prices = competitorListings.map(l => l.price_usd).filter(p => p > 0);
    if (prices.length > 0) {
      priceMin = Math.min(...prices);
      priceMax = Math.max(...prices);
      priceAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
    }
  } else if (interpretation.recommended_price_range_min && interpretation.recommended_price_range_max) {
    // Use Gemini estimates when no real data
    priceMin = interpretation.recommended_price_range_min;
    priceMax = interpretation.recommended_price_range_max;
    priceAvg = (priceMin + priceMax) / 2;
  }

  return {
    demand_assessment: interpretation.demand_assessment,
    demand_confidence: competitorListings.length > 0 ? 'MEDIUM' : 'AI_INTERPRETED',
    competition_assessment: interpretation.competition_assessment,
    competitor_price_min: priceMin,
    competitor_price_max: priceMax,
    competitor_price_avg: priceAvg,
    competitor_listings: competitorListings,
    comparable_listing_count: competitorListings.length > 0 ? competitorListings.length : null,
    keyword_opportunities: interpretation.keyword_opportunities,
    differentiation_opportunities: interpretation.differentiation_opportunities,
    market_risks: interpretation.market_risks,
    seasonal_opportunities: interpretation.seasonal_opportunities,
    overall_confidence: competitorListings.length > 3 ? 'MEDIUM' : 'AI_INTERPRETED',
    research_date: new Date().toISOString(),
    sources_used: sources,
    niche_fit_assessment: interpretation.niche_fit_assessment,
  };
}

async function searchEtsyListings(
  keywords: string[],
  productName: string,
): Promise<{ listings: CompetitorListing[]; context: string }> {
  const query = [...keywords, productName].slice(0, 4).join(' ');

  const params = new URLSearchParams({
    keywords: query,
    limit: '12',
    location: 'US',
    sort_on: 'score',
    language: 'en',
  });

  const response = await fetch(
    `${ETSY_BASE_URL}/application/listings/active?${params.toString()}`,
    {
      headers: {
        'x-api-key': ETSY_API_KEY!,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Etsy API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const results = data.results ?? [];

  const listings: CompetitorListing[] = results.map((item: EtsyListing) => ({
    title: item.title,
    price_usd: (item.price?.amount ?? 0) / (item.price?.divisor ?? 100),
    shop_name: item.shop_id?.toString(),
    url: item.url,
    image_url: item.images?.[0]?.url_570xN ?? null,
    num_reviews: item.num_favorers ?? null,
    is_estimated: false,
  }));

  const context = `Found ${listings.length} Etsy listings for query "${query}". Price range: $${
    Math.min(...listings.map(l => l.price_usd)).toFixed(2)
  } - $${Math.max(...listings.map(l => l.price_usd)).toFixed(2)}`;

  return { listings, context };
}

interface EtsyListing {
  title: string;
  price?: { amount: number; divisor: number };
  shop_id?: number;
  url?: string;
  images?: Array<{ url_570xN: string }>;
  num_favorers?: number;
}
