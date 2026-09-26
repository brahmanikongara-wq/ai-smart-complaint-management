export type Role = 'CITIZEN' | 'AGENT' | 'MANAGER' | 'ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Status = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  createdAt?: string;
  _count?: {
    complaintsFiled: number;
    assignedComplaints: number;
    notifications: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    users: number;
    categories: number;
    complaints: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  department?: Department;
  defaultPriority: Priority;
  keywordsJson?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedById: string;
  changedBy?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  note?: string | null;
  createdAt: string;
}

export interface Feedback {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  categoryId: string;
  category: Category;
  departmentId: string;
  department: Department;
  priority: Priority;
  status: Status;
  location?: string | null;
  sentiment: Sentiment;
  sentimentScore: number;
  urgencyScore: number;
  assignedStaffId?: string | null;
  assignedStaff?: User | null;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  aiSummary?: string | null;
  aiSuggestedDraft?: string | null;
  attachments?: Attachment[];
  history?: StatusHistoryItem[];
  feedback?: Feedback | null;
  similarTickets?: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    similarity: number;
  }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    attachments: number;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'STATUS_UPDATE' | 'ASSIGNMENT' | 'SLA_BREACH' | 'SYSTEM';
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  summary: {
    totalComplaints: number;
    pendingCount: number;
    inProgressCount: number;
    resolvedCount: number;
    closedCount: number;
    slaBreachedCount: number;
    slaComplianceRate: number;
    avgRating: number;
    avgResolutionHours: number;
  };
  categoryBreakdown: Array<{ name: string; count: number }>;
  priorityBreakdown: Array<{ name: string; count: number; color: string }>;
  sentimentBreakdown: Array<{ name: string; count: number; percentage: number; color: string }>;
  trendDays: Array<{ date: string; complaints: number; resolved: number }>;
  aiInsightSummary: string;
}

export interface StaffPerformanceItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  totalAssigned: number;
  resolvedCount: number;
  pendingCount: number;
  resolutionRate: number;
  avgRating: number;
}
