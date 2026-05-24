// app/api/withdraw/route.js
import { NextResponse } from 'next/server';
import { verifyTelegramInitData } from '@/lib/cryptoVerify';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { initData, amount, method, targetAddress } = body;

    // Basic payload validation
    if (!initData || !amount || !method || !targetAddress) {
      return NextResponse.json({ error: 'Missing required parameters in payload' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 5.00) {
      return NextResponse.json({ error: 'Invalid amount. Minimum withdrawal is $5.00 USD.' }, { status: 400 });
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
      const { data, error } = await supabaseAdmin.rpc('request_withdrawal', {
        p_user_id: tgUser.id,
        p_amount: parsedAmount,
        p_method: method,
        p_target_address: targetAddress
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
        message: 'Withdrawal request submitted successfully!',
        withdrawalId: data.withdrawal_id,
        newBalance: data.new_balance,
        friends_count: data.friends_count,
        referral_earned: data.referral_earned,
        isMock: false
      });
    }

    // 2. Mock mode (simulated response for client state rollup)
    return NextResponse.json({
      success: true,
      message: '[MOCK MODE] Withdrawal request submitted successfully!',
      withdrawalId: crypto.randomUUID(),
      newBalance: 0.00, // Client will calculate the actual new mock balance
      isMock: true
    });
  } catch (e) {
    console.error('API /api/withdraw error:', e);
    return NextResponse.json({ error: 'Server error: ' + e.message }, { status: 500 });
  }
}
