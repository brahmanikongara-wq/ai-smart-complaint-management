import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User as UserIcon,
  Sparkles,
  Star,
  Send,
  Download,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Complaint, Status } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface ComplaintDetailDrawerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedComplaint: Complaint) => void;
}

export const ComplaintDetailDrawer: React.FC<ComplaintDetailDrawerProps> = ({
  complaint,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'ai'>('details');

  // Agent response / status update state
  const [newStatus, setNewStatus] = useState<Status>(complaint?.status || 'IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Feedback state for resolved tickets
  const [rating, setRating] = useState<number>(complaint?.feedback?.rating || 5);
  const [feedbackComment, setFeedbackComment] = useState(complaint?.feedback?.comment || '');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(!!complaint?.feedback);

  if (!isOpen || !complaint) return null;

  const isStaffOrAdmin = user?.role === 'AGENT' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      const res = await api.patch(`/complaints/${complaint.id}/status`, {
        status: newStatus,
        note: statusNote,
      });
      if (res.data.success) {
        onUpdate(res.data.data);
        setStatusNote('');
      }
    } catch (err) {
      // ignore
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const res = await api.post(`/complaints/${complaint.id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      if (res.data.success) {
        setFeedbackSuccess(true);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmittingFeedback(false);
    }
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
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {complaint.ticketNumber}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(complaint.status)}`}>
                {complaint.status}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getPriorityBadge(complaint.priority)}`}>
                {complaint.priority}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {complaint.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div>Dept: <span className="font-semibold text-slate-700 dark:text-slate-300">{complaint.department?.name}</span></div>
            <div>Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{complaint.category?.name}</span></div>
            <div>Submitted: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(complaint.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Status History & Logs ({complaint.history?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'ai'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>AI Triage & Suggestions</span>
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Complaint Description
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {complaint.description}
                </div>
              </div>

              {/* Location */}
              {complaint.location && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Reported Location
                  </h4>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    📍 {complaint.location}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Attached Evidence ({complaint.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {complaint.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {att.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {(att.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-brand-600 shadow-sm"
                          title="Open Attachment"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Specialist */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Handling Support Officer
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {complaint.assignedStaff?.name || 'Awaiting Specialist Assignment'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {complaint.assignedStaff?.email || 'Department Dispatch Pool'}
                  </div>
                </div>
                {complaint.slaDeadline && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Target SLA Resolution
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {new Date(complaint.slaDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Citizen Rating & Feedback (if resolved) */}
              {complaint.status === 'RESOLVED' && (
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">Issue Verified & Resolved</span>
                  </div>

                  {feedbackSuccess ? (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs space-y-1">
                      <div className="flex items-center space-x-1 text-amber-500">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 italic">
                        "{feedbackComment || 'Citizen confirmed satisfactory resolution.'}"
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitFeedback} className="space-y-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        How would you rate the speed and quality of our service?
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Optional feedback comment..."
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                      >
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Staff Status Action Form */}
              {isStaffOrAdmin && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-brand-600" />
                    <span>Staff Desk Action & Resolution</span>
                  </h4>

                  <form onSubmit={handleUpdateStatus} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Update Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as Status)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="PENDING">Pending Review</option>
                        <option value="IN_PROGRESS">In Progress / Dispatched</option>
                        <option value="RESOLVED">Resolved (Issue Fixed)</option>
                        <option value="CLOSED">Closed (Finalized)</option>
                        <option value="REOPENED">Reopened</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Progress Note / Resolution Message
                        </label>
                        {complaint.aiSuggestedDraft && (
                          <button
                            type="button"
                            onClick={() => setStatusNote(complaint.aiSuggestedDraft || '')}
                            className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Insert AI Draft</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Add internal resolution progress or message to citizen..."
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="w-full py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Post Status Update</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Full Audit Trail
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {complaint.history?.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative">
                    <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900"></span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Status changed to <span className="text-brand-600 dark:text-brand-400">{hist.newStatus}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      By {hist.changedBy?.name || 'Automated AI Engine'} • {new Date(hist.createdAt).toLocaleString()}
                    </div>
                    {hist.note && (
                      <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        {hist.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AI TRIAGE & SUGGESTIONS */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-brand-900 dark:text-brand-300 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>AI Triage Diagnostics</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-100 dark:border-brand-900">
                    <span className="text-slate-400 text-[10px] block uppercase">Sentiment Radar</span>
                    <span className="font-bold text-slate-900 dark:text-white">{complaint.sentiment}</span>
                    <div className="text-[10px] text-slate-500">Score: {complaint.sentimentScore}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-100 dark:border-brand-900">
                    <span className="text-slate-400 text-[10px] block uppercase">Urgency Score</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Math.round(complaint.urgencyScore * 100)}%
                    </span>
                    <div className="text-[10px] text-slate-500">Priority: {complaint.priority}</div>
                  </div>
                </div>

                {complaint.aiSummary && (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-100 dark:border-brand-900 text-xs">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold mb-1">
                      AI Triage Summary
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{complaint.aiSummary}</p>
                  </div>
                )}
              </div>

              {/* AI Auto-Response Suggestion */}
              {complaint.aiSuggestedDraft && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>AI Suggested Resolution Draft for Agents</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(complaint.aiSuggestedDraft || '');
                        alert('Copied AI draft to clipboard!');
                      }}
                      className="text-brand-600 dark:text-brand-400 hover:underline text-[11px]"
                    >
                      Copy Draft
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-line">
                    {complaint.aiSuggestedDraft}
                  </div>
                </div>
              )}

              {/* Similar Complaints from Vector Search */}
              {complaint.similarTickets && complaint.similarTickets.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Semantically Similar Past Tickets
                  </h4>
                  <div className="space-y-2">
                    {complaint.similarTickets.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 mr-2">
                            {sim.ticketNumber}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{sim.title}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {Math.round(sim.similarity * 100)}% match
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
    </div>
  );
};
