'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Layers,
  CheckSquare,
  UserPlus,
  Shield,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const links = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: TrendingUp,
      roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
    },
    {
      name: 'Sales Pipeline',
      href: '/pipeline',
      icon: Layers,
      roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
    },
    {
      name: 'Tasks & Activities',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
    },
    {
      name: 'User Directory',
      href: '/admin/users',
      icon: UserPlus,
      roles: ['ADMIN'],
    },
  ];

  const visibleLinks = links.filter((link) => link.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col h-full shrink-0">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-base">A</span>
          </div>
          <div>
            <span className="font-semibold text-white tracking-wide">Aura</span>
            <span className="text-indigo-400 font-medium">CRM</span>
          </div>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        {visibleLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 pl-2.5'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile brief */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
            <span className="font-semibold text-indigo-400 text-sm">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase truncate">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
