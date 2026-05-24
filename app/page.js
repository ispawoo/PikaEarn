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
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Securing handshake...');

  // Set mounted flag on client side to guarantee safe hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Branded Splash Screen progress bar animator
  useEffect(() => {
    if (isLoading) {
      setLoadProgress(0);
      setLoadingText('Securing handshake...');
      const interval = setInterval(() => {
        setLoadProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            return 98;
          }
          const next = prev + Math.floor(Math.random() * 12) + 6;
          if (next > 25 && next < 55) {
            setLoadingText('Synchronizing earnings ledger...');
          } else if (next >= 55 && next < 80) {
            setLoadingText('Connecting advertiser network...');
          } else if (next >= 80) {
            setLoadingText('Finalizing handshake...');
          }
          return Math.min(100, next);
        });
      }, 70);
      return () => clearInterval(interval);
    } else {
      setLoadProgress(100);
    }
  }, [isLoading]);

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

  // Main UI Loading states (Premium Branded Splash Screen)
  if (!mounted || !isReady || isLoading || loadProgress < 100) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center px-6 py-16 text-slate-200">
        {/* Top spacer */}
        <div />

        {/* Center Content: Brand Logo & Title */}
        <div className="flex flex-col items-center max-w-[280px] text-center animate-scale-up">
          {/* Glowing Branded Logo Badge */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            {/* Spinning background rings */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/20 spin-slow" />
            <div className="absolute inset-2 rounded-full border border-cyan-800/10" />
            
            {/* Center Glowing Badge */}
            <div className="w-20 h-20 rounded-3xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shadow-2xl shadow-cyan-500/10 glow-cyan">
              <Zap className="w-10 h-10 text-cyan-400 animate-pulse stroke-[2.25]" />
            </div>
            
            {/* Tiny accent spark tags */}
            <span className="absolute top-2 right-2 text-cyan-400 text-xs animate-ping">✨</span>
            <span className="absolute bottom-4 left-2 text-amber-500 text-xs animate-bounce" style={{ animationDuration: '2s' }}>⚡</span>
          </div>

          {/* Branded Title */}
          <h1 className="text-3xl font-black tracking-tight text-white uppercase block">
            Pika<span className="text-cyan-400">Earn</span>
          </h1>
          <p className="text-[11px] text-cyan-500/80 font-bold uppercase tracking-widest mt-1.5 flex items-center space-x-1">
            <span>Watch Ads</span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full inline-block" />
            <span>Earn USD</span>
          </p>
        </div>

        {/* Bottom Content: Loading Indicators & Legal */}
        <div className="w-full max-w-[240px] flex flex-col items-center space-y-4">
          {/* Progress Bar Container */}
          <div className="w-full">
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-900/60">
              <div 
                style={{ width: `${loadProgress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-center mt-2.5 animate-pulse">
              {loadingText} ({loadProgress}%)
            </span>
          </div>

          <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest pt-4 border-t border-slate-900/40 w-full text-center">
            🔒 SECURE TELEGRAM PAYOUTS
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    const isAuthError = errorMsg.includes('Hash parameter is missing') || errorMsg.includes('Unauthorized');
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        {isAuthError ? (
          <div className="flex flex-col items-center max-w-[320px] mx-auto animate-scale-up">
            <div className="w-16 h-16 bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 rounded-2xl flex items-center justify-center mb-5 glow-cyan">
              <span className="text-3xl">🛡️</span>
            </div>
            <h2 className="text-xl font-black text-slate-50 tracking-tight">Security Check Active</h2>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              This is a secure production deployment of <span className="text-cyan-400 font-bold">PikaEarn</span>.
            </p>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-900">
              To safeguard user balances and prevent unauthorized exploits, you must launch this application from your native **Telegram Bot WebApp button**.
            </p>
            
            <div className="w-full space-y-2 mt-7">
              <a
                href="https://t.me/PikaEarn_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 bg-cyan-500 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg active:scale-98 transition-all hover:brightness-105"
              >
                Launch in Telegram
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-850 active:scale-98 transition-all"
              >
                Refresh Session
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-scale-up mx-auto">
            <div className="w-14 h-14 bg-red-950/20 border border-red-800/40 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">Initialization Failed</h2>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed mx-auto">{errorMsg}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-5 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-850 active:scale-95 text-slate-300 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}
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
