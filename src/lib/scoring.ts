/**
 * Product Opportunity Scoring Engine
 * Deterministic scoring based on structured data inputs.
 * Gemini is used to interpret but not calculate scores.
 */

import type {
  ScoreBreakdown,
  OpportunityScore,
  ProfitabilityResult,
  MarketResearch,
  SupplierProduct,
  RecommendationLabel,
} from '@/types';

interface ScoringInputs {
  profitability: ProfitabilityResult | null;
  marketResearch: MarketResearch | null;
  supplierProduct: SupplierProduct;
  targetMarginPct: number;
}

export function calculateOpportunityScore(inputs: ScoringInputs): OpportunityScore {
  const { profitability, marketResearch, supplierProduct, targetMarginPct } = inputs;

  const scoreBreakdown = computeScores(inputs);
  const total = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0) - scoreBreakdown.total;
  scoreBreakdown.total = Math.round(Math.min(100, Math.max(0, total)));

  const recommendation = getRecommendation(scoreBreakdown.total, supplierProduct, profitability, marketResearch);
  const confidence = getConfidence(supplierProduct, profitability, marketResearch);

  const strengths = buildStrengths(scoreBreakdown, profitability, marketResearch);
  const risks = buildRisks(scoreBreakdown, profitability, marketResearch, supplierProduct);
  const explanation = buildExplanation(scoreBreakdown, recommendation, profitability, marketResearch);

  return {
    score: scoreBreakdown,
    recommendation,
    confidence,
    explanation,
    strengths,
    risks,
  };
}

function computeScores(inputs: ScoringInputs): ScoreBreakdown {
  const { profitability, marketResearch, supplierProduct, targetMarginPct } = inputs;

  // ── A. Profit Potential (0-30) ─────────────────────────────────────────
  let profitScore = 0;
  if (profitability && supplierProduct.price_cny != null) {
    if (profitability.meets_target_margin) {
      profitScore = 25;
      const excess = profitability.net_profit_margin_pct - targetMarginPct;
      if (excess >= 15) profitScore = 30;
      else if (excess >= 8) profitScore = 28;
    } else {
      const shortfall = targetMarginPct - profitability.net_profit_margin_pct;
      if (shortfall <= 5) profitScore = 15;
      else if (shortfall <= 10) profitScore = 10;
      else if (shortfall <= 20) profitScore = 5;
      else profitScore = 2;
    }
  } else if (supplierProduct.price_cny == null) {
    profitScore = 0; // No price data
  }

  // ── B. Market Demand (0-25) ────────────────────────────────────────────
  let demandScore = 0;
  if (marketResearch) {
    const demandText = marketResearch.demand_assessment.toLowerCase();
    if (demandText.includes('strong') || demandText.includes('high')) demandScore = 23;
    else if (demandText.includes('moderate') || demandText.includes('good')) demandScore = 18;
    else if (demandText.includes('low') || demandText.includes('weak')) demandScore = 8;
    else demandScore = 12;

    // Keyword opportunities boost
    if (marketResearch.keyword_opportunities.length >= 5) demandScore = Math.min(25, demandScore + 2);
    if (marketResearch.seasonal_opportunities.length > 0) demandScore = Math.min(25, demandScore + 1);

    // Confidence penalty
    if (marketResearch.demand_confidence === 'LOW') demandScore = Math.round(demandScore * 0.7);
    if (marketResearch.demand_confidence === 'ESTIMATED') demandScore = Math.round(demandScore * 0.85);
  } else {
    demandScore = 5; // No research performed
  }

  // ── C. Competition Opportunity (0-15) ─────────────────────────────────
  let competitionScore = 0;
  if (marketResearch) {
    const compText = marketResearch.competition_assessment.toLowerCase();
    if (compText.includes('low competition') || compText.includes('limited competition')) competitionScore = 14;
    else if (compText.includes('moderate')) competitionScore = 10;
    else if (compText.includes('high competition') || compText.includes('saturated')) competitionScore = 4;
    else competitionScore = 7;

    if (marketResearch.differentiation_opportunities.length >= 3) competitionScore = Math.min(15, competitionScore + 2);
  } else {
    competitionScore = 4;
  }

  // ── D. Product Uniqueness (0-15) ──────────────────────────────────────
  let uniquenessScore = 7; // Base score
  const nameEn = (supplierProduct.name_en || '').toLowerCase();
  const uniqueTerms = ['sakura', 'lotus', 'flower', 'floral', 'handmade', 'japanese', 'ceremonial', 'artisan'];
  const matchCount = uniqueTerms.filter(t => nameEn.includes(t)).length;
  if (matchCount >= 3) uniquenessScore = 14;
  else if (matchCount >= 2) uniquenessScore = 11;
  else if (matchCount >= 1) uniquenessScore = 9;

  // Colors and variants add uniqueness
  if ((supplierProduct.colors?.length ?? 0) >= 3) uniquenessScore = Math.min(15, uniquenessScore + 1);
  if ((supplierProduct.variants?.length ?? 0) >= 2) uniquenessScore = Math.min(15, uniquenessScore + 1);

  // ── E. Supplier Reliability (0-10) ────────────────────────────────────
  let supplierScore = 5; // Default when unknown
  if (supplierProduct.supplier_rating != null) {
    if (supplierProduct.supplier_rating >= 4.8) supplierScore = 10;
    else if (supplierProduct.supplier_rating >= 4.5) supplierScore = 8;
    else if (supplierProduct.supplier_rating >= 4.0) supplierScore = 6;
    else supplierScore = 3;
  }
  if (supplierProduct.extraction_status === 'SUCCESS') supplierScore = Math.min(10, supplierScore + 1);

  // ── F. Shipping & Damage Risk (0-5) ───────────────────────────────────
  let shippingScore = 3; // Default moderate risk for ceramics
  const materials = (supplierProduct.materials || []).join(' ').toLowerCase();
  if (materials.includes('ceramic') || materials.includes('porcelain')) {
    shippingScore = 2; // Ceramics are fragile
  } else {
    shippingScore = 4;
  }

  return {
    profit_potential: Math.min(30, Math.max(0, profitScore)),
    market_demand: Math.min(25, Math.max(0, demandScore)),
    competition_opportunity: Math.min(15, Math.max(0, competitionScore)),
    product_uniqueness: Math.min(15, Math.max(0, uniquenessScore)),
    supplier_reliability: Math.min(10, Math.max(0, supplierScore)),
    shipping_damage_risk: Math.min(5, Math.max(0, shippingScore)),
    total: 0,
  };
}

function getRecommendation(
  total: number,
  product: SupplierProduct,
  profitability: ProfitabilityResult | null,
  research: MarketResearch | null,
): RecommendationLabel {
  if (!research && !profitability && !product.price_cny) return 'INSUFFICIENT_DATA';
  if (total >= 80) return 'STRONG_OPPORTUNITY';
  if (total >= 60) return 'WORTH_INVESTIGATING';
  if (total >= 40) return 'LOW_PRIORITY';
  return 'NOT_RECOMMENDED';
}

function getConfidence(
  product: SupplierProduct,
  profitability: ProfitabilityResult | null,
  research: MarketResearch | null,
): 'HIGH' | 'MEDIUM' | 'LOW' | 'ESTIMATED' | 'AI_INTERPRETED' {
  let score = 0;
  if (product.price_cny != null) score += 2;
  if (product.name_en) score += 1;
  if (profitability) score += 2;
  if (research) score += 2;
  if ((research?.competitor_listings?.length ?? 0) > 0) score += 1;

  if (score >= 7) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  if (score >= 3) return 'ESTIMATED';
  return 'LOW';
}

function buildStrengths(
  scores: ScoreBreakdown,
  profitability: ProfitabilityResult | null,
  research: MarketResearch | null,
): string[] {
  const strengths: string[] = [];
  if (scores.profit_potential >= 22) {
    strengths.push(`Strong profit potential — ${profitability?.net_profit_margin_pct?.toFixed(1)}% estimated margin`);
  }
  if (scores.market_demand >= 18) strengths.push('Good market demand signals detected');
  if (scores.competition_opportunity >= 11) strengths.push('Low-to-moderate competition in niche');
  if (scores.product_uniqueness >= 11) strengths.push('Distinctive product design with unique style elements');
  if (scores.supplier_reliability >= 8) strengths.push('High supplier rating indicates reliable sourcing');
  if (research?.differentiation_opportunities && research.differentiation_opportunities.length > 0) {
    strengths.push('Multiple product differentiation opportunities identified');
  }
  if (research?.seasonal_opportunities && research.seasonal_opportunities.length > 0) {
    strengths.push('Seasonal gifting opportunities present');
  }
  return strengths.slice(0, 5);
}

function buildRisks(
  scores: ScoreBreakdown,
  profitability: ProfitabilityResult | null,
  research: MarketResearch | null,
  product: SupplierProduct,
): string[] {
  const risks: string[] = [];
  if (scores.profit_potential < 15) risks.push('Profit margin below target — pricing may be difficult');
  if (scores.shipping_damage_risk <= 2) risks.push('Ceramic items carry higher damage risk during international shipping');
  if (scores.competition_opportunity <= 5) risks.push('High competition in this product category');
  if (!product.price_cny) risks.push('Supplier price not available — profitability cannot be confirmed');
  if (research?.market_risks) {
    risks.push(...research.market_risks.slice(0, 2));
  }
  if (product.extraction_status !== 'SUCCESS') risks.push('Incomplete product data — manual verification recommended');
  return risks.slice(0, 5);
}

function buildExplanation(
  scores: ScoreBreakdown,
  recommendation: RecommendationLabel,
  profitability: ProfitabilityResult | null,
  research: MarketResearch | null,
): string {
  const lines: string[] = [];

  if (recommendation === 'STRONG_OPPORTUNITY') {
    lines.push(`This product scores ${scores.total}/100 and is a strong candidate for your Etsy store.`);
  } else if (recommendation === 'WORTH_INVESTIGATING') {
    lines.push(`This product scores ${scores.total}/100 and merits further investigation before committing.`);
  } else if (recommendation === 'LOW_PRIORITY') {
    lines.push(`This product scores ${scores.total}/100. It faces challenges that make it a lower priority.`);
  } else if (recommendation === 'NOT_RECOMMENDED') {
    lines.push(`This product scores ${scores.total}/100. Current data does not support adding it to your store.`);
  } else {
    lines.push(`Insufficient data to fully evaluate this product. Please provide supplier pricing and run market research.`);
  }

  if (profitability) {
    lines.push(`Profit margin is estimated at ${profitability.net_profit_margin_pct.toFixed(1)}% at the ${profitability.reference_price_config || 'reference'} price point.`);
  }

  return lines.join(' ');
}
