'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Layers,
  Plus,
  DollarSign,
  TrendingUp,
  Building,
  User,
  PlusCircle,
  X,
  Sparkles,
} from 'lucide-react';

type Deal = {
  id: string;
  title: string;
  value: number;
  stage: 'PROSPECT' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  customerId?: string | null;
  customer?: { name: string; company?: string | null } | null;
  leadId?: string | null;
  lead?: { name: string; company?: string | null } | null;
  assignedTo?: { id: string; name: string } | null;
};

type Customer = { id: string; name: string; company?: string | null };
type Lead = { id: string; name: string; company?: string | null };
type Agent = { id: string; name: string; role: string };

const STAGES = ['PROSPECT', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;

export default function PipelinePage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<typeof STAGES[number]>('PROSPECT');
  const [linkType, setLinkType] = useState<'CUSTOMER' | 'LEAD'>('CUSTOMER');
  const [linkedId, setLinkedId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkOptions = async () => {
    try {
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        setCustomers(await custRes.json());
      }
      const leadRes = await fetch('/api/leads');
      if (leadRes.ok) {
        const leadsData = await leadRes.json();
        // Only link unconverted leads
        setLeads(leadsData.filter((l: any) => l.status !== 'CONVERTED'));
      }
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAgents(usersData.filter((u: any) => u.role === 'SALES_EXECUTIVE'));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchLinkOptions();
  }, [user]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: typeof STAGES[number]) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    // Optimistic UI update
    const previousDeals = [...deals];
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d))
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (!res.ok) {
        // Rollback on error
        setDeals(previousDeals);
        alert('Failed to update deal stage.');
      } else {
        // Refresh to fetch any triggered side-effects (e.g. payment creation for WON)
        fetchDeals();
      }
    } catch (err) {
      setDeals(previousDeals);
      alert('Network error updating deal.');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    const payload = {
      title,
      value: parseFloat(value) || 0,
      stage,
      customerId: linkType === 'CUSTOMER' ? linkedId || null : null,
      leadId: linkType === 'LEAD' ? linkedId || null : null,
      assignedToId: assignedToId || undefined,
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setValue('');
        setStage('PROSPECT');
        setLinkedId('');
        setAssignedToId('');
        fetchDeals();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to create deal.');
      }
    } catch (err) {
      setModalError('Network error. Try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const getStageHeaderColor = (s: typeof STAGES[number]) => {
    switch (s) {
      case 'PROSPECT':
        return 'border-t-2 border-slate-500';
      case 'DISCOVERY':
        return 'border-t-2 border-blue-500';
      case 'PROPOSAL':
        return 'border-t-2 border-indigo-500';
      case 'NEGOTIATION':
        return 'border-t-2 border-amber-500';
      case 'WON':
        return 'border-t-2 border-emerald-500';
      case 'LOST':
        return 'border-t-2 border-red-500';
    }
  };

  const getStageTotalValue = (stageDeals: Deal[]) => {
    return stageDeals.reduce((sum, d) => sum + d.value, 0);
  };

  return (
    <DashboardLayout>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-400" />
            Sales Pipeline
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Drag and drop deals across stages to progress opportunities and record sales.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Create Deal
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Kanban Grid */
        <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[480px]">
          {STAGES.map((s) => {
            const stageDeals = deals.filter((d) => d.stage === s);
            const totalValue = getStageTotalValue(stageDeals);

            return (
              <div
                key={s}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, s)}
                className={`w-72 shrink-0 bg-slate-900/35 rounded-2xl border border-slate-900 flex flex-col p-4 ${getStageHeaderColor(
                  s
                )}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">{s}</h3>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{stageDeals.length} Deals</p>
                  </div>
                  <span className="text-xs font-bold text-slate-350">
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="border border-dashed border-slate-800/60 rounded-xl py-8 text-center text-[10px] text-slate-600">
                      Drag deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative border-l-2 border-l-indigo-500/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-bold text-slate-205 group-hover:text-white leading-snug truncate">
                            {deal.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-indigo-400">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          <span>{deal.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Associated client */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                          <div className="flex items-center gap-1 truncate max-w-[130px]">
                            <Building className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="truncate">
                              {deal.customer?.company || deal.lead?.company || deal.customer?.name || deal.lead?.name || 'No Client'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <User className="w-3 h-3 text-indigo-500/60 shrink-0" />
                            <span className="truncate max-w-[70px]">{deal.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                        </div>

                        {deal.stage === 'WON' && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow shadow-emerald-500/55"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl glow-card p-6 border border-slate-800/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Create Sales Opportunity
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-950/20 border border-red-900/40 text-red-400 p-3 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cloud License Upgrade"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deal Value ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as typeof STAGES[number])}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-350 focus:outline-none focus:border-indigo-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linking */}
              <div className="p-3 bg-slate-900/25 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Link Deal To:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('CUSTOMER');
                      setLinkedId('');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      linkType === 'CUSTOMER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('LEAD');
                      setLinkedId('');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      linkType === 'LEAD' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Lead
                  </button>
                </div>

                <select
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select linked profile...</option>
                  {linkType === 'CUSTOMER'
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))
                    : leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.company ? `(${l.company})` : ''}
                        </option>
                      ))}
                </select>
              </div>

              {/* Assign Representative (Manager/Admin) */}
              {user?.role !== 'SALES_EXECUTIVE' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Agent
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-350 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned / Select Agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all duration-200"
              >
                {modalLoading ? 'Creating...' : 'Create Sales Opportunity'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
