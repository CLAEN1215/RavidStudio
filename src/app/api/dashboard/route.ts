// GET /api/dashboard — dashboard stats

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const [productsRes, savedRes, historyRes, scoresRes] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact' }),
      supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('is_saved', true),
      supabaseAdmin.from('research_history').select('*').order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('opportunity_scores').select('score_total, recommendation').order('score_total', { ascending: false }).limit(5),
    ]);

    const totalProducts = productsRes.count ?? 0;
    const savedProducts = savedRes.count ?? 0;

    const allScores = scoresRes.data || [];
    const avgScore = allScores.length > 0
      ? allScores.reduce((s, r) => s + (r.score_total || 0), 0) / allScores.length
      : null;

    const strongOpportunities = allScores.filter(s => s.recommendation === 'STRONG_OPPORTUNITY').length;

    return NextResponse.json({
      totalProducts,
      savedProducts,
      avgScore: avgScore ? Math.round(avgScore) : null,
      strongOpportunities,
      recentHistory: historyRes.data || [],
    });
  } catch (error) {
    console.error('[Dashboard API]', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
