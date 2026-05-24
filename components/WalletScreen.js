// components/WalletScreen.js
'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle, ArrowUpRight, ArrowDownLeft, CheckCircle, Clock } from 'lucide-react';
import { useTelegram } from './TelegramContext';

export default function WalletScreen({ userState, setUserState }) {
  const { initData, hapticFeedback, showPopup } = useTelegram();
  const [method, setMethod] = useState('TON Wallet');
  const [targetAddress, setTargetAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  const { balance, id } = userState;
  const numBalance = parseFloat(balance || 0);
  const threshold = 5.00;
  const isUnlocked = numBalance >= threshold;
  const progressPercent = Math.min(100, (numBalance / threshold) * 100);
  const neededAmount = Math.max(0, threshold - numBalance);

  // Load transaction history (both mock and real withdrawals) on mount
  useEffect(() => {
    const loadHistory = () => {
      const txs = [];

      // 1. Add some mock ad watches for premium UI aesthetics
      const baseTime = Date.now();
      const adsWatchedCount = Math.min(6, userState.ads_watched_today || 4);
      for (let i = 0; i < adsWatchedCount; i++) {
        txs.push({
          id: `ad_${i}`,
          type: 'deposit',
          title: 'Ad reward',
          amount: '0.10',
          time: new Date(baseTime - i * 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today',
          status: 'completed'
        });
      }

      // 2. Fetch withdrawals from localStorage to maintain mock persistence
      try {
        const storedWithdrawals = localStorage.getItem(`pikaearn_withdrawals_${id}`);
        if (storedWithdrawals) {
          const wds = JSON.parse(storedWithdrawals);
          wds.forEach((wd) => {
            txs.push({
              id: wd.id,
              type: 'withdraw',
              title: `Withdrawal (${wd.method})`,
              amount: parseFloat(wd.amount).toFixed(2),
              time: new Date(wd.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date(wd.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
              status: wd.status
            });
          });
        }
      } catch (e) {
        console.error('Error loading mock withdrawals from storage', e);
      }

      // Sort by date/time (we place withdrawals first for premium feedback)
      txs.sort((a, b) => {
        if (a.type === 'withdraw' && b.type !== 'withdraw') return -1;
        if (a.type !== 'withdraw' && b.type === 'withdraw') return 1;
        return 0;
      });

      setHistory(txs);
    };

    if (id) {
      loadHistory();
    }
  }, [id, userState.ads_watched_today]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!isUnlocked || isSubmitting) return;

    if (!targetAddress.trim()) {
      hapticFeedback.notification('error');
      showPopup('Error', 'Please enter a valid payout address or wallet destination.');
      return;
    }

    hapticFeedback.impact('medium');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: initData,
          amount: numBalance, // Withdraw full balance
          method: method,
          targetAddress: targetAddress
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit withdrawal');
      }

      hapticFeedback.notification('success');
      showPopup('Success', 'Your payout request has been successfully submitted! It will be processed within 24 hours.');

      // Save locally to show in Transaction History
      const newWithdrawal = {
        id: result.withdrawalId || crypto.randomUUID(),
        amount: numBalance,
        method: method,
        target_address: targetAddress,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      try {
        const stored = localStorage.getItem(`pikaearn_withdrawals_${id}`);
        const currentWds = stored ? JSON.parse(stored) : [];
        currentWds.unshift(newWithdrawal);
        localStorage.setItem(`pikaearn_withdrawals_${id}`, JSON.stringify(currentWds));
      } catch (e) {
        // ignore
      }

      // Deduct client balance state locally
      setUserState((prev) => ({
        ...prev,
        balance: '0.00'
      }));

      setTargetAddress('');
      
      // Reload history
      setHistory(prev => [
        {
          id: newWithdrawal.id,
          type: 'withdraw',
          title: `Withdrawal (${newWithdrawal.method})`,
          amount: parseFloat(newWithdrawal.amount).toFixed(2),
          time: new Date(newWithdrawal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Today',
          status: 'pending'
        },
        ...prev
      ]);

    } catch (err) {
      hapticFeedback.notification('error');
      showPopup('Error', err.message || 'Failed to process withdrawal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-5 flex-1 pb-24">
      {/* Wallet Balance Display */}
      <div className="bg-slate-900/40 rounded-3xl p-5 border border-slate-900/60 glass-panel text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-cyan-950/40 rounded-2xl flex items-center justify-center border border-cyan-800/20 text-cyan-400 mb-3">
          <Wallet className="w-6 h-6" />
        </div>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Available Balance</span>
        <h2 className="text-4xl font-black text-white mt-1">
          <span className="text-2xl text-cyan-400 font-bold mr-0.5">$</span>
          {numBalance.toFixed(2)}
        </h2>

        {/* Payout Progress Bar */}
        <div className="w-full mt-5">
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
            <span>Payout Progress</span>
            <span className={isUnlocked ? 'text-cyan-400' : 'text-slate-400'}>
              ${numBalance.toFixed(2)} of $5.00 USD
            </span>
          </div>
          
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
            <div 
              style={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isUnlocked 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-500'
              }`}
            />
          </div>

          {!isUnlocked && (
            <p className="text-[10px] text-slate-500 font-medium text-left mt-2 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
              <span>You need another ${neededAmount.toFixed(2)} USD to unlock withdrawals.</span>
            </p>
          )}
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-slate-900/30 rounded-3xl p-5 border border-slate-900/60 glass-panel">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4">Request Cashout</h3>

        {!isUnlocked ? (
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-900 text-center">
            <span className="text-2xl mb-1.5 block">🔒</span>
            <h4 className="text-sm font-bold text-slate-300">Form Locked</h4>
            <p className="text-xs text-slate-500 max-w-[220px] mx-auto mt-1 leading-relaxed">
              Earn at least $5.00 USD by watching ads or inviting friends to unlock this form.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Payout Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="TON Wallet">TON Wallet (Native Telegram)</option>
                <option value="USDT TRC20">USDT (TRC-20 Network)</option>
                <option value="PayPal">PayPal (USD Direct)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {method === 'PayPal' ? 'PayPal Email Address' : `${method.split(' ')[0]} Address`}
              </label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder={method === 'PayPal' ? 'example@email.com' : `Enter your ${method.split(' ')[0]} wallet address`}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center shadow-lg active:scale-98 transition-all ${
                isSubmitting ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-105 active:scale-98 glow-cyan'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                `WITHDRAW FULL BALANCE ($${numBalance.toFixed(2)})`
              )}
            </button>
          </form>
        )}
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-slate-900/30 rounded-3xl p-5 border border-slate-900/60 glass-panel">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-3.5">Transaction Ledger</h3>
        
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-xs font-semibold">
              No transactions recorded yet.
            </div>
          ) : (
            history.map((tx) => (
              <div 
                key={tx.id} 
                className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-850"
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    tx.type === 'deposit' 
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                      : 'bg-amber-950/20 border-amber-900/40 text-amber-500'
                  }`}>
                    {tx.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{tx.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {tx.date} • {tx.time}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold block ${
                    tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-500'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                  </span>
                  
                  {/* Small status tag */}
                  <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide">
                    {tx.status === 'completed' ? (
                      <span className="text-emerald-500 flex items-center">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Done
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center">
                        <Clock className="w-2.5 h-2.5 mr-0.5 animate-pulse" /> Pending
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
