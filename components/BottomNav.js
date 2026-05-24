// components/BottomNav.js
'use client';

import React from 'react';
import { Tv, Wallet, Users } from 'lucide-react';
import { useTelegram } from './TelegramContext';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { hapticFeedback } = useTelegram();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Earn',
      icon: Tv,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
    },
    {
      id: 'invite',
      label: 'Invite',
      icon: Users,
    },
  ];

  const handleTabClick = (tabId) => {
    if (activeTab !== tabId) {
      hapticFeedback.selection();
      setActiveTab(tabId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2 bg-slate-950/80 backdrop-blur-lg border-t border-slate-900">
      <div className="max-w-[420px] mx-auto flex justify-around items-center h-14 bg-slate-900/60 rounded-2xl border border-slate-800/80 px-2 shadow-xl shadow-black/40">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 active:scale-95 hover:text-slate-300'
              }`}
            >
              {/* Sleek active backdrop glow indicator */}
              {isActive && (
                <span className="absolute inset-0 bg-cyan-950/30 rounded-xl animate-fade-in -z-10" />
              )}
              
              <IconComponent 
                className={`w-[22px] h-[22px] transition-transform duration-300 ${
                  isActive ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                }`} 
              />
              <span className="text-[10px] font-medium mt-1 tracking-wider uppercase">
                {item.label}
              </span>

              {/* Active top line dot */}
              {isActive && (
                <span className="absolute top-0 w-4 h-[2px] bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
