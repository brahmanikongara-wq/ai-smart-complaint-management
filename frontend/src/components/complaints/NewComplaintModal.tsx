import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { Category, Priority } from '../../types';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (complaint: any) => void;
}

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // AI Triage State
  const [isAiTriaging, setIsAiTriaging] = useState(false);
  const [aiClassification, setAiClassification] = useState<any>(null);
  const [aiSentiment, setAiSentiment] = useState<any>(null);
  const [similarComplaints, setSimilarComplaints] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories
  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await api.get('/admin/categories');
        if (res.data.success) {
          setCategories(res.data.data);
          if (res.data.data.length > 0 && !categoryId) {
            setCategoryId(res.data.data[0].id);
          }
        }
      } catch {}
    };
    fetchCats();
  }, [isOpen]);

  // Debounced Live AI Triage when title or description changes
  useEffect(() => {
    if (title.length < 8 && description.length < 15) {
      setAiClassification(null);
      setAiSentiment(null);
      setSimilarComplaints([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAiTriaging(true);
      try {
        // Run classification, sentiment, and duplicate check in parallel
        const [classRes, sentRes, dupRes] = await Promise.all([
          api.post('/ai/classify', { title, description }),
          api.post('/ai/sentiment', { title, description }),
          api.post('/ai/duplicate-check', { title, description }),
        ]);

        if (classRes.data.success) {
          setAiClassification(classRes.data.data);
          if (classRes.data.data.categoryId) {
            setCategoryId(classRes.data.data.categoryId);
          }
        }

        if (sentRes.data.success) {
          setAiSentiment(sentRes.data.data);
          if (sentRes.data.data.priority) {
            setPriority(sentRes.data.data.priority);
          }
        }

        if (dupRes.data.success) {
          setSimilarComplaints(dupRes.data.data.matchedComplaints || []);
        }
      } catch {
        // ignore
      } finally {
        setIsAiTriaging(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both title and detailed description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('categoryId', categoryId);
      formData.append('location', location);
      formData.append('priority', priority);

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        onSuccess(res.data.data.complaint);
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Failed to submit complaint');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error creating complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit New Complaint or Service Request
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI will auto-categorize, score priority, and check duplicates live
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Issue Summary / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Burst water main flooding Elmwood Street"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, any damages, how long it has been going on, etc..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Real-time AI Triage Card */}
          {(isAiTriaging || aiClassification || aiSentiment) && (
            <div className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-900 dark:text-brand-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-spin" />
                  <span>Real-time AI Triage Assistant</span>
                </span>
                {isAiTriaging && (
                  <span className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                )}
              </div>

              {aiClassification && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-brand-100 dark:border-brand-900">
                    <span className="text-slate-400 block text-[10px]">Predicted Category:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {aiClassification.categoryName}
                    </span>
                    <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                      ({Math.round(aiClassification.confidence * 100)}% confidence)
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-brand-100 dark:border-brand-900">
                    <span className="text-slate-400 block text-[10px]">Assigned Department:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {aiClassification.departmentName}
                    </span>
                  </div>
                </div>
              )}

              {aiSentiment && (
                <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-brand-100 dark:border-brand-900 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Sentiment & Urgency:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {aiSentiment.sentiment} ({Math.round(aiSentiment.urgencyScore * 100)}% urgency)
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      aiSentiment.priority === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200'
                        : aiSentiment.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200'
                    }`}
                  >
                    Recommended: {aiSentiment.priority}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Complaints Warning */}
          {similarComplaints.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="font-bold text-amber-800 dark:text-amber-200 flex items-center space-x-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Potential Duplicate / Similar Issues Found ({similarComplaints.length}):</span>
              </div>
              <ul className="space-y-1">
                {similarComplaints.slice(0, 2).map((item) => (
                  <li key={item.id} className="text-amber-700 dark:text-amber-300">
                    • <span className="font-semibold">{item.ticketNumber}</span>: "{item.title}" ({Math.round(item.similarity * 100)}% match, {item.status})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.department?.name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="LOW">Low (Standard Non-Urgent)</option>
                <option value="MEDIUM">Medium (Normal Turnaround)</option>
                <option value="HIGH">High (Urgent Attention)</option>
                <option value="CRITICAL">Critical (Immediate Hazard)</option>
              </select>
            </div>
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Incident Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 5th Avenue & Oak St, Downtown or Online Portal"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Supporting Attachments (Photos / PDFs)
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-brand-500 dark:hover:border-brand-500 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <label className="font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                  Click to browse
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </label>
                {' '}or drag & drop files here
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                PNG, JPG, PDF up to 10MB each
              </div>

              {files.length > 0 && (
                <div className="mt-2 text-left space-y-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex items-center justify-between"
                    >
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-md disabled:opacity-50 flex items-center space-x-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
