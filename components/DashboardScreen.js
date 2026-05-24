// components/DashboardScreen.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tv, Sparkles, AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { useTelegram } from './TelegramContext';

export default function DashboardScreen({ userState, setUserState, triggerRefresh }) {
  const { initData, hapticFeedback, showPopup } = useTelegram();
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [showAdPlayer, setShowAdPlayer] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(6); // 6s mock ad view
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [adSuccessReward, setAdSuccessReward] = useState(false);
  const cooldownTimerRef = useRef(null);
  const adTimerRef = useRef(null);

  const { balance, ads_watched_today, last_ad_watched_at, username } = userState;

  // Calculate and trigger cooldown countdown on mount and when last_ad_watched_at or ads_watched_today updates
  useEffect(() => {
    if (last_ad_watched_at) {
      const calculateCooldown = () => {
        const lastWatchedTime = new Date(last_ad_watched_at).getTime();
        const currentTime = Date.now();
        const secondsPassed = Math.floor((currentTime - lastWatchedTime) / 1000);
        
        // Cooldown starts at 30 seconds for the first ad watched, and increases by 30 seconds for each subsequent ad watched today
        const cooldownLimit = (ads_watched_today || 1) * 30; 
        const remaining = Math.max(0, cooldownLimit - secondsPassed);
        
        if (remaining > 0) {
          setCooldownSeconds(remaining);
          
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          
          cooldownTimerRef.current = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(cooldownTimerRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setCooldownSeconds(0);
        }
      };

      calculateCooldown();
    }

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [last_ad_watched_at, ads_watched_today]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, []);

  const handleAdPlayerCompletion = () => {
    setShowAdPlayer(false);
    
    // Check if the real Advertiser SDK script is loaded and active in the window
    if (typeof window !== 'undefined' && typeof window.show_11052758 === 'function') {
      setIsAdLoading(true);
      window.show_11052758('pop')
        .then(() => {
          setIsAdLoading(false);
          claimReward();
        })
        .catch((err) => {
          setIsAdLoading(false);
          hapticFeedback.notification('error');
          console.error('SDK Ad playback interrupted or closed:', err);
          showPopup('Ad Interrupted', 'Please watch the advertisement completely to receive your reward.');
        });
    } else {
      // Direct reward claim (mock fallback)
      claimReward();
    }
  };

  const startAdPlayback = () => {
    if (cooldownSeconds > 0) return;
    if (ads_watched_today >= 20) {
      hapticFeedback.notification('error');
      showPopup('Limit Reached', 'You have reached your daily limit of 20 ads. Come back tomorrow for more!');
      return;
    }

    hapticFeedback.impact('heavy');
    setIsAdLoading(true);

    // Always launch our premium visual mockup player overlay first to verify ad delivery
    setTimeout(() => {
      setIsAdLoading(false);
      setShowAdPlayer(true);
      setAdSecondsLeft(6);
      
      if (adTimerRef.current) clearInterval(adTimerRef.current);
      
      adTimerRef.current = setInterval(() => {
        setAdSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(adTimerRef.current);
            handleAdPlayerCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);
  };

  const claimReward = async () => {
    try {
      const response = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: initData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim reward');
      }

      hapticFeedback.notification('success');
      
      // Animate balance rollup locally
      if (result.isMock) {
        // Mock state updates
        const nextBalance = parseFloat(balance) + 0.10;
        const nextCount = ads_watched_today + 1;
        setUserState((prev) => ({
          ...prev,
          balance: nextBalance.toFixed(2),
          total_earned: (parseFloat(prev.total_earned) + 0.10).toFixed(2),
          ads_watched_today: nextCount,
          last_ad_watched_at: new Date().toISOString()
        }));
      } else {
        // Sync direct server state
        setUserState((prev) => ({
          ...prev,
          balance: result.balance,
          ads_watched_today: result.ads_watched_today,
          last_ad_watched_at: result.last_ad_watched_at,
          friends_count: result.friends_count,
          referral_earned: result.referral_earned
        }));
      }

      // Close player and trigger visual success micro-animations
      setShowAdPlayer(false);
      setAdSuccessReward(true);
      setTimeout(() => setAdSuccessReward(false), 3500);
      
    } catch (err) {
      hapticFeedback.notification('error');
      setShowAdPlayer(false);
      showPopup('Error', err.message || 'Failed to complete ad. Please try again.');
    }
  };

  // Circular gauge parameter calculation
  const dailyLimit = 20;
  const progressPercent = Math.min(100, (ads_watched_today / dailyLimit) * 100);
  const strokeDashoffset = 220 - (220 * progressPercent) / 100;

  return (
    <div className="flex flex-col space-y-5 flex-1 pb-24">
      {/* Header Profile card */}
      <div className="flex justify-between items-center bg-slate-900/40 rounded-2xl p-4 border border-slate-900/60 glass-panel">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-800/40">
            <span className="text-cyan-400 font-bold text-lg uppercase">
              {username ? username.substring(0, 2) : 'PE'}
            </span>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Hello, earner</div>
            <div className="text-sm font-semibold text-slate-50">@{username || 'PikaUser'}</div>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-cyan-950/40 rounded-full border border-cyan-800/20 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LVL 1</span>
        </div>
      </div>

      {/* Reward Success Popup overlay */}
      {adSuccessReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center w-full max-w-sm glass-panel glow-amber">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <CheckCircle2 className="w-9 h-9 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-1">Ad Completed!</h3>
            <p className="text-sm text-slate-400 mb-4">You have successfully watched the ad.</p>
            <div className="bg-slate-950/80 rounded-2xl py-3 px-4 border border-slate-800 inline-block">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Reward Credited</span>
              <span className="text-2xl font-black text-amber-400">+$0.10 USD</span>
            </div>
          </div>
        </div>
      )}

      {/* Full screen Video Ad Player Overlay */}
      {showAdPlayer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black px-6 py-10 animate-scale-up">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">Live Ad Stream</span>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md rounded-full px-3.5 py-1 text-xs font-bold text-white border border-slate-800">
              Closes in {adSecondsLeft}s
            </div>
          </div>

          {/* Ad content body representation */}
          <div className="flex-1 flex flex-col items-center justify-center my-10 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 to-slate-950/40 rounded-3xl" />
            
            {/* Visual playback animation */}
            <div className="w-32 h-32 rounded-full bg-cyan-950/20 border-2 border-dashed border-cyan-500/30 flex items-center justify-center spin-slow mb-6" />
            <div className="absolute flex flex-col items-center justify-center text-center px-4">
              <Tv className="w-14 h-14 text-cyan-400 animate-pulse mb-3" />
              <h4 className="text-lg font-bold text-slate-100 mb-1">PIKA ADVERTISING SYSTEM</h4>
              <p className="text-xs text-slate-400 max-w-[200px]">Simulating premium video stream and ad delivery verification...</p>
            </div>
            
            {/* Visual equalizer wave */}
            <div className="flex items-center space-x-1.5 mt-8 h-8">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.6, 0.9, 0.5].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h * 100}%` }}
                  className="w-1 bg-cyan-400/60 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            Please watch completely to ensure credit validation.
          </div>
        </div>
      )}

      {/* Big balance card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-cyan-900/20 to-slate-950 rounded-3xl p-6 border border-cyan-800/20 shadow-lg shadow-black/30 glass-card">
        {/* Subtle grid elements */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0891b2_1px,transparent_1px),linear-gradient(to_bottom,#0891b2_1px,transparent_1px)] bg-[size:14px_24px]" />
        
        <div className="relative text-center flex flex-col items-center py-2">
          <span className="text-[11px] font-bold text-cyan-400/80 tracking-widest uppercase mb-1">Balance Available</span>
          <div className="text-4xl font-extrabold text-white tracking-tight flex items-baseline justify-center">
            <span className="text-2xl text-cyan-400 font-bold mr-1">$</span>
            <span className="text-5xl font-black">{parseFloat(balance || 0).toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-medium ml-1.5 uppercase">USD</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1 justify-center bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
            <span>Daily ad profit rate:</span>
            <span className="text-cyan-400 font-bold">$0.10/ad</span>
          </p>
        </div>
      </div>

      {/* Gauge and Limits Card */}
      <div className="bg-slate-900/30 rounded-3xl p-5 border border-slate-900/60 glass-panel flex flex-col items-center text-center">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Daily Progress Gauge</h4>
        
        {/* Circular Gauge Graphic */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="72"
              cy="72"
              r="60"
              stroke="#1e293b"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Value ring */}
            <circle
              cx="72"
              cy="72"
              r="60"
              stroke="#06b6d4"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="377"
              strokeDashoffset={377 - (377 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white">{ads_watched_today}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">of 20 Ads</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-slate-800/40 pt-4">
          <div className="text-left bg-slate-950/40 p-3 rounded-2xl border border-slate-800/20">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Daily Limit</span>
            <span className="text-sm font-bold text-slate-200">20 Ad Views</span>
          </div>
          <div className="text-left bg-slate-950/40 p-3 rounded-2xl border border-slate-800/20">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Remaining</span>
            <span className="text-sm font-bold text-cyan-400">{20 - ads_watched_today} Ads</span>
          </div>
        </div>
      </div>

      {/* Watch Ad Action Button Area */}
      <div className="pt-2">
        {cooldownSeconds > 0 ? (
          <button
            disabled
            className="w-full h-15 rounded-2xl bg-slate-800/50 border border-slate-800 text-slate-500 font-bold flex items-center justify-center space-x-2 transition-all cursor-not-allowed"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              {/* Spinning countdown circular stroke */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-700/50" />
              <div 
                className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" 
                style={{ animationDuration: '1.5s' }}
              />
            </div>
            <span>Cooldown: {cooldownSeconds}s</span>
          </button>
        ) : ads_watched_today >= 20 ? (
          <button
            disabled
            className="w-full h-15 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-500 font-bold flex items-center justify-center space-x-2 cursor-not-allowed"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Daily Limit Reached</span>
          </button>
        ) : (
          <button
            onClick={startAdPlayback}
            disabled={isAdLoading}
            className={`w-full h-15 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-extrabold text-base flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-98 transition-all relative overflow-hidden ${
              isAdLoading ? 'brightness-90' : 'pulse-glow-button glow-cyan'
            }`}
          >
            {isAdLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading Video...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>WATCH AD & EARN $0.10</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
