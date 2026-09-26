import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Layers,
  Star,
  Plus,
  RefreshCw,
  ShieldCheck,
  Building
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import { AnalyticsData, StaffPerformanceItem, Category, Department, User } from '../types';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformanceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'categories' | 'users'>('analytics');

  // New Category Modal / Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatDeptId, setNewCatDeptId] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [anaRes, staffRes, catRes, deptRes, userRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/staff-performance'),
        api.get('/admin/categories'),
        api.get('/admin/departments'),
        api.get('/admin/users'),
      ]);

      if (anaRes.data.success) setAnalytics(anaRes.data.data);
      if (staffRes.data.success) setStaffPerformance(staffRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0 && !newCatDeptId) {
          setNewCatDeptId(deptRes.data.data[0].id);
        }
      }
      if (userRes.data.success) setUsersList(userRes.data.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keywordsArray = newCatKeywords.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await api.post('/admin/categories', {
        name: newCatName,
        description: newCatDesc,
        departmentId: newCatDeptId,
        keywords: keywordsArray,
      });
      if (res.data.success) {
        setCategories([...categories, res.data.data]);
        setShowCatModal(false);
        setNewCatName('');
        setNewCatDesc('');
        setNewCatKeywords('');
      }
    } catch {}
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
        );
      }
    } catch {}
  };

  if (isLoading || !analytics) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">
        Loading intelligence dashboard...
      </div>
    );
  }

  const { summary } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Administrative & Operational Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time SLA compliance, sentiment tracking, triage volume, and team performance
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 p-1 rounded-2xl glass-card text-xs font-semibold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Analytics & SLA
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === 'staff'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Staff Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === 'categories'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Categories & Rules
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === 'users'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            User Roles
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Executive AI Insights Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex items-start space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1">
                Executive AI Weekly Intelligence Takeaways
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                {analytics.aiInsightSummary}
              </p>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl glass-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Complaints
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {summary.totalComplaints}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {summary.pendingCount} pending • {summary.inProgressCount} in progress
              </div>
            </div>

            <div className="p-5 rounded-3xl glass-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SLA Compliance Rate
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.slaComplianceRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {summary.slaBreachedCount} tickets breached threshold
              </div>
            </div>

            <div className="p-5 rounded-3xl glass-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Avg Resolution Time
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {summary.avgResolutionHours} hrs
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Target SLA standard: 12.0 hrs
              </div>
            </div>

            <div className="p-5 rounded-3xl glass-card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Citizen Satisfaction (CSAT)
              </div>
              <div className="text-3xl font-black text-amber-500 mt-1 flex items-center">
                <span>{summary.avgRating}</span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 ml-1.5" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Verified post-resolution ratings
              </div>
            </div>
          </div>

          {/* Charts Row 1: Volume Trend & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trend Chart */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    7-Day Ticket Inflow vs Resolutions
                  </h3>
                  <p className="text-xs text-slate-500">Intake volume compared to resolved volume</p>
                </div>
                <TrendingUp className="w-5 h-5 text-brand-500" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trendDays}>
                    <defs>
                      <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0c8de4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0c8de4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="complaints"
                      stroke="#0c8de4"
                      fillOpacity={1}
                      fill="url(#colorComplaints)"
                      name="New Tickets"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Complaint Volume by Category
                  </h3>
                  <p className="text-xs text-slate-500">Distribution across municipal and service categories</p>
                </div>
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={45} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Complaints" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Sentiment Breakdown & Priority Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sentiment Donut */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Citizen Sentiment Distribution
                </h3>
                <p className="text-xs text-slate-500">Analyzed via NLP sentiment score across ticket text</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.sentimentBreakdown}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {analytics.sentimentBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Urgency & Priority Breakdown
                </h3>
                <p className="text-xs text-slate-500">Critical hazard vs routine standard tickets</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.priorityBreakdown}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {analytics.priorityBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-p-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF PERFORMANCE */}
      {activeTab === 'staff' && (
        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Support Specialist Resolution & CSAT Leaderboard
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by customer satisfaction ratings and turnaround success
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Specialist</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Total Assigned</th>
                  <th className="py-3.5 px-4">Resolved Count</th>
                  <th className="py-3.5 px-4">Resolution Rate</th>
                  <th className="py-3.5 px-4">CSAT Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {staffPerformance.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 flex items-center space-x-3">
                      <img
                        src={staff.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`}
                        alt={staff.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{staff.name}</div>
                        <div className="text-xs text-slate-400">{staff.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {staff.department}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {staff.totalAssigned}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      {staff.resolvedCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-600 h-full rounded-full"
                            style={{ width: `${staff.resolutionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-xs">{staff.resolutionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                        <span>{staff.avgRating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & SLA RULES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Complaint Categories & NLP Keywords
              </h3>
              <p className="text-xs text-slate-500">Configure automated classification rules and target SLAs</p>
            </div>
            <button
              onClick={() => setShowCatModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              let kws: string[] = [];
              try {
                kws = JSON.parse(cat.keywordsJson || '[]');
              } catch {}
              return (
                <div key={cat.id} className="p-5 rounded-3xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase">
                      {cat.department?.name || 'Department'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      Default: {cat.defaultPriority}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {cat.name}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cat.description || 'No description provided'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                      NLP Keywords Trigger
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {kws.slice(0, 5).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                      {kws.length > 5 && (
                        <span className="text-[10px] text-slate-400">+{kws.length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ROLE PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="rounded-3xl glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              User Role Management & Permissions (RBAC)
            </h3>
            <p className="text-xs text-slate-500">Promote or assign roles across citizens, agents, and managers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Tickets Filed</th>
                  <th className="py-3.5 px-4">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 flex items-center space-x-3">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {u.department?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u._count?.complaintsFiled || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="CITIZEN">Citizen</option>
                        <option value="AGENT">Support Agent</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Chief Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-slide-up">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Create New Complaint Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Street Light Outage"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={newCatDeptId}
                  onChange={(e) => setNewCatDeptId(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={newCatKeywords}
                  onChange={(e) => setNewCatKeywords(e.target.value)}
                  placeholder="light, dark, lamp, streetlight, blackout"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Handles public lighting failures..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
