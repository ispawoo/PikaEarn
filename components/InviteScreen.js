// components/InviteScreen.js
'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, Flame } from 'lucide-react';
import { useTelegram } from './TelegramContext';

export default function InviteScreen({ userState }) {
  const { hapticFeedback, showPopup, webApp } = useTelegram();
  const [copied, setCopied] = useState(false);

  const { id, friends_count, referral_earned } = userState;
  
  // Construct user's referral link
  const botUsername = 'PikaEarn_bot'; // Matches configuration
  const referralLink = `https://t.me/${botUsername}/app?startapp=${id || '777777'}`;
  const shareText = `🎁 Watch ads and earn real cash! Join PikaEarn with my link and withdraw instantly starting from $5.00! 🚀`;

  const handleCopy = () => {
    hapticFeedback.impact('medium');
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopyText(referralLink);
        });
    } else {
      fallbackCopyText(referralLink);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showPopup('Copy Failed', 'Please highlight and copy the link manually.');
    }
    document.body.removeChild(textArea);
  };

  const handleShare = () => {
    hapticFeedback.impact('heavy');

    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    
    if (webApp && webApp.openTelegramLink) {
      // Fires Telegram's native contact forward selection sheet
      webApp.openTelegramLink(tgShareUrl);
    } else {
      // Fallback: open in new window
      window.open(tgShareUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col space-y-5 flex-1 pb-24">
      {/* Visual Referral Promo banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/40 via-cyan-900/10 to-slate-950 rounded-3xl p-6 border border-cyan-800/15 glass-card text-center flex flex-col items-center">
        {/* Glowing background blob */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl" />
        
        <div className="w-14 h-14 bg-cyan-950/60 rounded-full flex items-center justify-center border border-cyan-800/30 text-cyan-400 mb-3.5 relative">
          <Gift className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[8px] font-black items-center justify-center text-slate-950">10%</span>
          </span>
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-50 tracking-tight">Invite Friends & Earn!</h2>
        <p className="text-xs text-slate-400 max-w-[250px] mx-auto mt-2 leading-relaxed">
          Get a <span className="text-cyan-400 font-bold">10% lifetime bonus</span> of whatever your referred friends earn. Payouts are paid instantly!
        </p>

        {/* Dynamic rule tracker */}
        <div className="flex items-center space-x-2 mt-4 bg-slate-950/60 border border-slate-900/80 rounded-full px-4 py-1.5 text-[10px] font-bold text-slate-400">
          <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>FRIEND WATCHES = YOU GET PAID ATOMICALY</span>
        </div>
      </div>

      {/* Referral Link Copy Section */}
      <div className="bg-slate-900/30 rounded-3xl p-5 border border-slate-900/60 glass-panel">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Your Custom Referral Link</h3>

        <div className="flex space-x-2">
          <div className="flex-1 h-11 bg-slate-950 border border-slate-850 rounded-xl px-3.5 flex items-center overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-400 select-all">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              copied 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
            }`}
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Dual Column Stats Module */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/30 p-4 rounded-3xl border border-slate-900/60 glass-panel flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-2xl bg-cyan-950/40 border border-cyan-800/10 flex items-center justify-center text-cyan-400 mb-2">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Friends Invited</span>
          <span className="text-2xl font-black text-slate-100 mt-1">{friends_count || 0}</span>
        </div>

        <div className="bg-slate-900/30 p-4 rounded-3xl border border-slate-900/60 glass-panel flex flex-col items-center text-center">
          <div className="w-9 h-9 rounded-2xl bg-amber-950/30 border border-amber-900/10 flex items-center justify-center text-amber-500 mb-2">
            <Gift className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Bonus Earned</span>
          <span className="text-2xl font-black text-amber-400 mt-1">
            ${parseFloat(referral_earned || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Floating CTA Share Button */}
      <div className="pt-2">
        <button
          onClick={handleShare}
          className="w-full h-13 rounded-2xl bg-cyan-500 hover:brightness-105 active:scale-98 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg glow-cyan"
        >
          <Share2 className="w-4 h-4 stroke-[2.5px]" />
          <span>INVITE FRIENDS NOW</span>
        </button>
      </div>
    </div>
  );
}
