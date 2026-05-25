'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ balance: '', total_earned: '', ads_watched_today: '' });
  const [isSaving, setIsSaving] = useState(false);

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
        // Update local state
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
          <p className="text-slate-400 text-sm mt-1">View, edit balances, and remove users</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User ID / Name</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Total Earned</th>
                <th className="px-6 py-4">Ads Today</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{user.username || 'No Name'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">${Number(user.balance).toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">${Number(user.total_earned).toFixed(2)}</td>
                    <td className="px-6 py-4">{user.ads_watched_today} / 20</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 bg-slate-800 hover:bg-cyan-900/50 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700 hover:border-cyan-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-800"
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit User <span className="text-cyan-400">#{editingUser.id}</span></h3>
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
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center mt-6"
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
