import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: 1,
        totalBalance: 15.0,
        totalEarned: 20.0,
        pendingWithdrawals: 1,
      },
    });
  }

  try {
    // 1. Get user stats
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('balance, total_earned');

    if (usersError) throw usersError;

    let totalBalance = 0;
    let totalEarned = 0;
    
    users.forEach(user => {
      totalBalance += Number(user.balance || 0);
      totalEarned += Number(user.total_earned || 0);
    });

    // 2. Get pending withdrawals count
    const { count, error: withdrawError } = await supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (withdrawError) throw withdrawError;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalBalance,
        totalEarned,
        pendingWithdrawals: count || 0,
      },
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
