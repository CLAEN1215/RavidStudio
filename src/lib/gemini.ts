/**
 * Google Gemini API Service (Server-side only)
 * Uses @google/genai SDK with structured JSON outputs
 */

import { GoogleGenAI } from '@google/genai';
import type {
  GeminiProductAnalysis,
  GeminiMarketInterpretation,
  GeneratedTitle,
  ComplianceAssessment,
  OpportunityScore,
  TitleReference,
  SupplierProduct,
  MarketResearch,
  ProfitabilityResult,
} from '@/types';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
}

function getModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}

// ─── Product Analysis from text/URL data ──────────────────────────────────

export async function analyzeProductData(
  nameOrDescription: string,
  priceInfo?: string,
): Promise<GeminiProductAnalysis> {
  const ai = getClient();
  const model = getModel();

  const prompt = `You are an expert product analyst specializing in ceramic matcha tea sets and Japanese tea ceremony items for the Etsy US market.

Analyze the following product information and return a structured JSON response.

Product Information:
${nameOrDescription}
${priceInfo ? `Price Information: ${priceInfo}` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name_en": "translated English product name",
  "materials": ["list", "of", "materials"],
  "product_type": "specific product type (e.g., matcha bowl, tea set, whisk holder)",
  "design_style": ["list", "of", "design", "styles"],
  "colors": ["available", "colors"],
  "niche_categories": ["etsy niche categories this fits"],
  "etsy_suitability": "Brief assessment of suitability for Etsy US matcha niche",
  "key_selling_points": ["up to 5 key selling points"],
  "potential_configurations": ["how it could be sold: individual, bundle, etc."],
  "image_quality_assessment": "assessment based on typical products of this type"
}

Important: Only include information derivable from the input. Do not invent specifications, dimensions, or prices.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.2, maxOutputTokens: 1500 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeminiProductAnalysis;
}

// ─── Market Research Interpretation ───────────────────────────────────────

export async function interpretMarketData(
  productName: string,
  competitorListings: Array<{ title: string; price: number }>,
  etsySearchContext?: string,
): Promise<GeminiMarketInterpretation> {
  const ai = getClient();
  const model = getModel();

  const listingsText = competitorListings.length > 0
    ? competitorListings.map(l => `- "${l.title}" at $${l.price}`).join('\n')
    : 'No competitor listings retrieved (manual interpretation required)';

  const prompt = `You are a market research analyst for Etsy US, specializing in ceramic matcha tea sets and Japanese tea ceremony items.

Product being evaluated: ${productName}

Competitor listings found:
${listingsText}

${etsySearchContext ? `Additional context: ${etsySearchContext}` : ''}

Analyze the market opportunity for this product on Etsy US. Consider:
- The matcha tea and Japanese tea ceremony trend in the US
- Gift market potential
- Seasonal opportunities (holidays, Mother's Day, etc.)
- Product differentiation

Return ONLY valid JSON with this structure (no markdown):
{
  "demand_assessment": "concise assessment of market demand",
  "competition_assessment": "concise assessment of competition level",
  "niche_fit_assessment": "how well this fits the ceramic matcha niche",
  "keyword_opportunities": ["high-value", "search", "keywords"],
  "differentiation_opportunities": ["ways to differentiate", "this product"],
  "market_risks": ["potential", "market", "risks"],
  "seasonal_opportunities": ["seasonal or gifting opportunities"],
  "recommended_price_range_min": null_or_number,
  "recommended_price_range_max": null_or_number
}

Important: 
- Base your assessment on the competitor data provided + general Etsy market knowledge
- Clearly distinguish what is verified vs estimated
- Do not invent sales figures or specific review counts`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.3, maxOutputTokens: 2000 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeminiMarketInterpretation;
}

// ─── Etsy Title Generation ─────────────────────────────────────────────────

export async function generateEtsyTitles(
  product: SupplierProduct,
  titleReferences: TitleReference[],
  analysis?: GeminiProductAnalysis,
): Promise<GeneratedTitle[]> {
  const ai = getClient();
  const model = getModel();

  const preferredRefs = titleReferences.filter(r => r.is_preferred);
  const otherRefs = titleReferences.filter(r => !r.is_preferred);

  const refSection = `
PREFERRED TITLE EXAMPLES (highest priority style references):
${preferredRefs.map((r, i) => `${i + 1}. "${r.title}"`).join('\n')}

OTHER TITLE EXAMPLES:
${otherRefs.map((r, i) => `${i + 1}. "${r.title}"`).join('\n')}`;

  const productContext = `
Product Name (Chinese source): ${product.name_cn || 'Unknown'}
Product Name (Translated): ${product.name_en || 'Unknown'}
Materials: ${product.materials?.join(', ') || 'Ceramic (assumed)'}
Colors: ${product.colors?.join(', ') || 'Unknown'}
Design style: ${analysis?.design_style?.join(', ') || 'Japanese ceramic style'}
Product type: ${analysis?.product_type || 'matcha tea set'}
Key selling points: ${analysis?.key_selling_points?.join(', ') || 'None specified'}`;

  const prompt = `You are an expert Etsy SEO copywriter specializing in Japanese ceramic tea sets for the US market.

Your task is to generate 5 Etsy listing title variations for this product, following the EXACT style and patterns of the business owner's existing titles.

BUSINESS OWNER'S TITLE STYLE REFERENCES:
${refSection}

STYLE ANALYSIS INSTRUCTIONS:
Analyze these titles for:
- Title structure and word order
- How the product type is positioned
- Use of "Handmade" and "Ceramic" descriptors
- Design terminology (Flower, Lotus, Sakura, etc.)
- Japanese tea ceremony references
- Color naming conventions
- Keyword placement strategy
- Title length (aim for 100-140 characters)

PRODUCT TO CREATE TITLES FOR:
${productContext}

ETSY TITLE RULES:
- Maximum 140 characters
- Most important keywords near the front
- Avoid keyword stuffing
- Natural, readable language
- Do not use all caps
- Do not use "handmade" unless the product can genuinely be described as handmade or made by a production partner

Return ONLY valid JSON array with exactly 5 objects (no markdown):
[
  {
    "title": "the actual title text",
    "character_count": number,
    "keyword_breakdown": {
      "primary_keyword": "main search keyword",
      "supporting_keywords": ["keyword2", "keyword3"],
      "style_terms": ["design", "style", "terms"],
      "product_type": "product type term used",
      "estimated_seo_relevance": "HIGH|MEDIUM|LOW"
    },
    "rationale": "brief explanation of why this title was written this way",
    "style_match_confidence": "HIGH|MEDIUM|LOW"
  }
]`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.5, maxOutputTokens: 3000 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const titles = JSON.parse(cleaned) as GeneratedTitle[];
  return titles.slice(0, 5);
}

// ─── Compliance Assessment ─────────────────────────────────────────────────

export async function assessEtsyCompliance(
  product: SupplierProduct,
  analysis?: GeminiProductAnalysis,
): Promise<ComplianceAssessment> {
  const ai = getClient();
  const model = getModel();

  const prompt = `You are an Etsy policy compliance specialist.

A seller is sourcing products from 1688 (Chinese wholesale marketplace) and wants to sell them on Etsy.

Product details:
- Name: ${product.name_en || product.name_cn || 'Unknown'}
- Source: 1688 wholesale marketplace
- Supplier: ${product.supplier_name || 'Unknown Chinese manufacturer'}
- Product type: ${analysis?.product_type || 'ceramic tea set'}
- Materials: ${product.materials?.join(', ') || 'ceramic'}

Evaluate whether this product can be sold on Etsy under Etsy's Creativity Standards.

Etsy's seller categories:
1. Handmade items (made by the seller)
2. Vintage items (20+ years old)
3. Craft supplies
4. Items made by a disclosed Production Partner (seller must be involved in the design)

Return ONLY valid JSON (no markdown):
{
  "status": "POTENTIALLY_ELIGIBLE|REQUIRES_MANUAL_VERIFICATION|NOT_ELIGIBLE",
  "reasoning": "clear explanation of the compliance assessment",
  "applicable_etsy_category": "which Etsy category might apply",
  "action_required": "what the seller must do to remain compliant",
  "policy_links": [
    {"label": "Etsy Creativity Standards", "url": "https://www.etsy.com/legal/sellers/?ref=list#creativity"},
    {"label": "Etsy Production Partners Policy", "url": "https://help.etsy.com/hc/en-us/articles/115015628347"},
    {"label": "Etsy Handmade Policy", "url": "https://help.etsy.com/hc/en-us/articles/360000343508"}
  ]
}`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.1, maxOutputTokens: 1000 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as ComplianceAssessment;
}

// ─── Profitability Explanation ─────────────────────────────────────────────

export async function explainProfitability(
  product: SupplierProduct,
  profitability: ProfitabilityResult,
  research: MarketResearch | null,
): Promise<string> {
  const ai = getClient();
  const model = getModel();

  const prompt = `You are a business advisor helping an Etsy seller evaluate product profitability.

Product: ${product.name_en || 'Unknown product'}
Supplier cost (USD): $${profitability.supplier_cost_usd}
Total landed cost: $${profitability.total_landed_cost}
Suggested selling price: $${profitability.suggested_selling_price}
Net profit margin: ${profitability.net_profit_margin_pct.toFixed(1)}%
Meets 35% target margin: ${profitability.meets_target_margin ? 'Yes' : 'No'}
Break-even price: $${profitability.break_even_price}

Write a brief (2-3 sentence) plain English interpretation of these numbers for a non-financial Etsy seller. 
Focus on what matters: is this profitable, what's the main cost challenge, and what price point works.
Do not include raw financial calculations — those are shown separately.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.3, maxOutputTokens: 400 },
  });

  return response.text ?? '';
}

// ─── Full Product Summary ──────────────────────────────────────────────────

export async function generateProductSummary(
  product: SupplierProduct,
  score: OpportunityScore,
  research: MarketResearch | null,
): Promise<string> {
  const ai = getClient();
  const model = getModel();

  const prompt = `You are a product research advisor for an Etsy business selling ceramic matcha tea sets.

Summarize this product research report in 3-4 sentences for the business owner.
Be direct, honest, and actionable. Mention the score, key opportunity or risk, and recommended next step.

Product: ${product.name_en || product.name_cn || 'Unknown'}
Score: ${score.score.total}/100 (${score.recommendation})
Top strengths: ${score.strengths.slice(0, 2).join('; ')}
Top risks: ${score.risks.slice(0, 2).join('; ')}
Market fit: ${research?.niche_fit_assessment || 'Not assessed'}

Write the summary now (plain text, no bullet points, no headers):`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.4, maxOutputTokens: 500 },
  });

  return response.text ?? '';
}
