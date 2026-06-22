'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
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
} from 'lucide-react';
import Link from 'next/link';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
};

type Agent = {
  id: string;
  name: string;
  role: string;
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
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
    fetchCustomers();
    fetchAgents();
  }, [user]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
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
        setAssignedToId('');
        // Refresh list
        fetchCustomers();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to create customer');
      }
    } catch (err) {
      setModalError('Network error. Try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? All associated deals and tasks will be removed.')) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomers(customers.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete customer.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.company && c.company.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            Customers Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain accounts, edit details, and view relationship interaction history.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="glass-panel rounded-2xl glow-card overflow-hidden border border-slate-800/80">
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
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
          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredCustomers.length} of {customers.length} records
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-350">No customers found</h3>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">
              Try modifying your search filter or add a new customer record to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/15 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Assigned Representative</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {c.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.company || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-355 rounded-full">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {c.assignedTo?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/customers/${c.id}`}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-950/30 hover:text-indigo-400 border border-slate-700/60 hover:border-indigo-900/60 rounded-lg text-slate-400 focus:outline-none transition-colors"
                          title="View Profile History"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {user?.role !== 'SALES_EXECUTIVE' && (
                          <button
                            onClick={() => handleDeleteCustomer(c.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-950/30 hover:text-red-400 border border-slate-700/60 hover:border-red-900/60 rounded-lg text-slate-400 focus:outline-none transition-colors"
                            title="Delete Customer"
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl glow-card p-6 border border-slate-800/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Add New Customer
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

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bruce Wayne"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
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
                  placeholder="bruce@waynecorp.com"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
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
                  placeholder="Wayne Enterprises"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Assign Agent (Managers/Admins only) */}
              {user?.role !== 'SALES_EXECUTIVE' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Sales Agent
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
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
                {modalLoading ? 'Creating...' : 'Create Customer Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
