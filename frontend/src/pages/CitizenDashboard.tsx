import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
  Star,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Complaint, Status } from '../types';
import { NewComplaintModal } from '../components/complaints/NewComplaintModal';
import { ComplaintDetailDrawer } from '../components/complaints/ComplaintDetailDrawer';
import { getSocket } from '../services/socket';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          mine: user?.role === 'CITIZEN' ? 'true' : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
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
    fetchComplaints();
  }, [statusFilter]);

  // Real-time socket updates for status changes
  useEffect(() => {
    const socket = getSocket();
    const handleStatusChanged = (payload: any) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === payload.id ? { ...c, status: payload.status } : c))
      );
      if (selectedComplaint && selectedComplaint.id === payload.id) {
        setSelectedComplaint((prev) => (prev ? { ...prev, status: payload.status } : null));
      }
    };

    socket.on('complaint:status-changed', handleStatusChanged);
    return () => {
      socket.off('complaint:status-changed', handleStatusChanged);
    };
  }, [selectedComplaint]);

  const handleCreatedSuccess = (newComplaint: Complaint) => {
    setComplaints([newComplaint, ...complaints]);
    setSelectedComplaint(newComplaint);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  const getPriorityBadge = (pr: string) => {
    switch (pr) {
      case 'CRITICAL':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900';
      case 'HIGH':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900';
      case 'MEDIUM':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Citizen Service Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your submitted issues, receive live updates, and rate completed resolutions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-md shadow-brand-500/20 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>File New Complaint</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Filed
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {complaints.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {pendingCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {inProgressCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Resolved & Closed
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {resolvedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl glass-card">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
            placeholder="Search by ticket ID, title, or keywords..."
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Complaint Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-slate-500">
          Loading your service tickets...
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-20 text-center space-y-4 rounded-3xl glass-card">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No Complaints Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't filed any complaints matching this criteria yet.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
          >
            File Your First Complaint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedComplaint(item);
                setIsDrawerOpen(true);
              }}
              className="p-6 rounded-3xl glass-card hover:border-brand-500/60 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                    {item.ticketNumber}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Card Footer Details */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                    {item.department?.name || 'Department'}
                  </span>
                  {item.feedback ? (
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="text-[11px] font-bold ml-1">{item.feedback.rating}.0</span>
                    </div>
                  ) : item.status === 'RESOLVED' ? (
                    <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline">
                      Rate Service →
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                  {item.location && (
                    <span className="flex items-center space-x-1 truncate max-w-[120px]">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{item.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      <NewComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreatedSuccess}
      />

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
