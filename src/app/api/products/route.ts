// GET /api/products — list saved products with scores
// POST /api/products/[id]/save — toggle save status

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const savedOnly = searchParams.get('saved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        opportunity_scores(score_total, recommendation, confidence),
        profitability_calculations(net_profit_margin_pct, suggested_selling_price, meets_target_margin)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (savedOnly) {
      query = query.eq('is_saved', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error('[Products API]', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
