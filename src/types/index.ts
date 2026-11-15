// Application-wide TypeScript types

export type RecommendationLabel =
  | 'STRONG_OPPORTUNITY'
  | 'WORTH_INVESTIGATING'
  | 'LOW_PRIORITY'
  | 'NOT_RECOMMENDED'
  | 'INSUFFICIENT_DATA';

export type ComplianceStatus =
  | 'POTENTIALLY_ELIGIBLE'
  | 'REQUIRES_MANUAL_VERIFICATION'
  | 'NOT_ELIGIBLE';

export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'ESTIMATED' | 'AI_INTERPRETED';

// ─── Product / Supplier ────────────────────────────────────────────────────

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface SupplierProduct {
  id?: string;
  source_url: string;
  offer_id?: string;
  name_cn?: string | null;
  name_en?: string | null;
  main_image_url?: string | null;
  additional_images?: string[];
  price_cny?: number | null;
  price_usd?: number | null;
  min_order_qty?: number | null;
  materials?: string[] | null;
  dimensions?: string | null;
  weight?: string | null;
  packaging?: string | null;
  variants?: ProductVariant[];
  colors?: string[];
  specifications?: Record<string, string>;
  supplier_name?: string | null;
  supplier_rating?: number | null;
  extraction_method: 'APIFY' | 'MANUAL' | 'PARTIAL';
  extraction_status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  extraction_error?: string | null;
  created_at?: string;
}

// ─── Profitability ─────────────────────────────────────────────────────────

export interface FulfillmentSettings {
  cny_to_usd_rate: number;
  china_domestic_shipping_usd: number;
  sourcing_agent_fee_pct: number;
  international_shipping_usd: number;
  packaging_cost_usd: number;
  customs_duty_pct: number;
  etsy_listing_fee_usd: number;
  etsy_transaction_fee_pct: number;
  etsy_payment_processing_pct: number;
  advertising_cost_usd: number;
  damage_refund_pct: number;
  target_margin_pct: number;
}

export const DEFAULT_FULFILLMENT_SETTINGS: FulfillmentSettings = {
  cny_to_usd_rate: 0.138,
  china_domestic_shipping_usd: 1.5,
  sourcing_agent_fee_pct: 6,
  international_shipping_usd: 4.5,
  packaging_cost_usd: 1.0,
  customs_duty_pct: 0,
  etsy_listing_fee_usd: 0.20,
  etsy_transaction_fee_pct: 6.5,
  etsy_payment_processing_pct: 3.0,
  advertising_cost_usd: 0,
  damage_refund_pct: 2,
  target_margin_pct: 35,
};

export interface ProfitabilityResult {
  supplier_cost_usd: number;
  china_domestic_shipping: number;
  sourcing_agent_fee: number;
  international_shipping: number;
  packaging_cost: number;
  customs_duty: number;
  total_landed_cost: number;
  etsy_listing_fee: number;
  etsy_transaction_fee: number;
  etsy_payment_processing: number;
  advertising_cost: number;
  damage_refund_allowance: number;
  total_fees_and_costs: number;
  suggested_selling_price: number;
  estimated_net_profit: number;
  net_profit_margin_pct: number;
  return_on_cost_pct: number;
  break_even_price: number;
  max_supplier_price_at_target_margin: number;
  meets_target_margin: boolean;
  reference_price_config?: string | null;
}

// ─── Reference Prices ─────────────────────────────────────────────────────

export interface ReferencePriceConfig {
  id?: string;
  config_name: string;
  retail_price_usd: number;
  description?: string;
  is_active: boolean;
}

export const DEFAULT_REFERENCE_PRICES: ReferencePriceConfig[] = [
  { config_name: 'Tea Whisk Stand', retail_price_usd: 23.99, is_active: true, description: 'Single tea whisk stand / holder' },
  { config_name: 'Matcha Bowl', retail_price_usd: 29.99, is_active: true, description: 'Single ceramic matcha bowl' },
  { config_name: 'Matcha Bowl + Tea Whisk Stand', retail_price_usd: 39.99, is_active: true, description: 'Bundle: bowl + whisk stand' },
  { config_name: 'Four-Piece Set', retail_price_usd: 49.99, is_active: true, description: 'Complete 4-piece matcha tea set' },
];

// ─── Opportunity Scoring ───────────────────────────────────────────────────

export interface ScoreBreakdown {
  profit_potential: number;        // 0-30
  market_demand: number;           // 0-25
  competition_opportunity: number; // 0-15
  product_uniqueness: number;      // 0-15
  supplier_reliability: number;    // 0-10
  shipping_damage_risk: number;    // 0-5
  total: number;                   // 0-100
}

export interface OpportunityScore {
  score: ScoreBreakdown;
  recommendation: RecommendationLabel;
  confidence: DataConfidence;
  explanation: string;
  strengths: string[];
  risks: string[];
}

// ─── Market Research ──────────────────────────────────────────────────────

export interface CompetitorListing {
  title: string;
  price_usd: number;
  shop_name?: string;
  url?: string;
  image_url?: string;
  num_sales?: number | null;
  num_reviews?: number | null;
  is_estimated?: boolean;
}

export interface MarketResearch {
  demand_assessment: string;
  demand_confidence: DataConfidence;
  competition_assessment: string;
  competitor_price_min?: number | null;
  competitor_price_max?: number | null;
  competitor_price_avg?: number | null;
  competitor_listings: CompetitorListing[];
  comparable_listing_count?: number | null;
  keyword_opportunities: string[];
  differentiation_opportunities: string[];
  market_risks: string[];
  seasonal_opportunities: string[];
  overall_confidence: DataConfidence;
  research_date: string;
  sources_used: string[];
  niche_fit_assessment: string;
}

// ─── Etsy Title Generation ────────────────────────────────────────────────

export interface TitleKeywordBreakdown {
  primary_keyword: string;
  supporting_keywords: string[];
  style_terms: string[];
  product_type: string;
  estimated_seo_relevance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GeneratedTitle {
  title: string;
  character_count: number;
  keyword_breakdown: TitleKeywordBreakdown;
  rationale: string;
  style_match_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ─── Title Reference (Knowledge Base) ─────────────────────────────────────

export interface TitleReference {
  id?: string;
  title: string;
  is_preferred: boolean;
  notes?: string;
  created_at?: string;
}

// ─── Compliance ───────────────────────────────────────────────────────────

export interface ComplianceAssessment {
  status: ComplianceStatus;
  reasoning: string;
  applicable_etsy_category?: string;
  action_required?: string;
  policy_links: Array<{ label: string; url: string }>;
}

// ─── Full Product Report ──────────────────────────────────────────────────

export interface ProductReport {
  id?: string;
  supplier_product: SupplierProduct;
  market_research?: MarketResearch | null;
  profitability?: ProfitabilityResult | null;
  opportunity_score?: OpportunityScore | null;
  compliance?: ComplianceAssessment | null;
  generated_titles?: GeneratedTitle[];
  gemini_summary?: string | null;
  is_saved: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Gemini API structured responses ──────────────────────────────────────

export interface GeminiProductAnalysis {
  name_en: string;
  materials: string[];
  product_type: string;
  design_style: string[];
  colors: string[];
  niche_categories: string[];
  etsy_suitability: string;
  key_selling_points: string[];
  potential_configurations: string[];
  image_quality_assessment: string;
}

export interface GeminiMarketInterpretation {
  demand_assessment: string;
  competition_assessment: string;
  niche_fit_assessment: string;
  keyword_opportunities: string[];
  differentiation_opportunities: string[];
  market_risks: string[];
  seasonal_opportunities: string[];
  recommended_price_range_min: number | null;
  recommended_price_range_max: number | null;
}
