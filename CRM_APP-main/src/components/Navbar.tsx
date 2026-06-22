'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Bell, Search, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="h-16 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between px-8 shrink-0">
      {/* Search Bar - Aesthetic */}
      <div className="relative w-64 max-w-xs hidden sm:block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search CRM..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>
      <div className="sm:hidden"></div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        {/* Notifications Mock */}
        <button className="relative p-1 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 border-2 border-slate-950 rounded-full"></span>
        </button>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-slate-300">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/45 text-slate-300 border border-slate-700/60 rounded-lg text-xs font-semibold focus:outline-none transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
