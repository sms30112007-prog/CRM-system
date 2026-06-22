'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  Users,
  DollarSign,
  UserCheck,
  CheckCircle,
  Briefcase,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import Link from 'next/link';

type DashboardData = {
  role: 'ADMIN' | 'MANAGER' | 'SALES_EXECUTIVE';
  metrics: {
    totalUsers?: number;
    totalCustomers?: number;
    totalRevenue: number;
    conversionRate: number;
    assignedLeads?: number;
    dealsInProgress?: number;
    completedDeals?: number;
    pendingTasks?: number;
  };
  charts: {
    leadStatus?: { status: string; count: number }[];
    pipeline: { stage: string; count: number; value: number }[];
    agentPerformance?: { name: string; wonCount: number; totalSales: number }[];
    monthlyHistory?: { name: string; revenue: number }[];
  };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const reportData = await res.json();
          setData(reportData);
        } else {
          setError('Failed to fetch dashboard reports.');
        }
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'No dashboard data available.'}</span>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, charts } = data;
  const isSales = data.role === 'SALES_EXECUTIVE';

  // SVG Chart Calculation Helpers
  const maxRevenueHistory = charts.monthlyHistory
    ? Math.max(...charts.monthlyHistory.map((h) => h.revenue), 1)
    : 1;

  const maxPipelineVal = Math.max(...charts.pipeline.map((p) => p.value), 1);

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time analytics and customer relations summary. Logged in as{' '}
            <span className="text-indigo-400 font-semibold">{user?.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {data.role.replace('_', ' ')} MODE
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSales ? (
          <>
            {/* Sales Exec Metrics */}
            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Leads</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.assignedLeads}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deals In Progress</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.dealsInProgress}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Won Deals</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.completedDeals}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Admin / Manager Metrics */}
            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">
                    ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Conversion</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{metrics.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts / Data Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Column: occupies 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Over Time / General Chart */}
          {!isSales && charts.monthlyHistory && (
            <div className="glass-panel rounded-2xl p-6 glow-card">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
                Revenue History (Last 6 Months)
              </h3>
              
              {/* Responsive SVG Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                {charts.monthlyHistory.map((h, i) => {
                  const percentage = (h.revenue / maxRevenueHistory) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div className="w-full relative flex flex-col justify-end h-48">
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 text-white text-[11px] font-bold py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-25">
                          ${h.revenue.toLocaleString()}
                        </div>
                        <div
                          style={{ height: `${percentage}%` }}
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 rounded-lg transition-all duration-500"
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium mt-3">{h.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal Pipeline Value Bar Chart */}
          <div className="glass-panel rounded-2xl p-6 glow-card">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
              {isSales ? 'My Sales Pipeline' : 'Total Deal Pipeline Value'}
            </h3>

            {/* Horizontal Bar Chart */}
            <div className="space-y-4">
              {charts.pipeline.map((p) => {
                const percentage = (p.value / maxPipelineVal) * 100;
                return (
                  <div key={p.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">{p.stage}</span>
                      <span className="text-slate-400">
                        {p.count} deals • ${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Data Column: occupies 1 column */}
        <div className="space-y-6">
          {isSales ? (
            /* Sales Executives: Tasks & Shortcut Module */
            <div className="glass-panel rounded-2xl p-6 glow-card flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-indigo-400" />
                  Action Items
                </h3>
                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View All
                </Link>
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-xs text-slate-400">
                  You have <span className="text-indigo-400 font-bold">{metrics.pendingTasks}</span> pending tasks. Keep track of customer callbacks and meetings.
                </p>

                <div className="space-y-2 mt-4">
                  <Link
                    href="/leads"
                    className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-colors"
                  >
                    <span>Manage My Leads</span>
                    <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full font-bold">
                      {metrics.assignedLeads}
                    </span>
                  </Link>

                  <Link
                    href="/pipeline"
                    className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-colors"
                  >
                    <span>My Deals Board</span>
                    <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded-full font-bold">
                      {metrics.dealsInProgress}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Admin/Manager: Lead Status Breakdown & Agent Leaderboard */
            <div className="space-y-6">
              {/* Lead Status (Bar breakdown) */}
              {charts.leadStatus && (
                <div className="glass-panel rounded-2xl p-6 glow-card">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">
                    Lead Status Split
                  </h3>
                  <div className="space-y-3.5">
                    {charts.leadStatus.map((ls) => {
                      const totalLeads = charts.leadStatus!.reduce((sum, item) => sum + item.count, 0) || 1;
                      const percentage = (ls.count / totalLeads) * 100;
                      return (
                        <div key={ls.status} className="flex items-center justify-between gap-4">
                          <span className="text-xs font-semibold text-slate-400 w-20">{ls.status}</span>
                          <div className="flex-1 h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/40">
                            <div
                              style={{ width: `${percentage}%` }}
                              className="h-full bg-indigo-500 rounded-full"
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-300 w-8 text-right">{ls.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agent Leaderboard */}
              {charts.agentPerformance && (
                <div className="glass-panel rounded-2xl p-6 glow-card">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Agent Sales Performance
                  </h3>
                  <div className="divide-y divide-slate-800/60">
                    {charts.agentPerformance.map((agent, index) => (
                      <div key={index} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{agent.name}</p>
                            <p className="text-[10px] text-slate-500">{agent.wonCount} won deals</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-400">
                          ${agent.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
