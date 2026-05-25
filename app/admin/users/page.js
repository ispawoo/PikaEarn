'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Loader2, X, Check, Eye, User as UserIcon, Calendar, Zap, DollarSign, Activity, Wallet } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ balance: '', total_earned: '', ads_watched_today: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Profile modal state
  const [viewingUser, setViewingUser] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      balance: user.balance,
      total_earned: user.total_earned,
      ads_watched_today: user.ads_watched_today
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          balance: Number(editForm.balance),
          total_earned: Number(editForm.total_earned),
          ads_watched_today: Number(editForm.ads_watched_today)
        })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u));
        setEditingUser(null);
      } else {
        alert(data.error || 'Failed to update user');
      }
    } catch (err) {
      alert('Error updating user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.toString().includes(searchTerm) || 
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Users</h1>
          <p className="text-slate-400 text-sm mt-1">View profiles, edit balances, and remove users</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search ID or Username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4 hidden md:table-cell">Total Earned</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}&backgroundColor=0f172a`} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full bg-slate-950 border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{user.username || 'No Name'}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-bold">${Number(user.balance).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400 hidden md:table-cell">${Number(user.total_earned).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <button 
                          onClick={() => setViewingUser(user)}
                          className="p-2 bg-slate-800 hover:bg-cyan-900/50 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700 hover:border-cyan-800"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 bg-slate-800 hover:bg-blue-900/50 text-slate-300 hover:text-blue-400 rounded-lg transition-colors border border-slate-700 hover:border-blue-800"
                          title="Edit Balance"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-800"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Profile Modal (Clean, Professional, Data Showing) */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative my-auto">
            {/* Modal Header Background */}
            <div className="h-32 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-t-2xl relative">
              <button 
                onClick={() => setViewingUser(null)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full bg-slate-900/40 hover:bg-slate-900/60 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Avatar positioning */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 flex justify-center">
              <div className="p-1 bg-slate-900 rounded-full">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${viewingUser.id}&backgroundColor=0f172a`} 
                  alt="avatar profile" 
                  className="w-24 h-24 rounded-full border-2 border-cyan-500/50 shadow-lg shadow-cyan-900/50 bg-slate-800"
                />
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-14 pb-8 px-6 sm:px-8 text-center">
              <h3 className="text-2xl font-black text-white">{viewingUser.username || 'Anonymous User'}</h3>
              <p className="text-sm text-cyan-400 font-mono mt-1">ID: {viewingUser.id}</p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {/* Balance Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Balance</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1">${Number(viewingUser.balance).toFixed(2)}</span>
                </div>

                {/* Total Earned Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                  <DollarSign className="w-6 h-6 text-cyan-400 mb-2" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Earned</span>
                  <span className="text-xl font-bold text-cyan-400 mt-1">${Number(viewingUser.total_earned).toFixed(2)}</span>
                </div>
              </div>

              {/* Detailed List Stats */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center bg-slate-800/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center text-slate-400"><Activity className="w-4 h-4 mr-2" /> <span className="text-sm font-semibold">Ads Watched Today</span></div>
                  <span className="text-white font-bold">{viewingUser.ads_watched_today} / 20</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-800/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center text-slate-400"><Zap className="w-4 h-4 mr-2" /> <span className="text-sm font-semibold">Total Ads (Est.)</span></div>
                  <span className="text-white font-bold">{Math.floor(Number(viewingUser.total_earned) / 0.10)}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-800/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center text-slate-400"><Calendar className="w-4 h-4 mr-2" /> <span className="text-sm font-semibold">Join Date</span></div>
                  <span className="text-white font-bold text-sm">{new Date(viewingUser.created_at).toLocaleDateString()} {new Date(viewingUser.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-800">
                <button 
                  onClick={() => {
                    setViewingUser(null);
                    handleEditClick(viewingUser);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit User Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Preserved existing functionality) */}
      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit <span className="text-cyan-400">@{editingUser.username || editingUser.id}</span></h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({...editForm, balance: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Earned ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.total_earned}
                  onChange={(e) => setEditForm({...editForm, total_earned: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ads Watched Today</label>
                <input
                  type="number"
                  value={editForm.ads_watched_today}
                  onChange={(e) => setEditForm({...editForm, ads_watched_today: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center mt-6 shadow-lg shadow-cyan-500/20"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Check className="w-5 h-5 mr-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
