'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  User,
  Trash2,
  ExternalLink,
  X,
  PlusCircle,
  Award,
} from 'lucide-react';
import Link from 'next/link';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';
  revenue: number;
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
};

type Agent = {
  id: string;
  name: string;
  role: string;
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('NEW');
  const [revenue, setRevenue] = useState('0');
  const [assignedToId, setAssignedToId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.filter((u: any) => u.role === 'SALES_EXECUTIVE'));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, [user]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          status,
          revenue: parseFloat(revenue) || 0,
          assignedToId: assignedToId || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        // Clear inputs
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setStatus('NEW');
        setRevenue('0');
        setAssignedToId('');
        // Refresh list
        fetchLeads();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to create lead');
      }
    } catch (err) {
      setModalError('Network error. Try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead? All associated deals and history will be lost.')) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads(leads.filter((l) => l.id !== id));
      } else {
        alert('Failed to delete lead.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'NEW':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'CONTACTED':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case 'QUALIFIED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'LOST':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'CONVERTED':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const filteredLeads = leads.filter((l) => {
    const term = search.toLowerCase();
    const matchesSearch =
      l.name.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      (l.company && l.company.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-400" />
            Leads Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track potential customers, qualify opportunities, and allocate sales representatives.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="glass-panel rounded-2xl glow-card overflow-hidden border border-slate-800/80">
        <div className="p-5 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-64 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Search by name, company, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-850 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950/50 border border-slate-850 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="LOST">Lost</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredLeads.length} of {leads.length} leads
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-350">No leads found</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">
              No matching lead records found. Modify your filters or add a new lead opportunity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/15 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Details</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Est. Revenue</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{l.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{l.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{l.company || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-semibold ${getStatusStyle(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-205">
                      ${l.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300 rounded-full">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {l.assignedTo?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/leads/${l.id}`}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-950/30 hover:text-indigo-400 border border-slate-700/60 hover:border-indigo-900/60 rounded-lg text-slate-400 focus:outline-none transition-colors"
                          title="View Lead Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {user?.role !== 'SALES_EXECUTIVE' && (
                          <button
                            onClick={() => handleDeleteLead(l.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950/30 hover:text-red-400 border border-slate-700/60 hover:border-red-900/60 rounded-lg text-slate-400 focus:outline-none transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl glow-card p-6 border border-slate-800/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Add New Lead Opportunity
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

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clark Kent"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-205 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clark@dailyplanet.com"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-205 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0922"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-205 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Daily Planet"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-255 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="LOST">Lost</option>
                    <option value="CONVERTED">Converted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Est. Value ($)
                  </label>
                  <input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Assign Agent (Managers/Admins only) */}
              {user?.role !== 'SALES_EXECUTIVE' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Sales Representative
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
                {modalLoading ? 'Creating...' : 'Create Lead Opportunity'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
