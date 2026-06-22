'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  History,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  PhoneCall,
  MailWarning,
  Bookmark,
  CheckCircle,
  TrendingUp,
  CheckSquare,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

type Activity = {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  description: string;
  createdAt: string;
  user: { name: string };
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string | null;
};

type LeadDetail = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'CONVERTED';
  revenue: number;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  activities: Activity[];
  tasks: Task[];
};

type Agent = {
  id: string;
  name: string;
  role: string;
};

export default function LeadDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const router = useRouter();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editStatus, setEditStatus] = useState('NEW');
  const [editRevenue, setEditRevenue] = useState('0');
  const [editAssignedId, setEditAssignedId] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // New Activity Log state
  const [activityType, setActivityType] = useState<'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'>('CALL');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  // New Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data);
        // Load initial edit fields
        setEditName(data.name);
        setEditEmail(data.email);
        setEditPhone(data.phone || '');
        setEditCompany(data.company || '');
        setEditStatus(data.status);
        setEditRevenue(data.revenue.toString());
        setEditAssignedId(data.assignedToId || '');
      } else {
        setError('Lead record not found.');
      }
    } catch (err) {
      setError('Error connecting to database.');
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
    if (id) {
      fetchLead();
      fetchAgents();
    }
  }, [id, user]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          company: editCompany,
          status: editStatus,
          revenue: parseFloat(editRevenue) || 0,
          assignedToId: editAssignedId || null,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchLead();
      } else {
        alert('Failed to update details.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim()) return;

    setActivityLoading(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityType,
          description: activityDesc,
          leadId: id,
        }),
      });

      if (res.ok) {
        setActivityDesc('');
        fetchLead(); // Refresh activities timeline
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setTaskLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          dueDate: taskDueDate || null,
          leadId: id,
          assignedToId: lead?.assignedToId || null,
        }),
      });

      if (res.ok) {
        setTaskTitle('');
        setTaskDesc('');
        setTaskDueDate('');
        fetchLead(); // Refresh tasks list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        fetchLead();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Are you sure you want to delete this lead? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/leads');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-sm flex items-center gap-3">
          <span>{error || 'Lead not found.'}</span>
        </div>
      </DashboardLayout>
    );
  }

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-emerald-400" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case 'MEETING':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <DashboardLayout>
      {/* Navigation and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="p-2 bg-slate-900 border border-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{lead.name}</h1>
              <span className={`inline-flex px-2 py-0.5 border rounded-full text-[10px] font-bold ${getStatusStyle(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{lead.company || 'Private Lead Opportunity'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg transition-all focus:outline-none"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {isEditing ? 'Cancel Edit' : 'Edit Lead'}
          </button>
          {user?.role !== 'SALES_EXECUTIVE' && (
            <button
              onClick={handleDeleteLead}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-red-950/20 text-slate-350 hover:text-red-400 border border-slate-800 hover:border-red-900/40 text-xs font-semibold rounded-lg transition-all focus:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Lead
            </button>
          )}
        </div>
      </div>

      {/* Conversion Banner Alert */}
      {lead.status === 'CONVERTED' && (
        <div className="bg-purple-950/15 border border-purple-900/40 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Lead Converted!</p>
              <p className="text-xs text-slate-450 mt-0.5">
                This lead has been successfully converted into an active customer account with a linked deal in the sales pipeline.
              </p>
            </div>
          </div>
          <Link
            href="/customers"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow shadow-purple-600/10 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            View Customers
          </Link>
        </div>
      )}

      {/* Main Grid: Details + Log Activity on Left, Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Profile & Timeline (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile details or Edit view */}
          <div className="glass-panel rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3 mb-5">
              Lead Information
            </h2>

            {isEditing ? (
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-205 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Lead Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="LOST">Lost</option>
                      <option value="CONVERTED">Converted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Estimated Deal Value ($)
                    </label>
                    <input
                      type="number"
                      value={editRevenue}
                      onChange={(e) => setEditRevenue(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {user?.role !== 'SALES_EXECUTIVE' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Assign Sales Representative
                    </label>
                    <select
                      value={editAssignedId}
                      onChange={(e) => setEditAssignedId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:bg-indigo-700/50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Opportunity Contact</p>
                      <p className="text-slate-250 font-medium">{lead.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Company</p>
                      <p className="text-slate-250 font-medium">{lead.company || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                      <p className="text-indigo-400 hover:underline">{lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone</p>
                      <p className="text-slate-250 font-medium">{lead.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 grid grid-cols-2 gap-6 pt-3 border-t border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Est. Deal Value</p>
                      <p className="text-emerald-450 font-bold">${lead.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Agent</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-full">
                        {lead.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Log Interaction Activity */}
          <div className="glass-panel rounded-2xl p-6 glow-card">
            <h3 className="text-sm font-semibold text-slate-350 uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">
              Log Lead Interaction
            </h3>
            <form onSubmit={handleLogActivity} className="space-y-4">
              <div className="flex items-center gap-3">
                {(['CALL', 'EMAIL', 'MEETING', 'NOTE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActivityType(t)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      activityType === t
                        ? 'bg-indigo-600/15 border-indigo-500/80 text-white'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <textarea
                  required
                  rows={3}
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  placeholder={`Log details about this ${activityType.toLowerCase()}...`}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={activityLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:bg-indigo-700/50"
                >
                  {activityLoading ? 'Logging...' : 'Save Log Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="glass-panel rounded-2xl p-6 glow-card">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 mb-5 border-b border-slate-800">
              <History className="w-5 h-5 text-indigo-400" />
              Interaction Timeline
            </h3>

            {lead.activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No previous interactions logged.</p>
            ) : (
              <div className="relative border-l border-slate-800 pl-5 space-y-6">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-8 top-0.5 w-6.5 h-6.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                      {getActivityIcon(act.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-300">{act.user.name}</span>
                        <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-bold text-slate-500 uppercase">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-auto">
                          {new Date(act.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-305 text-xs mt-1.5 leading-relaxed bg-slate-900/25 p-2.5 rounded-lg border border-slate-800/30">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tasks & Shortcuts (1 column) */}
        <div className="space-y-6">
          {/* Tasks Board */}
          <div className="glass-panel rounded-2xl p-6 glow-card">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Callback Tasks
            </h3>

            {/* List current tasks */}
            <div className="space-y-2 mb-4">
              {lead.tasks.filter((t) => t.status !== 'COMPLETED').length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2">No pending tasks for this lead.</p>
              ) : (
                lead.tasks
                  .filter((t) => t.status !== 'COMPLETED')
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs"
                    >
                      <button
                        onClick={() => handleCompleteTask(t.id)}
                        className="mt-0.5 w-4 h-4 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 flex items-center justify-center text-transparent hover:text-indigo-400 transition-colors"
                        title="Mark Complete"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{t.title}</p>
                        {t.description && <p className="text-[10px] text-slate-500 truncate mt-0.5">{t.description}</p>}
                        {t.dueDate && (
                          <p className="text-[9px] font-semibold text-indigo-400 mt-1">
                            Due: {new Date(t.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Quick add task */}
            <form onSubmit={handleCreateTask} className="border-t border-slate-800/80 pt-4 space-y-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Schedule Next Action</p>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Follow-up call, contract draft..."
                className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-350 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={taskLoading}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:bg-indigo-700/50"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Task
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
