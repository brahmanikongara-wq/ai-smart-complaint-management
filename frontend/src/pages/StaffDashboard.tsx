import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Kanban,
  List,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  AlertTriangle,
  Send,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Complaint, Status } from '../types';
import { ComplaintDetailDrawer } from '../components/complaints/ComplaintDetailDrawer';
import { getSocket } from '../services/socket';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchStaffComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          search: searchTerm || undefined,
        },
      });
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffComplaints();
  }, []);

  // Real-time listener for newly assigned or status-changed tickets
  useEffect(() => {
    const socket = getSocket();

    const handleCreated = (newTicket: Complaint) => {
      setComplaints((prev) => [newTicket, ...prev]);
    };

    const handleUpdated = (updatedTicket: Complaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === updatedTicket.id ? updatedTicket : c))
      );
      if (selectedComplaint && selectedComplaint.id === updatedTicket.id) {
        setSelectedComplaint(updatedTicket);
      }
    };

    socket.on('complaint:created', handleCreated);
    socket.on('complaint:updated', handleUpdated);

    return () => {
      socket.off('complaint:created', handleCreated);
      socket.off('complaint:updated', handleUpdated);
    };
  }, [selectedComplaint]);

  const handleQuickStatusMove = async (
    e: React.MouseEvent,
    complaintId: string,
    targetStatus: Status
  ) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/complaints/${complaintId}/status`, {
        status: targetStatus,
        note: `Fast-tracked status progression to ${targetStatus} by staff member ${user?.name}.`,
      });
      if (res.data.success) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? res.data.data : c))
        );
      }
    } catch {}
  };

  const pendingList = complaints.filter((c) => c.status === 'PENDING');
  const inProgressList = complaints.filter((c) => c.status === 'IN_PROGRESS');
  const resolvedList = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Support Staff & Dispatch Desk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {user?.department?.name || 'Operations Specialist'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review triage priorities, inspect AI suggested draft responses, and move tickets through resolution
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center space-x-2 p-1 rounded-2xl glass-card">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'kanban'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table Queue</span>
          </button>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between p-4 rounded-3xl glass-card gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStaffComplaints()}
            placeholder="Search tickets by ID, keyword, or citizen..."
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-xs font-semibold text-slate-500">
          <div>Queue Total: <span className="font-bold text-slate-900 dark:text-white">{complaints.length}</span></div>
          <div>Pending Triage: <span className="font-bold text-amber-500">{pendingList.length}</span></div>
          <div>In Flight: <span className="font-bold text-blue-500">{inProgressList.length}</span></div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Pending */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-sm text-amber-900 dark:text-amber-200">Pending Review</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                {pendingList.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedComplaint(item);
                    setIsDrawerOpen(true);
                  }}
                  className="p-5 rounded-3xl glass-card hover:border-brand-500/60 hover:shadow-md cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                      {item.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {item.category?.name}
                    </span>
                    <button
                      onClick={(e) => handleQuickStatusMove(e, item.id, 'IN_PROGRESS')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 hover:bg-blue-100 flex items-center space-x-1"
                    >
                      <span>Start Work</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-sm text-blue-900 dark:text-blue-200">In Progress / Field</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                {inProgressList.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedComplaint(item);
                    setIsDrawerOpen(true);
                  }}
                  className="p-5 rounded-3xl glass-card hover:border-brand-500/60 hover:shadow-md cursor-pointer transition-all space-y-3 group border-l-4 border-l-blue-500"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                      {item.ticketNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Officer: {item.assignedStaff?.name?.split(' ')[0] || 'Unassigned'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h4>

                  {/* AI Quick Draft Insight */}
                  {item.aiSuggestedDraft && (
                    <div className="p-2 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-900/60 text-[11px] text-brand-800 dark:text-brand-300 flex items-start space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">AI Draft Ready for Inspection</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      SLA: {item.slaDeadline ? new Date(item.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                    </span>
                    <button
                      onClick={(e) => handleQuickStatusMove(e, item.id, 'RESOLVED')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Resolved */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Resolved & Closed</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                {resolvedList.length}
              </span>
            </div>

            <div className="space-y-3">
              {resolvedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedComplaint(item);
                    setIsDrawerOpen(true);
                  }}
                  className="p-5 rounded-3xl glass-card hover:border-brand-500/60 hover:shadow-md cursor-pointer transition-all space-y-3 group opacity-90"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                      {item.ticketNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                      RESOLVED
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                    {item.title}
                  </h4>

                  <div className="text-[11px] text-slate-400">
                    Resolved at: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : 'Completed'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Title & Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {complaints.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedComplaint(item);
                      setIsDrawerOpen(true);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {item.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.category?.name} • {item.department?.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.priority === 'CRITICAL' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' : 'text-blue-600 bg-blue-50 dark:bg-blue-950/60'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.assignedStaff?.name || 'Awaiting assignment'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Slide-out Drawer */}
      <ComplaintDetailDrawer
        complaint={selectedComplaint}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={(updated) => {
          setSelectedComplaint(updated);
          setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }}
      />
    </div>
  );
};
