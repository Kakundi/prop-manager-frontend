'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'DASHBOARD', href: '/super-admin/dashboard', icon: '📊' },
    { name: 'ADD USERS', href: '/super-admin/users', icon: '👤' },
    { name: 'UNASSIGNED PAYMENTS', href: '/super-admin/unassigned-payments', icon: '💳' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* SIDE MENU */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wider text-indigo-400">
              SaaS Admin Portal
            </h1>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
              SA
            </div>
            <div>
              <p className="text-xs font-bold text-white">Superadmin</p>
              <p className="text-[10px] text-slate-400">System Controller</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN MENU / CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-200">
            Welcome Back, <span className="text-indigo-400 font-bold">Brian Nyamai</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
              SYSTEM LIVE
            </span>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
              Logout
            </button>
          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}