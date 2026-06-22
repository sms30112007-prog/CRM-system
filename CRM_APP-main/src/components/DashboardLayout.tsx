'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Aura CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Middleware will redirect, but prevent flash

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-950/20 p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
