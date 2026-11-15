/**
 * POST /api/analyze
 * Main product analysis endpoint.
 * Orchestrates: extraction → Gemini analysis → market research → profitability → scoring → titles
 */

import { NextRequest, NextResponse } from 'next/server';
import { extract1688Product, fetchCNYtoUSDRate } from '@/lib/extractor';
import { analyzeProductData, generateEtsyTitles, assessEtsyCompliance, generateProductSummary } from '@/lib/gemini';
import { runMarketResearch } from '@/lib/market-research';
import { calculateProfitability } from '@/lib/profitability';
import { calculateOpportunityScore } from '@/lib/scoring';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { is1688Url } from '@/lib/utils';
import type { FulfillmentSettings, SupplierProduct } from '@/types';
import { DEFAULT_FULFILLMENT_SETTINGS } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, manualData } = body as {
      url?: string;
      manualData?: Partial<SupplierProduct>;
    };

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!is1688Url(url)) {
      return NextResponse.json({ error: 'Please provide a valid 1688.com product URL' }, { status: 400 });
    }

    // ── 1. Load settings from database ────────────────────────────────────
    let settings: FulfillmentSettings = DEFAULT_FULFILLMENT_SETTINGS;
    let referencePrices;

    try {
      const { data: settingsRow } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'fulfillment_defaults')
        .single();
      if (settingsRow?.value) settings = settingsRow.value as FulfillmentSettings;

      const { data: priceRows } = await supabaseAdmin
        .from('reference_prices')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (priceRows) referencePrices = priceRows;
    } catch {
      console.warn('[Analyze] Could not load settings from DB, using defaults');
    }

    // ── 2. Fetch live exchange rate ────────────────────────────────────────
    const liveRate = await fetchCNYtoUSDRate();
    if (liveRate) settings = { ...settings, cny_to_usd_rate: liveRate };

    // ── 3. Extract product data from 1688 ─────────────────────────────────
    const extraction = await extract1688Product(url);

    // Merge with any manual data provided
    let productData: Partial<SupplierProduct> = {
      ...extraction.product,
      ...manualData,
    };

    // ── 4. Gemini product analysis ────────────────────────────────────────
    const descriptionForGemini = [
      productData.name_cn,
      productData.name_en,
      productData.materials?.join(', '),
      productData.specifications ? JSON.stringify(productData.specifications) : '',
    ].filter(Boolean).join('\n');

    let geminiAnalysis;
    if (descriptionForGemini.trim()) {
      geminiAnalysis = await analyzeProductData(
        descriptionForGemini,
        productData.price_cny ? `CNY ${productData.price_cny}` : undefined,
      );

      // Apply Gemini enrichment to product data
      if (!productData.name_en && geminiAnalysis.name_en) {
        productData.name_en = geminiAnalysis.name_en;
      }
      if (!productData.materials?.length && geminiAnalysis.materials?.length) {
        productData.materials = geminiAnalysis.materials;
      }
      if (!productData.colors?.length && geminiAnalysis.colors?.length) {
        productData.colors = geminiAnalysis.colors;
      }
    }

    // Apply USD price
    if (productData.price_cny) {
      productData.price_usd = productData.price_cny * settings.cny_to_usd_rate;
    }

    // ── 5. Save product to database ────────────────────────────────────────
    let savedProductId: string | undefined;
    try {
      const { data: savedProduct, error } = await supabaseAdmin
        .from('products')
        .insert({
          source_url: url,
          offer_id: productData.offer_id,
          name_cn: productData.name_cn,
          name_en: productData.name_en,
          main_image_url: productData.main_image_url,
          additional_images: productData.additional_images || [],
          price_cny: productData.price_cny,
          price_usd: productData.price_usd,
          min_order_qty: productData.min_order_qty,
          materials: productData.materials || [],
          dimensions: productData.dimensions,
          weight: productData.weight,
          packaging: productData.packaging,
          variants: productData.variants || [],
          colors: productData.colors || [],
          specifications: productData.specifications || {},
          supplier_name: productData.supplier_name,
          supplier_rating: productData.supplier_rating,
          extraction_method: extraction.method,
          extraction_status: extraction.success ? 'SUCCESS' : 'PARTIAL',
          extraction_error: extraction.error,
        })
        .select('id')
        .single();

      if (!error && savedProduct) savedProductId = savedProduct.id;
    } catch (err) {
      console.error('[Analyze] Database save failed:', err);
    }

    // ── 6. Market research ─────────────────────────────────────────────────
    const keywords = [
      ...(geminiAnalysis?.niche_categories || []),
      'matcha bowl',
      'ceramic tea set',
      'japanese tea ceremony',
    ];

    let marketResearch;
    try {
      marketResearch = await runMarketResearch(
        productData.name_en || productData.name_cn || 'ceramic matcha tea set',
        keywords,
      );

      if (savedProductId) {
        await supabaseAdmin.from('market_research').insert({
          product_id: savedProductId,
          demand_assessment: marketResearch.demand_assessment,
          demand_confidence: marketResearch.demand_confidence,
          competition_assessment: marketResearch.competition_assessment,
          competitor_price_min: marketResearch.competitor_price_min,
          competitor_price_max: marketResearch.competitor_price_max,
          competitor_price_avg: marketResearch.competitor_price_avg,
          competitor_listings: marketResearch.competitor_listings,
          comparable_listing_count: marketResearch.comparable_listing_count,
          keyword_opportunities: marketResearch.keyword_opportunities,
          differentiation_opportunities: marketResearch.differentiation_opportunities,
          market_risks: marketResearch.market_risks,
          seasonal_opportunities: marketResearch.seasonal_opportunities,
          overall_confidence: marketResearch.overall_confidence,
          sources_used: marketResearch.sources_used,
          niche_fit_assessment: marketResearch.niche_fit_assessment,
        });
      }
    } catch (err) {
      console.error('[Analyze] Market research failed:', err);
    }

    // ── 7. Profitability calculation ───────────────────────────────────────
    const profitability = calculateProfitability(
      productData.price_cny,
      productData.price_usd,
      settings,
      referencePrices,
    );

    if (savedProductId) {
      try {
        await supabaseAdmin.from('profitability_calculations').insert({
          product_id: savedProductId,
          ...profitability,
          settings_snapshot: settings,
        });
      } catch (err) {
        console.error('[Analyze] Profitability save failed:', err);
      }
    }

    // ── 8. Opportunity score ────────────────────────────────────────────────
    const opportunityScore = calculateOpportunityScore({
      profitability,
      marketResearch: marketResearch || null,
      supplierProduct: productData as SupplierProduct,
      targetMarginPct: settings.target_margin_pct,
    });

    if (savedProductId) {
      try {
        await supabaseAdmin.from('opportunity_scores').insert({
          product_id: savedProductId,
          score_profit: opportunityScore.score.profit_potential,
          score_demand: opportunityScore.score.market_demand,
          score_competition: opportunityScore.score.competition_opportunity,
          score_uniqueness: opportunityScore.score.product_uniqueness,
          score_supplier: opportunityScore.score.supplier_reliability,
          score_shipping_risk: opportunityScore.score.shipping_damage_risk,
          score_total: opportunityScore.score.total,
          recommendation: opportunityScore.recommendation,
          confidence: opportunityScore.confidence,
          explanation: opportunityScore.explanation,
          strengths: opportunityScore.strengths,
          risks: opportunityScore.risks,
        });
      } catch (err) {
        console.error('[Analyze] Score save failed:', err);
      }
    }

    // ── 9. Compliance assessment ───────────────────────────────────────────
    let compliance;
    try {
      compliance = await assessEtsyCompliance(
        productData as SupplierProduct,
        geminiAnalysis,
      );

      if (savedProductId) {
        await supabaseAdmin.from('compliance_assessments').insert({
          product_id: savedProductId,
          status: compliance.status,
          reasoning: compliance.reasoning,
          applicable_category: compliance.applicable_etsy_category,
          action_required: compliance.action_required,
          policy_links: compliance.policy_links,
        });
      }
    } catch (err) {
      console.error('[Analyze] Compliance check failed:', err);
    }

    // ── 10. Title generation ────────────────────────────────────────────────
    let generatedTitles;
    try {
      const { data: titleRefs } = await supabaseAdmin
        .from('title_references')
        .select('*')
        .order('is_preferred', { ascending: false })
        .limit(10);

      if (titleRefs && titleRefs.length > 0) {
        generatedTitles = await generateEtsyTitles(
          productData as SupplierProduct,
          titleRefs,
          geminiAnalysis,
        );

        if (savedProductId && generatedTitles) {
          await supabaseAdmin.from('generated_titles').insert(
            generatedTitles.map(t => ({
              product_id: savedProductId,
              title: t.title,
              character_count: t.character_count,
              keyword_breakdown: t.keyword_breakdown,
              rationale: t.rationale,
              style_match_confidence: t.style_match_confidence,
            })),
          );
        }
      }
    } catch (err) {
      console.error('[Analyze] Title generation failed:', err);
    }

    // ── 11. AI summary ─────────────────────────────────────────────────────
    let summary;
    try {
      summary = await generateProductSummary(
        productData as SupplierProduct,
        opportunityScore,
        marketResearch || null,
      );
    } catch {
      summary = opportunityScore.explanation;
    }

    // ── 12. Record in research history ────────────────────────────────────
    if (savedProductId) {
      try {
        await supabaseAdmin.from('research_history').insert({
          product_id: savedProductId,
          source_url: url,
          product_name: productData.name_en || productData.name_cn,
          score_total: opportunityScore.score.total,
          recommendation: opportunityScore.recommendation,
        });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      success: true,
      productId: savedProductId,
      product: productData,
      extractionStatus: extraction.success ? 'SUCCESS' : 'PARTIAL',
      extractionError: extraction.error,
      geminiAnalysis,
      marketResearch,
      profitability,
      opportunityScore,
      compliance,
      generatedTitles,
      summary,
      exchangeRate: settings.cny_to_usd_rate,
    });
  } catch (error) {
    console.error('[Analyze] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
