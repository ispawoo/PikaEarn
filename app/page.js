// app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useTelegram } from '@/components/TelegramContext';
import BottomNav from '@/components/BottomNav';
import DashboardScreen from '@/components/DashboardScreen';
import WalletScreen from '@/components/WalletScreen';
import InviteScreen from '@/components/InviteScreen';
import { Loader2, Settings, Zap } from 'lucide-react';

export default function Home() {
  const { user, initData, isTelegramClient, setMockUserId, isReady } = useTelegram();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userState, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [devInputId, setDevInputId] = useState('777777');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag on client side to guarantee safe hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load profile from API route on startup, user change, or manual refresh
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isReady || !initData) return;

      setIsLoading(true);
      setErrorMsg(null);

      // Parse referral code if present
      let referredBy = null;
      
      // 1. Try extracting from URL search parameters (e.g., standard browser launch)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        referredBy = urlParams.get('referred_by') || urlParams.get('startapp') || urlParams.get('start_param');
      }
      
      // 2. Try extracting from Telegram's native safe launch parameters
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        referredBy = window.Telegram.WebApp.initDataUnsafe.start_param;
      }

      try {
        const queryParams = new URLSearchParams({
          initData: initData,
        });
        
        if (referredBy) {
          queryParams.append('referred_by', referredBy);
        }

        const response = await fetch(`/api/user?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `tma ${initData}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch user profile');
        }

        setUserState(result.user);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setErrorMsg(err.message || 'Network error loading PikaEarn profile.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, initData, isReady]);

  // Dev ID update submission
  const handleDevIdUpdate = (e) => {
    e.preventDefault();
    if (devInputId.trim()) {
      setMockUserId(devInputId.trim());
      setShowDevPanel(false);
    }
  };

  // Main UI Loading states
  if (!mounted || !isReady || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-slate-400 animate-pulse">Initializing PikaEarn...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-14 h-14 bg-red-950/20 border border-red-800/40 text-red-500 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">Initialization Failed</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-5 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-850 active:scale-95 text-slate-300 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex justify-center items-start">
      {/* Centered responsive viewport limits container */}
      <div className="w-full max-w-[450px] min-h-screen flex flex-col bg-slate-950/20 border-x border-slate-900/60 shadow-2xl relative px-4 pt-4 pb-20">
        
        {/* Floating Local Browser Dev Pill */}
        {!isTelegramClient && (
          <div className="mb-4">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-cyan-400 flex items-center">
                  <Zap className="w-3.5 h-3.5 mr-1 animate-pulse" />
                  DEVELOPER TEST CONSOLE
                </span>
                <button
                  onClick={() => setShowDevPanel(!showDevPanel)}
                  className="text-[10px] text-slate-400 font-bold hover:underline flex items-center"
                >
                  <Settings className="w-3 h-3 mr-0.5" />
                  {showDevPanel ? 'Close Config' : 'Change Profile'}
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-medium">
                Active Mock TG ID: <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">#{user?.id}</code> • 
                Mode: <span className="text-emerald-400 font-semibold uppercase">{userState?.referred_by ? 'Referred Link' : 'Direct Link'}</span>
              </div>

              {showDevPanel && (
                <form onSubmit={handleDevIdUpdate} className="flex space-x-2 mt-1 pt-1.5 border-t border-slate-800/40">
                  <input
                    type="text"
                    value={devInputId}
                    onChange={(e) => setDevInputId(e.target.value)}
                    placeholder="Enter Mock Telegram User ID (e.g. 999999)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-cyan-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs hover:brightness-110 active:scale-95"
                  >
                    Set ID
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Screen Routing switches */}
        {activeTab === 'dashboard' && userState && (
          <DashboardScreen 
            userState={userState} 
            setUserState={setUserState}
          />
        )}
        
        {activeTab === 'wallet' && userState && (
          <WalletScreen 
            userState={userState} 
            setUserState={setUserState}
          />
        )}

        {activeTab === 'invite' && userState && (
          <InviteScreen 
            userState={userState} 
          />
        )}

        {/* Fixed Bottom Glassmorphic Navigation tab bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
