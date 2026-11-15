// GET/POST/PUT/DELETE /api/knowledge-base — title references

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('title_references')
      .select('*')
      .order('is_preferred', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ references: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch references' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, is_preferred, notes } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('title_references')
      .insert({ title: title.trim(), is_preferred: is_preferred ?? false, notes })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ reference: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reference' }, { status: 500 });
  }
}
