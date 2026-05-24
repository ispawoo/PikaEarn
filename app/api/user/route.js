// app/api/user/route.js
import { NextResponse } from 'next/server';
import { verifyTelegramInitData } from '@/lib/cryptoVerify';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request) {
  // Extract initData from Authorization header (custom 'tma <initData>' standard)
  const authHeader = request.headers.get('Authorization');
  let initData = '';

  if (authHeader && authHeader.startsWith('tma ')) {
    initData = authHeader.substring(4);
  } else {
    // Fallback to query param
    const { searchParams } = new URL(request.url);
    initData = searchParams.get('initData') || '';
  }

  // Cryptographically verify Telegram initData
  const verification = verifyTelegramInitData(initData);
  
  if (!verification.isValid) {
    return NextResponse.json(
      { error: 'Unauthorized: ' + (verification.reason || 'Invalid credentials') },
      { status: 401 }
    );
  }

  const tgUser = verification.user;
  
  // Extract referred_by from query params if first-time load
  const { searchParams } = new URL(request.url);
  const referredByStr = searchParams.get('referred_by');
  let referredBy = null;
  if (referredByStr && referredByStr !== 'null' && referredByStr !== 'undefined') {
    referredBy = parseInt(referredByStr) || null;
  }

  // 1. If Supabase is configured, read/write to the database
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_or_create_user', {
        p_user_id: tgUser.id,
        p_username: tgUser.username || tgUser.first_name || `tg_${tgUser.id}`,
        p_referred_by: referredBy
      });

      if (error) {
        console.error('Database RPC error:', error);
        return NextResponse.json({ error: 'Database transaction error: ' + error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: data,
        isMock: false
      });
    } catch (e) {
      console.error('API /api/user error:', e);
      return NextResponse.json({ error: 'Server error: ' + e.message }, { status: 500 });
    }
  }

  // 2. Mock Mode Fallback (if Supabase credentials are not configured yet)
  // Generates realistic simulated state for instant user testing
  const mockUser = {
    id: tgUser.id,
    username: tgUser.username || tgUser.first_name || `tg_${tgUser.id}`,
    balance: 1.50, // default dummy start balance to show something beautiful
    total_earned: 1.50,
    ads_watched_today: 4,
    last_ad_watched_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hr ago
    referred_by: referredBy || null,
    friends_count: 3,
    referral_earned: 0.45
  };

  return NextResponse.json({
    success: true,
    user: mockUser,
    isMock: true
  });
}
