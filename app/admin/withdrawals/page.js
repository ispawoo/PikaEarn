'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch withdrawals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    if (!confirm(`Are you sure you want to mark this withdrawal as ${newStatus}? ${newStatus === 'rejected' ? 'This will refund the balance to the user.' : ''}`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: newStatus } : w));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'completed') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</span>;
    }
    if (status === 'rejected') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
        <p className="text-slate-400 text-sm mt-1">Review and process user payouts</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Request ID / Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method & Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading withdrawals...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-400">{w.id.substring(0, 12)}...</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(w.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{w.users?.username || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {w.user_id}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold">${Number(w.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-semibold">{w.method}</div>
                      <div className="font-mono text-xs text-slate-500 mt-0.5 max-w-[150px] truncate" title={w.target_address}>
                        {w.target_address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleUpdateStatus(w.id, 'completed')}
                            disabled={actionLoading === w.id}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20 font-semibold text-xs flex items-center"
                          >
                            {actionLoading === w.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(w.id, 'rejected')}
                            disabled={actionLoading === w.id}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 font-semibold text-xs flex items-center"
                          >
                            {actionLoading === w.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status !== 'pending' && (
                        <span className="text-xs text-slate-500 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
