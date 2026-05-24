// app/api/reward/route.js
import { NextResponse } from 'next/server';
import { verifyTelegramInitData } from '@/lib/cryptoVerify';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData in request payload' }, { status: 400 });
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

    // 1. Database mode
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('watch_ad_and_credit', {
        p_user_id: tgUser.id,
        p_username: tgUser.username || tgUser.first_name || `tg_${tgUser.id}`
      });

      if (error) {
        console.error('Database RPC error:', error);
        return NextResponse.json({ error: 'Database transaction error: ' + error.message }, { status: 500 });
      }

      if (data && data.success === false) {
        return NextResponse.json({ error: data.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Ad reward credited successfully!',
        balance: data.balance,
        ads_watched_today: data.ads_watched_today,
        last_ad_watched_at: data.last_ad_watched_at,
        friends_count: data.friends_count,
        referral_earned: data.referral_earned,
        reward_amount: 0.10,
        isMock: false
      });
    }

    // 2. Mock mode (simulated response for client state rollup)
    return NextResponse.json({
      success: true,
      message: '[MOCK MODE] Ad reward credited successfully!',
      reward_amount: 0.10,
      isMock: true
    });
  } catch (e) {
    console.error('API /api/reward error:', e);
    return NextResponse.json({ error: 'Server error: ' + e.message }, { status: 500 });
  }
}
