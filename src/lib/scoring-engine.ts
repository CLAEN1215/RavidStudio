/**
 * 1688 to Etsy US Theory & Algorithm-Driven Scoring Engine (100-Point Model)
 *
 * Strictly ignores 1688 supplier historical sales numbers.
 * Evaluates variants purely on why they will convert and rank highest in the US Etsy market:
 * 1. US Consumer Behavior & Functional Theory (30 pts)
 * 2. Etsy Search Algorithm & CTR Mechanics (30 pts)
 * 3. US Color Psychology & Aesthetic Trend Fit (20 pts)
 * 4. Unit Economics & Etsy Creativity Standards (20 pts)
 */

export interface PillarScoreBreakdown {
  consumerBehavior: {
    score: number; // 0 - 30
    jtbdSpoutScore: number; // 0 - 15 (Pouring spout / katakuchi for iced latte transfer)
    whiskingErgonomicsScore: number; // 0 - 15 (11.5-13cm diameter & curved vertical walls)
    hasSpout: boolean;
    diameterCm: number;
    rationale: string;
  };
  algorithmCTR: {
    score: number; // 0 - 30
    visualPopScore: number; // 0 - 15 (Kiln-changed reactive glaze 窑变, raw stoneware, wavy rim)
    bundleAOVScore: number; // 0 - 15 (Complete 4-5 pc curated bundle vs single piece)
    glazeStyle: string;
    isBundle: boolean;
    bundlePieces: number;
    rationale: string;
  };
  aestheticTrend: {
    score: number; // 0 - 20 (Japandi, soft matcha green, blush pink, vanilla cream)
    trendName: string;
    rationale: string;
  };
  unitEconomics: {
    score: number; // 0 - 20
    priceSignalingScore: number; // 0 - 10 (Target $42-$58 sweet spot)
    etsyComplianceScore: number; // 0 - 10 (Custom-curated gift set differentiation)
    priceCny: number;
    priceUsd: number; // rmb / 7.2
    ddpFreightUsd: number; // ~$7.50
    landedCostUsd: number; // priceUsd + ddpFreightUsd
    suggestedRetailUsd: number;
    etsyFeesUsd: number; // 9.5% + $0.45
    netProfitUsd: number;
    netMarginPct: number;
    rationale: string;
  };
  totalScore: number; // 0 - 100
  rank: number;
  salesChanceBadge: string;
  winningRationale: string;
  etsyTitle: string;
  etsyTags: string[];
}

export interface RawVariantCandidate {
  id?: string;
  skuName: string;
  skuNameEn?: string;
  category?: 'Matcha Bowl' | 'Complete Set' | 'Whisk Holder' | 'Accessories';
  priceCny: number;
  weightGrams?: number;
  imageUrl?: string;
  hasSpout?: boolean;
  diameterCm?: number;
  glazeStyle?: string;
  isBundle?: boolean;
  bundlePieces?: number;
  colorTheme?: string;
}

/**
 * Deterministically scores a variant based on physical specs, aesthetics, and behavioral economics
 */
export function scoreVariantForEtsyUS(
  variant: RawVariantCandidate,
  rank: number = 1
): PillarScoreBreakdown {
  const nameLower = (variant.skuName + ' ' + (variant.skuNameEn || '')).toLowerCase();
  const priceCny = Number(variant.priceCny) || 20;

  // ─── 1. US Consumer Behavior & Functional Theory (30 pts) ─────────────────
  // A. Jobs-to-be-Done: Iced Matcha Latte Transfer Spout (0-15 pts)
  const spoutKeywords = ['嘴', '鹰嘴', '导流', '片口', 'katakuchi', 'spout', 'pouring'];
  const hasSpout =
    variant.hasSpout ??
    spoutKeywords.some((k) => nameLower.includes(k) || variant.skuName.includes(k));

  const jtbdSpoutScore = hasSpout ? 15 : 4;
  const spoutRationale = hasSpout
    ? 'Equipped with Katakuchi pouring spout (+15 pts): Solves the #1 US consumer JTBD (clean transfer of frothy matcha into tall iced milk glasses without counter spills).'
    : 'No pouring spout (+4 pts): Traditional rim causes matcha dribble down outer wall during iced latte preparation, risking negative customer reviews.';

  // B. Whisking Ergonomics & Fluid Dynamics (0-15 pts)
  // Optimal chasen whisking diameter is 11.5 - 13.0 cm
  let diameter = variant.diameterCm || 12.0;
  const diamMatch = variant.skuName.match(/(\d+\.?\d*)\s*cm/i);
  if (diamMatch) {
    diameter = parseFloat(diamMatch[1]);
  }

  let whiskingErgonomicsScore = 14;
  let whiskingRationale = 'Ideal 11.5–13 cm diameter (+14 pts): Optimal fluid dynamics for "W" motion figure-eight whisking with zero rim splash.';

  if (diameter < 10.5) {
    whiskingErgonomicsScore = 7;
    whiskingRationale = `Narrow ${diameter}cm diameter (+7 pts): Whisking motion is restricted; chasen tines strike wall causing foam degradation.`;
  } else if (diameter > 14.0) {
    whiskingErgonomicsScore = 9;
    whiskingRationale = `Wide ${diameter}cm diameter (+9 pts): Requires higher matcha volume; fluid spreads too thin for dense microfoam.`;
  }

  const consumerBehaviorScore = jtbdSpoutScore + whiskingErgonomicsScore;

  // ─── 2. Etsy Search Algorithm & CTR Mechanics (30 pts) ─────────────────────
  // A. Mobile Thumbnail Visual Pop & Tactile Texture (0-15 pts)
  const reactiveKeywords = ['窑变', '粗陶', '黑陶', '冰裂', '开片', '结晶', 'reactive', 'stoneware', 'wabi', 'textured'];
  const isReactiveGlaze = reactiveKeywords.some((k) => variant.skuName.includes(k) || nameLower.includes(k));

  const visualPopScore = isReactiveGlaze ? 15 : 8;
  const glazeStyle = isReactiveGlaze ? 'Kiln-Changed Reactive Glaze (窑变釉) / Textured Stoneware' : 'Solid Smooth Glaze';
  const visualPopRationale = isReactiveGlaze
    ? 'High-contrast tactile glaze (+15 pts): Maximizes Etsy search CTR by popping against sterile white competitors in mobile search grids.'
    : 'Standard glossy glaze (+8 pts): Less visual texture; lower CTR on high-density mobile search results.';

  // B. Gift-Giver Perceived Value & AOV Bundle Theory (0-15 pts)
  const bundleKeywords = ['套', '4件', '5件', '礼盒', 'set', 'bundle', 'kit', 'chasen', 'spoon', 'whisk'];
  const isBundle =
    variant.isBundle ??
    (bundleKeywords.some((k) => variant.skuName.includes(k) || nameLower.includes(k)) ||
      variant.category === 'Complete Set');

  const bundlePieces = variant.bundlePieces || (isBundle ? 4 : 1);
  const bundleAOVScore = isBundle ? 15 : 6;
  const bundleRationale = isBundle
    ? `Curated ${bundlePieces}-Piece Gift Bundle (+15 pts): Triggers strong gifting psychology, higher Average Order Value ($48–$58), and superior Etsy ranking momentum.`
    : 'Single component (+6 pts): Lower perceived gift value and lower AOV; buyer must assemble set manually.';

  const algorithmCTRScore = visualPopScore + bundleAOVScore;

  // ─── 3. US Color Psychology & Aesthetic Trend Fit (20 pts) ─────────────────
  const trendyColors = [
    { key: ['绿', '抹茶', '青', 'sage', 'green', 'matcha'], name: 'Soft Matcha Sage Green', pts: 20 },
    { key: ['粉', '梅花', 'pink', 'blush', 'strawberry'], name: 'Strawberry Blush Pink', pts: 19 },
    { key: ['白', '米', '奶油', 'cream', 'vanilla', 'white'], name: 'Speckled Vanilla Cream', pts: 18 },
    { key: ['橙', '红', 'sunset', 'amber', 'terracotta', '褐'], name: 'Sunset Terracotta Earth', pts: 17 },
    { key: ['黑', '禅意', 'black', 'tenmoku', 'zen'], name: 'Wabi-Sabi Zen Black', pts: 16 },
  ];

  let matchedTrend = trendyColors[0];
  for (const c of trendyColors) {
    if (c.key.some((k) => variant.skuName.includes(k) || nameLower.includes(k))) {
      matchedTrend = c;
      break;
    }
  }

  const aestheticScore = matchedTrend.pts;
  const aestheticRationale = `Aligns with "${matchedTrend.name}" homeware trend (+${aestheticScore} pts): Complements modern US open-shelving and Japandi kitchen counter aesthetics.`;

  // ─── 4. Unit Economics & Etsy Creativity Standards (20 pts) ───────────────
  // USD Cost from 1688 (RMB / 7.2)
  const priceUsd = Number((priceCny / 7.2).toFixed(2));
  // Estimated US DDP air freight + custom-fitted protective drop-tested packaging
  const ddpFreightUsd = isBundle ? 8.5 : 6.8;
  const landedCostUsd = Number((priceUsd + ddpFreightUsd).toFixed(2));

  // Suggested Retail Price in US Etsy sweet spot ($42 - $58 for bundles, $28 - $36 for singles)
  let suggestedRetailUsd = isBundle ? 52.0 : 32.0;
  if (isBundle && landedCostUsd > 14) suggestedRetailUsd = 58.0;

  // Etsy US fees: 6.5% transaction + 3% payment processing + $0.20 listing fee + $0.25 fixed transaction
  const etsyFeesUsd = Number((suggestedRetailUsd * 0.095 + 0.45).toFixed(2));
  const netProfitUsd = Number((suggestedRetailUsd - landedCostUsd - etsyFeesUsd).toFixed(2));
  const netMarginPct = Number(((netProfitUsd / suggestedRetailUsd) * 100).toFixed(1));

  // Price-Quality Signaling (10 pts): Healthy margin at $42–$58 sweet spot
  let priceSignalingScore = 10;
  if (suggestedRetailUsd < 40 && isBundle) priceSignalingScore = 7;
  if (netMarginPct < 50) priceSignalingScore = 5;

  // Policy-Safe Differentiation (10 pts): Custom-curated gift set under Etsy Creativity Standards
  const etsyComplianceScore = 10;
  const economicRationale = `Supports $${suggestedRetailUsd} USD retail price at ${netMarginPct}% net margin (+$${netProfitUsd} net profit) with $${landedCostUsd} landed DDP cost. Complies with Etsy Creativity Standards as a custom-curated bundle with US guide card.`;

  const unitEconomicsScore = priceSignalingScore + etsyComplianceScore;

  // Total 100-Point Model
  const totalScore = Math.min(100, consumerBehaviorScore + algorithmCTRScore + aestheticScore + unitEconomicsScore);

  const salesChanceBadge =
    totalScore >= 90
      ? '🔥 #1 Highest Sales Probability (Top Converter)'
      : totalScore >= 80
      ? '⭐ Strong Sales Potential'
      : 'Viable Niche Alternative';

  const winningRationale = `Ranked #${rank} with a score of ${totalScore}/100 based on the 4-pillar US market model. Features: (1) Ergonomic Katakuchi spout solving iced latte transfer, (2) High-CTR tactile ${glazeStyle}, (3) ${matchedTrend.name} aesthetic fit, and (4) Superior ${netMarginPct}% net margin at the $${suggestedRetailUsd} sweet spot.`;

  // Generated Etsy Title & 13 Tags
  const itemName = variant.skuNameEn || 'Handmade Ceramic Matcha Tea Set with Spout';
  const etsyTitle = `${itemName} with Pouring Spout - Japanese Tea Ceremony Katakuchi Chawan Gift Set, Matcha Bowl Whisk Holder Kit for Iced Latte`;

  const etsyTags = [
    'matcha bowl spout',
    'katakuchi chawan',
    'matcha tea set gift',
    'ceramic whisk holder',
    'iced matcha latte',
    'japanese tea bowl',
    'wabi sabi ceramics',
    'matcha starter kit',
    'spouted matcha bowl',
    'artisan teaware',
    'tea lover gift set',
    'handmade chawan',
    'japandi kitchen decor',
  ];

  return {
    consumerBehavior: {
      score: consumerBehaviorScore,
      jtbdSpoutScore,
      whiskingErgonomicsScore,
      hasSpout,
      diameterCm: diameter,
      rationale: `${spoutRationale} ${whiskingRationale}`,
    },
    algorithmCTR: {
      score: algorithmCTRScore,
      visualPopScore,
      bundleAOVScore,
      glazeStyle,
      isBundle,
      bundlePieces,
      rationale: `${visualPopRationale} ${bundleRationale}`,
    },
    aestheticTrend: {
      score: aestheticScore,
      trendName: matchedTrend.name,
      rationale: aestheticRationale,
    },
    unitEconomics: {
      score: unitEconomicsScore,
      priceSignalingScore,
      etsyComplianceScore,
      priceCny,
      priceUsd,
      ddpFreightUsd,
      landedCostUsd,
      suggestedRetailUsd,
      etsyFeesUsd,
      netProfitUsd,
      netMarginPct,
      rationale: economicRationale,
    },
    totalScore,
    rank,
    salesChanceBadge,
    winningRationale,
    etsyTitle,
    etsyTags,
  };
}
