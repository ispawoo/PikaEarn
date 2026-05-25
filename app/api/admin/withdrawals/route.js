import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// GET all withdrawals
export async function GET(request) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({
      success: true,
      withdrawals: [
        {
          id: 'mock-withdraw-id',
          user_id: 999999,
          amount: 5.0,
          method: 'USDT TRC20',
          target_address: 'TMockAddress123',
          status: 'pending',
          created_at: new Date().toISOString(),
          users: { username: 'MockUser' }
        }
      ],
    });
  }

  try {
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        *,
        users (
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedWithdrawals = withdrawals.map(w => ({
      ...w,
      amount: Number(w.amount)
    }));

    return NextResponse.json({ success: true, withdrawals: formattedWithdrawals });
  } catch (error) {
    console.error('Admin Withdrawals GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

// PUT update a withdrawal status (approve/reject)
export async function PUT(request) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: true, message: 'Mock withdrawal updated' });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Withdrawal ID and status are required' }, { status: 400 });
    }

    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Begin transaction-like approach
    // First, get the current withdrawal
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 });

    // Update status
    const { data: updatedWithdrawal, error: updateError } = await supabaseAdmin
      .from('withdrawals')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If rejected, refund the user
    if (status === 'rejected' && withdrawal.status === 'pending') {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();
        
      if (!userError && user) {
        await supabaseAdmin
          .from('users')
          .update({ balance: Number(user.balance) + Number(withdrawal.amount) })
          .eq('id', withdrawal.user_id);
      }
    }

    return NextResponse.json({ success: true, withdrawal: updatedWithdrawal });
  } catch (error) {
    console.error('Admin Withdrawals PUT Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update withdrawal' }, { status: 500 });
  }
}
