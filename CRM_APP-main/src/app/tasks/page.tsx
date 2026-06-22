'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  CheckSquare,
  Plus,
  Calendar,
  Building,
  User,
  Trash2,
  X,
  PlusCircle,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string | null;
  customerId?: string | null;
  customer?: { id: string; name: string; company?: string | null } | null;
  leadId?: string | null;
  lead?: { id: string; name: string; company?: string | null } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
};

type Customer = { id: string; name: string; company?: string | null };
type Lead = { id: string; name: string; company?: string | null };
type Agent = { id: string; name: string; role: string };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('TODO');
  const [linkType, setLinkType] = useState<'NONE' | 'CUSTOMER' | 'LEAD'>('NONE');
  const [linkedId, setLinkedId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        setTasks(await res.json());
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
        // Exclude converted leads
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
    fetchTasks();
    fetchLinkOptions();
  }, [user]);

  const handleUpdateStatus = async (taskId: string, targetStatus: Task['status']) => {
    const previousTasks = [...tasks];
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        setTasks(previousTasks);
        alert('Failed to update task status.');
      } else {
        fetchTasks();
      }
    } catch (err) {
      setTasks(previousTasks);
      alert('Network error.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      } else {
        alert('Failed to delete task.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    const payload = {
      title,
      description: description || null,
      dueDate: dueDate || null,
      status,
      customerId: linkType === 'CUSTOMER' ? linkedId || null : null,
      leadId: linkType === 'LEAD' ? linkedId || null : null,
      assignedToId: assignedToId || undefined,
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setDueDate('');
        setStatus('TODO');
        setLinkType('NONE');
        setLinkedId('');
        setAssignedToId('');
        fetchTasks();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to create task.');
      }
    } catch (err) {
      setModalError('Network error. Try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const getTaskStatusIcon = (s: Task['status']) => {
    switch (s) {
      case 'TODO':
        return <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  const statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'] as const;

  return (
    <DashboardLayout>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-indigo-400" />
            Workspace Tasks
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review calendar items, coordinate call schedules, and track completions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          Schedule Task
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Tasks Lists Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {statuses.map((s) => {
            const statusTasks = tasks.filter((t) => t.status === s);
            return (
              <div key={s} className="bg-slate-900/35 border border-slate-900 rounded-2xl p-4 flex flex-col min-h-[400px]">
                {/* Column Title */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider">
                    {s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>

                {/* List Container */}
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[550px] pr-1">
                  {statusTasks.length === 0 ? (
                    <div className="border border-dashed border-slate-800/40 rounded-xl py-12 text-center text-xs text-slate-600">
                      No tasks in this status
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-900/80 border border-slate-800/80 hover:bg-slate-900 p-4 rounded-xl shadow-sm transition-all group flex gap-3.5"
                      >
                        {/* Status update icon trigger */}
                        <div className="shrink-0">
                          {task.status !== 'COMPLETED' ? (
                            <button
                              onClick={() =>
                                handleUpdateStatus(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : 'COMPLETED')
                              }
                              className="focus:outline-none"
                              title={task.status === 'TODO' ? 'Start Task' : 'Complete Task'}
                            >
                              {getTaskStatusIcon(task.status)}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'TODO')}
                              className="focus:outline-none"
                              title="Reset to To Do"
                            >
                              {getTaskStatusIcon(task.status)}
                            </button>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-snug text-slate-205 group-hover:text-white ${task.status === 'COMPLETED' ? 'line-through text-slate-500 group-hover:text-slate-400' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Details Metadata */}
                          <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800/40 text-[9px] font-semibold text-slate-500">
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 text-indigo-400">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}

                            {/* Client link */}
                            {(task.customer || task.lead) && (
                              <div className="flex items-center gap-1.5 text-slate-450">
                                <Building className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  Client:{' '}
                                  {task.customer
                                    ? `${task.customer.name} (Cust.)`
                                    : `${task.lead?.name} (Lead)`}
                                </span>
                              </div>
                            )}

                            {/* Assigned Rep */}
                            <div className="flex items-center gap-1.5 text-slate-450">
                              <User className="w-3 h-3 text-slate-600 shrink-0" />
                              <span className="truncate">Rep: {task.assignedTo?.name || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete action */}
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors focus:outline-none"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl glow-card p-6 border border-slate-800/80 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Schedule New Task
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

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule onboarding call"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include extra instructions or background information..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-305 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Task Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-350 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* Link profile */}
              <div className="p-3 bg-slate-900/25 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Link Task To:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('NONE');
                      setLinkedId('');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      linkType === 'NONE' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('CUSTOMER');
                      setLinkedId('');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      linkType === 'LEAD' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Lead
                  </button>
                </div>

                {linkType !== 'NONE' && (
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
                )}
              </div>

              {/* Assign Representative */}
              {user?.role !== 'SALES_EXECUTIVE' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Rep
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
                {modalLoading ? 'Scheduling...' : 'Schedule Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
