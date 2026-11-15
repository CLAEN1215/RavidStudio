// GET /api/products/[id] — get full product report
// PATCH /api/products/[id] — update product (e.g., save/unsave)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [researchRes, profitRes, scoreRes, complianceRes, titlesRes] = await Promise.all([
      supabaseAdmin.from('market_research').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('profitability_calculations').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('opportunity_scores').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('compliance_assessments').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('generated_titles').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(5),
    ]);

    return NextResponse.json({
      product,
      marketResearch: researchRes.data,
      profitability: profitRes.data,
      opportunityScore: scoreRes.data,
      compliance: complianceRes.data,
      generatedTitles: titlesRes.data || [],
    });
  } catch (error) {
    console.error('[Product Detail API]', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('[Product Update API]', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
