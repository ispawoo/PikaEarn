import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET all users
export async function GET(request) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({
      success: true,
      users: [
        { id: 999999, username: 'MockUser', balance: 15.0, total_earned: 20.0, ads_watched_today: 5, created_at: new Date().toISOString() }
      ],
    });
  }

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Remove sensitive/internal formatting if necessary, or just return
    // Converting numeric strings to numbers for the frontend
    const formattedUsers = (users || []).map(user => ({
      ...user,
      balance: Number(user.balance),
      total_earned: Number(user.total_earned)
    }));

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Admin Users GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT update a user (e.g., manual balance adjustment)
export async function PUT(request) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: true, message: 'Mock user updated' });
  }

  try {
    const { id, balance, total_earned, ads_watched_today } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        balance,
        total_earned,
        ads_watched_today
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Admin Users PUT Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: true, message: 'Mock user deleted' });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Users DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
