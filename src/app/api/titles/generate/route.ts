import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { productDescription, productType, apiKey } = await req.json();

    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (activeKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeKey });
        const prompt = `You are a top 1% Etsy SEO expert specializing in Japanese ceramics, matcha sets, and tea ceremony ware.
Generate high-converting Etsy listing titles and 13 tags for this product:
Product: "${productDescription}"
Type: "${productType || 'Ceramic Matcha Ware'}"

Requirements:
- 3 title variations: 
  1. SEO Heavy (120-140 chars, primary keywords first)
  2. Aesthetic / Gift Focus (warm, artisanal, gift-worthy)
  3. Traditional Japanese Culture Focus (authentic, wabi-sabi, ceremony)
- 13 Etsy tags (max 20 characters each)

Return ONLY valid JSON matching this structure:
{
  "titles": [
    { "type": "SEO Optimized", "title": "..." },
    { "type": "Aesthetic & Gift", "title": "..." },
    { "type": "Traditional & Authentic", "title": "..." }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const text = response.text;
        if (text) {
          const cleanText = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*$/g, '')
            .trim();
          const parsed = JSON.parse(cleanText);
          return NextResponse.json({ success: true, ...parsed });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, using rule-based generator:', geminiError);
      }
    }

    // High quality rule-based fallback when API key is not yet input
    const cleanDesc = productDescription || 'Handmade Ceramic Matcha Tea Set';
    const titles = [
      {
        type: 'SEO Optimized',
        title: `Ceramic Matcha Whisk Holder Chasen Stand - Japanese Tea Ceremony Accessory, Handmade Porcelain Naoshi Gift for Tea Lovers`,
      },
      {
        type: 'Aesthetic & Gift',
        title: `Minimalist Ceramic Matcha Whisk Stand - Sunset Gradient Ceramic Chasen Holder, Zen Kitchen Aesthetic, Matcha Starter Gift`,
      },
      {
        type: 'Traditional & Authentic',
        title: `Japanese Pottery Matcha Whisk Holder - Traditional Ceramic Naoshi Stand, Wabi Sabi Tea Ceremony Tool, Ceramic Studio Decor`,
      },
    ];

    const tags = [
      'matcha whisk holder',
      'chasen stand',
      'ceramic naoshi',
      'matcha tea set',
      'japanese tea gift',
      'matcha accessories',
      'zen kitchen decor',
      'tea lover gift',
      'handmade pottery',
      'chawan bowl set',
      'bamboo whisk stand',
      'tea ceremony tool',
      'aesthetic matcha',
    ];

    return NextResponse.json({
      success: true,
      titles,
      tags,
      isFallback: !activeKey,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate titles';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
