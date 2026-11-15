import { NextRequest, NextResponse } from 'next/server';
import { fetchCNYtoUSDRate } from '@/lib/extractor';
import { GoogleGenAI } from '@google/genai';

export interface CandidateInput {
  id: string;
  name: string;
  priceCny: number;
  weightGrams?: number;
  category: 'Matcha Bowl' | 'Whisk Holder' | 'Complete Set' | 'Teaware & Decor';
  imageUrl?: string;
  url?: string;
  notes?: string;
}

export interface CandidateResult {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  url?: string;
  costCny: number;
  costUsd: number;
  shippingUsd: number;
  landedCostUsd: number;
  estimatedRetailUsd: number;
  etsyFeesUsd: number;
  netProfitUsd: number;
  netMarginPct: number;
  opportunityScore: number;
  rank: number;
  recommendation: 'STRONG_BUY' | 'BUY' | 'CONSIDER' | 'SKIP';
  salesPotentialLabel: string;
  estimatedMonthlyUnits: number;
  strengths: string[];
  risks: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { candidates, geminiApiKey } = await req.json() as {
      candidates: CandidateInput[];
      geminiApiKey?: string;
    };

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one product candidate.' }, { status: 400 });
    }

    // Exchange rate
    let rate = 0.14; // Default ~1 USD = 7.14 CNY
    try {
      const liveRate = await fetchCNYtoUSDRate();
      if (liveRate && liveRate > 0) rate = liveRate;
    } catch {
      // ignore
    }

    // Benchmark Etsy retail prices in the US Ceramic Matcha niche
    const nicheBenchmarks: Record<string, { medianRetail: number; avgMonthlySales: number; breakageRisk: number }> = {
      'Matcha Bowl': { medianRetail: 44.0, avgMonthlySales: 160, breakageRisk: 0.15 },
      'Whisk Holder': { medianRetail: 28.5, avgMonthlySales: 210, breakageRisk: 0.05 },
      'Complete Set': { medianRetail: 82.0, avgMonthlySales: 110, breakageRisk: 0.20 },
      'Teaware & Decor': { medianRetail: 36.0, avgMonthlySales: 130, breakageRisk: 0.10 },
    };

    const results: CandidateResult[] = candidates.map((c) => {
      const benchmark = nicheBenchmarks[c.category] || nicheBenchmarks['Matcha Bowl'];
      const costCny = Number(c.priceCny) || 15;
      const costUsd = Number((costCny * rate).toFixed(2));

      // Weight & Air Shipping: ~$0.015 per gram (e.g. 200g = $3.00, 450g = $6.75)
      const weight = c.weightGrams || (c.category === 'Whisk Holder' ? 180 : c.category === 'Matcha Bowl' ? 380 : 650);
      const shippingUsd = Number((weight * 0.014 + 1.2).toFixed(2)); // Base fee + weight

      const landedCostUsd = Number((costUsd + shippingUsd).toFixed(2));
      const estimatedRetailUsd = benchmark.medianRetail;

      // Etsy Fees:
      // Listing ($0.20) + Transaction (6.5%) + Payment (3% + $0.25)
      const transactionFee = estimatedRetailUsd * 0.065;
      const paymentFee = estimatedRetailUsd * 0.03 + 0.25;
      const listingFee = 0.20;
      const etsyFeesUsd = Number((transactionFee + paymentFee + listingFee).toFixed(2));

      const netProfitUsd = Number((estimatedRetailUsd - landedCostUsd - etsyFeesUsd).toFixed(2));
      const netMarginPct = Number(((netProfitUsd / estimatedRetailUsd) * 100).toFixed(1));

      // ── Calculate Multi-Factor Sales Opportunity Score (0-100) ───────────
      // 1. Margin Score (0-35)
      let marginScore = 0;
      if (netMarginPct >= 65) marginScore = 35;
      else if (netMarginPct >= 50) marginScore = 28;
      else if (netMarginPct >= 35) marginScore = 20;
      else if (netMarginPct >= 20) marginScore = 12;
      else marginScore = 5;

      // 2. High Demand / Velocity (0-25)
      let demandScore = 0;
      if (benchmark.avgMonthlySales >= 200) demandScore = 25;
      else if (benchmark.avgMonthlySales >= 150) demandScore = 21;
      else demandScore = 16;

      // 3. Low Breakage & Shipping Friction (0-20)
      let shippingScore = 0;
      if (benchmark.breakageRisk <= 0.08) shippingScore = 20; // Whisk holder / compact
      else if (benchmark.breakageRisk <= 0.15) shippingScore = 15;
      else shippingScore = 10;

      // 4. Barrier to Entry & Value Ratio (0-20)
      const markupMultiplier = estimatedRetailUsd / Math.max(1, landedCostUsd);
      let markupScore = 0;
      if (markupMultiplier >= 4.5) markupScore = 20;
      else if (markupMultiplier >= 3.0) markupScore = 16;
      else markupScore = 10;

      const totalScore = Math.min(100, Math.max(10, Math.round(marginScore + demandScore + shippingScore + markupScore)));

      let recommendation: 'STRONG_BUY' | 'BUY' | 'CONSIDER' | 'SKIP' = 'CONSIDER';
      let salesPotentialLabel = 'Moderate Sales Velocity';
      if (totalScore >= 82) {
        recommendation = 'STRONG_BUY';
        salesPotentialLabel = '🔥 Very High Sales Probability (Top Seller)';
      } else if (totalScore >= 70) {
        recommendation = 'BUY';
        salesPotentialLabel = '✅ High Sales Probability';
      } else if (totalScore >= 55) {
        recommendation = 'CONSIDER';
        salesPotentialLabel = '⚠️ Moderate Potential (Niche Dependent)';
      } else {
        recommendation = 'SKIP';
        salesPotentialLabel = '❌ Low Margin or High Competition';
      }

      // Strengths & Risks
      const strengths: string[] = [];
      if (netMarginPct >= 55) strengths.push(`${netMarginPct}% Net Profit Margin ($${netProfitUsd} per sale)`);
      if (markupMultiplier >= 3.5) strengths.push(`${markupMultiplier.toFixed(1)}x Markup over landed cost`);
      if (benchmark.breakageRisk <= 0.10) strengths.push('Low shipping weight & low breakage return rate');
      if (benchmark.avgMonthlySales >= 180) strengths.push('High search volume & recurring everyday demand on Etsy US');

      const risks: string[] = [];
      if (netMarginPct < 50) risks.push('Margin below 50% target threshold');
      if (benchmark.breakageRisk > 0.15) risks.push('Fragile ceramic requires bubble wrap & sturdy mailer box');
      if (costCny > 45) risks.push('Higher initial cash commitment per inventory batch');

      const estimatedMonthlyUnits = Math.round(benchmark.avgMonthlySales * (totalScore / 100) * 0.7);

      return {
        id: c.id,
        name: c.name,
        category: c.category,
        imageUrl: c.imageUrl,
        url: c.url,
        costCny,
        costUsd,
        shippingUsd,
        landedCostUsd,
        estimatedRetailUsd,
        etsyFeesUsd,
        netProfitUsd,
        netMarginPct,
        opportunityScore: totalScore,
        rank: 1, // Will be sorted
        recommendation,
        salesPotentialLabel,
        estimatedMonthlyUnits,
        strengths,
        risks,
      };
    });

    // Sort by Opportunity Score descending
    results.sort((a, b) => b.opportunityScore - a.opportunityScore);
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const winner = results[0];

    // Optional Gemini AI summary if key provided
    let aiReasoning: string | null = null;
    const activeGeminiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    if (activeGeminiKey && winner) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
        const prompt = `You are a ceramic e-commerce market expert. In 2 sentences, explain why "${winner.name}" (Score: ${winner.opportunityScore}/100, Net Margin: ${winner.netMarginPct}%, Est. Retail: $${winner.estimatedRetailUsd}) is ranked #1 with the highest sales chance on Etsy US compared to other candidates.`;
        const res = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
        });
        aiReasoning = res.text || null;
      } catch (e) {
        console.warn('Gemini reasoning failed:', e);
      }
    }

    if (!aiReasoning && winner) {
      aiReasoning = `"${winner.name}" ranks #1 with the highest sales probability due to an exceptional ${winner.netMarginPct}% net profit margin ($${winner.netProfitUsd} net per unit), minimal shipping friction, and strong repeat buyer demand in the Etsy US Japanese ceramics niche.`;
    }

    return NextResponse.json({
      success: true,
      rate,
      winnerId: winner?.id,
      winnerReasoning: aiReasoning,
      rankedCandidates: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal comparison error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
