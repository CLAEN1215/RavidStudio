// GET/PUT /api/settings — application settings

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const [settingsRes, pricesRes] = await Promise.all([
      supabaseAdmin.from('app_settings').select('*'),
      supabaseAdmin.from('reference_prices').select('*').order('sort_order'),
    ]);

    return NextResponse.json({
      settings: settingsRes.data || [],
      referencePrices: pricesRes.data || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ setting: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
