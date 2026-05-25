'use client';

import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Wallet, Activity, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Total Payouts Pending', value: stats?.pendingWithdrawals || 0, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { title: 'Total User Balances', value: `$${(stats?.totalBalance || 0).toFixed(2)}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Total System Earnings', value: `$${(stats?.totalEarned || 0).toFixed(2)}`, icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time statistics and system metrics</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={isLoading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
          title="Refresh Stats"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">{card.title}</p>
                  <h3 className="text-3xl font-black text-white">
                    {isLoading ? <span className="animate-pulse bg-slate-800 h-8 w-16 rounded block mt-2"></span> : card.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Icon className="w-32 h-32" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
