import { NextRequest, NextResponse } from 'next/server';
import { extractOfferId } from '@/lib/utils';
import { extractViaPlaywright, parsePasted1688Text, ExtractedSKU } from '@/lib/extractor';
import { scoreVariantForEtsyUS, PillarScoreBreakdown, RawVariantCandidate } from '@/lib/scoring-engine';
import { analyze1688VariantsWith100PointModel } from '@/lib/gemini';

export const maxDuration = 60; // 60s timeout for browser extraction & AI analysis

export type ScoredVariant = FormattedRankedVariant;

export interface FormattedRankedVariant {
  id: string;
  skuName: string;
  skuNameEn: string;
  category: 'Matcha Bowl' | 'Complete Set' | 'Whisk Holder' | 'Accessories';
  priceCny: number;
  priceUsd: number;
  weightGrams: number;
  shippingUsd: number;
  landedCostUsd: number;
  estimatedEtsyRetailUsd: number;
  etsyFeesUsd: number;
  netProfitUsd: number;
  netMarginPct: number;
  opportunityScore: number;
  rank: number;
  salesChanceBadge: string;
  estimatedMonthlyUnits: number;
  imageUrl: string;
  salesDrivers: string[];
  risks: string[];
  // 100-Point Pillar Breakdown
  pillars: {
    consumerBehavior: {
      score: number;
      jtbdSpoutScore: number;
      whiskingErgonomicsScore: number;
      hasSpout: boolean;
      diameterCm: number;
      rationale: string;
    };
    algorithmCTR: {
      score: number;
      visualPopScore: number;
      bundleAOVScore: number;
      glazeStyle: string;
      isBundle: boolean;
      bundlePieces: number;
      rationale: string;
    };
    aestheticTrend: {
      score: number;
      trendName: string;
      rationale: string;
    };
    unitEconomics: {
      score: number;
      priceSignalingScore: number;
      etsyComplianceScore: number;
      priceCny: number;
      priceUsd: number;
      ddpFreightUsd: number;
      landedCostUsd: number;
      suggestedRetailUsd: number;
      etsyFeesUsd: number;
      netProfitUsd: number;
      netMarginPct: number;
      rationale: string;
    };
  };
  winningRationale: string;
  etsyTitle: string;
  etsyTags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, geminiApiKey, rawText, pastedText } = body as {
      url?: string;
      geminiApiKey?: string;
      rawText?: string;
      pastedText?: string;
    };

    const inputUrl = (url || '').trim();
    const inputPastedText = (pastedText || rawText || '').trim();

    if (!inputUrl && !inputPastedText) {
      return NextResponse.json(
        { error: 'Please enter a 1688 listing URL or paste product details/text.' },
        { status: 400 }
      );
    }

    const offerId = extractOfferId(inputUrl) || '934267247568';
    const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    let extractedData = null;
    let extractionMethod: 'PLAYWRIGHT' | 'PASTED_TEXT' | 'PRESET_FALLBACK' = 'PRESET_FALLBACK';
    let isBlockedByCaptcha = false;

    // ─── STEP 1: EXTRACT 1688 DETAILS ─────────────────────────────────────────
    if (inputPastedText) {
      // User used the UI Fallback: directly parsed pasted Chinese text / specs / JSON
      extractedData = parsePasted1688Text(inputPastedText, offerId);
      extractionMethod = 'PASTED_TEXT';
    } else if (inputUrl) {
      // Primary Extractor: Run Playwright with Chrome
      try {
        const playwrightResult = await extractViaPlaywright(inputUrl);
        if (playwrightResult) {
          extractedData = playwrightResult;
          extractionMethod = 'PLAYWRIGHT';
          isBlockedByCaptcha = !!playwrightResult.isBlockedByCaptcha;
        }
      } catch (pwErr) {
        console.warn('[1688 Playwright] Extraction skipped or failed:', pwErr);
      }
    }

    // ─── STEP 2: RUN 100-POINT SCORING MODEL ──────────────────────────────────
    let candidateVariants: RawVariantCandidate[] = [];
    let listingTitle = extractedData?.title || `1688 Wholesale Listing #${offerId}`;
    let marketThesis =
      'Analysis conducted strictly using US consumer behavior (iced matcha latte preparation), Etsy search algorithm mechanics (CTR & mobile pop), Japandi aesthetic trends, and unit economics.';

    // If Gemini 2.5 Flash is configured: use it as the AI Brain with strict JSON Structured Outputs
    if (activeGeminiKey) {
      try {
        const geminiResult = await analyze1688VariantsWith100PointModel(
          {
            url: inputUrl,
            offerId,
            pastedText: inputPastedText,
            extractedTitle: extractedData?.title,
            specs: extractedData?.specifications,
            knownSkus: extractedData?.skus?.map((s) => ({ name: s.name, priceCny: s.priceCny })),
          },
          activeGeminiKey
        );

        if (geminiResult && Array.isArray(geminiResult.variants) && geminiResult.variants.length > 0) {
          listingTitle = geminiResult.listingTitle || listingTitle;
          marketThesis = geminiResult.marketThesis || marketThesis;

          candidateVariants = geminiResult.variants.map((v, i) => ({
            id: v.id || `gemini-${i + 1}`,
            skuName: v.skuName,
            skuNameEn: v.skuNameEn,
            category: (v.category as any) || 'Matcha Bowl',
            priceCny: v.priceCny || 22,
            hasSpout: v.hasSpout,
            diameterCm: v.diameterCm,
            glazeStyle: v.glazeStyle,
            isBundle: v.isBundle,
            bundlePieces: v.bundlePieces,
            colorTheme: v.colorTheme,
          }));
        }
      } catch (geminiError: any) {
        console.warn('[Gemini 2.5 Flash] Analysis error:', geminiError);
        // If user explicitly provided a key but it errored, let them know clearly
        if (geminiApiKey) {
          return NextResponse.json(
            {
              error: `Google Gemini Error: ${geminiError?.message || 'Invalid API key or quota exceeded'}. Please verify your key at https://aistudio.google.com/app/apikey.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // If candidateVariants not generated by Gemini, build from extracted SKUs or verified presets
    if (candidateVariants.length === 0) {
      if (extractedData?.skus && extractedData.skus.length > 0) {
        candidateVariants = extractedData.skus.map((s, idx) => ({
          id: s.skuId,
          skuName: s.name,
          skuNameEn: s.nameEn || `Ceramic Matcha Item #${idx + 1}`,
          category: s.isBundle ? 'Complete Set' : 'Matcha Bowl',
          priceCny: s.priceCny || 22,
          hasSpout: s.hasSpout,
          isBundle: s.isBundle,
        }));
      } else {
        // High quality ceramic matcha presets
        candidateVariants = [
          {
            id: 'sku-1-spout-bundle',
            skuName: '景德镇手工窑变带嘴抹茶碗4件套 (含茶筅+茶筅立+茶勺)',
            skuNameEn: 'Handmade Kiln-Glazed Matcha Bowl with Spout 4-Piece Set',
            category: 'Complete Set',
            priceCny: 38.0,
            hasSpout: true,
            diameterCm: 12.2,
            glazeStyle: 'Kiln-Changed Reactive Glaze (窑变釉)',
            isBundle: true,
            bundlePieces: 4,
            colorTheme: 'Soft Matcha Sage Green',
          },
          {
            id: 'sku-2-spout-bowl',
            skuName: '日式粗陶手捏带鹰嘴导流抹茶碗 约450ml [草木灰釉]',
            skuNameEn: 'Wabi-Sabi Stoneware Katakuchi Matcha Bowl with Pouring Spout',
            category: 'Matcha Bowl',
            priceCny: 24.5,
            hasSpout: true,
            diameterCm: 12.5,
            glazeStyle: 'Wood Ash Textured Stoneware',
            isBundle: false,
            bundlePieces: 1,
            colorTheme: 'Speckled Vanilla Cream',
          },
          {
            id: 'sku-3-traditional-bowl',
            skuName: '景德镇手工无嘴抹茶碗 [日式曜变黑天目釉]',
            skuNameEn: 'Traditional Tenmoku Black Ceramic Matcha Chawan (No Spout)',
            category: 'Matcha Bowl',
            priceCny: 21.0,
            hasSpout: false,
            diameterCm: 11.8,
            glazeStyle: 'Tenmoku Crystal Black',
            isBundle: false,
            bundlePieces: 1,
            colorTheme: 'Wabi-Sabi Zen Black',
          },
        ];
      }
    }

    // ─── STEP 3: SCORE EVERY VARIANT ON THE 100-POINT MODEL ──────────────────
    const sampleImages = [
      '/studio-assets/test-samples/sample-1-ceramic-bowl.jpg',
      '/studio-assets/test-samples/sample-2-ceramic-cup.jpg',
      '/studio-assets/test-samples/sample-3-kitchen-accessory.jpg',
      '/studio-assets/test-samples/sample-4-home-decor.jpg',
    ];

    const scoredAll = candidateVariants.map((candidate, idx) => {
      const breakdown = scoreVariantForEtsyUS(candidate, idx + 1);
      return {
        candidate,
        breakdown,
      };
    });

    // Sort strictly by the 100-point total score in descending order
    scoredAll.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

    const formattedRanked: FormattedRankedVariant[] = scoredAll.map((item, idx) => {
      const { candidate, breakdown } = item;
      const rank = idx + 1;
      const econ = breakdown.unitEconomics;

      return {
        id: candidate.id || `variant-${rank}`,
        skuName: candidate.skuName,
        skuNameEn: candidate.skuNameEn || `Matcha Ceramic Variant #${rank}`,
        category: candidate.category || 'Matcha Bowl',
        priceCny: econ.priceCny,
        priceUsd: econ.priceUsd,
        weightGrams: candidate.isBundle ? 650 : 380,
        shippingUsd: econ.ddpFreightUsd,
        landedCostUsd: econ.landedCostUsd,
        estimatedEtsyRetailUsd: econ.suggestedRetailUsd,
        etsyFeesUsd: econ.etsyFeesUsd,
        netProfitUsd: econ.netProfitUsd,
        netMarginPct: econ.netMarginPct,
        opportunityScore: breakdown.totalScore,
        rank,
        salesChanceBadge:
          rank === 1
            ? '🥇 #1 Highest US Sales Chance (Top Ranking Pick)'
            : rank === 2
            ? '🥈 #2 High Potential Converter'
            : '🥉 #3 Viable Niche Alternative',
        estimatedMonthlyUnits: Math.round(160 * (breakdown.totalScore / 100) * (rank === 1 ? 0.8 : rank === 2 ? 0.55 : 0.4)),
        imageUrl: candidate.imageUrl || sampleImages[(rank - 1) % sampleImages.length],
        salesDrivers: [
          breakdown.consumerBehavior.rationale,
          breakdown.algorithmCTR.rationale,
          breakdown.aestheticTrend.rationale,
        ],
        risks: [
          econ.landedCostUsd > 16
            ? 'High dimensional weight: Ensure double foam drop-tested packaging'
            : 'Standard protective bubble mailer sufficient for US air transit',
        ],
        pillars: {
          consumerBehavior: breakdown.consumerBehavior,
          algorithmCTR: breakdown.algorithmCTR,
          aestheticTrend: breakdown.aestheticTrend,
          unitEconomics: breakdown.unitEconomics,
        },
        winningRationale: breakdown.winningRationale,
        etsyTitle: breakdown.etsyTitle,
        etsyTags: breakdown.etsyTags,
      };
    });

    const top3 = formattedRanked.slice(0, 3);
    const otherVariants = formattedRanked.slice(3);

    return NextResponse.json({
      success: true,
      url: inputUrl,
      offerId,
      listingTitle,
      marketThesis,
      totalVariantsFound: formattedRanked.length,
      top3,
      otherVariants,
      aiSummary: top3[0]?.winningRationale || marketThesis,
      isGeminiBrain: !!activeGeminiKey,
      extractionMethod,
      isBlockedByCaptcha,
    });
  } catch (err: unknown) {
    console.error('[Analyze 1688 Route Error]:', err);
    const msg = err instanceof Error ? err.message : 'Error processing 1688 research';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
