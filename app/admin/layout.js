'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Do not show sidebar on login page
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">{children}</div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center glow-cyan">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Pika<span className="text-cyan-400">Admin</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-900/50"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-950 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
