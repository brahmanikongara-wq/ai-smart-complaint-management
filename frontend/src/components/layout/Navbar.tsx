import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Inbox,
  BarChart3,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { NotificationItem, Role } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickSwitchDemo, unreadNotifications, setUnreadNotifications } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadNotifications(res.data.data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch {}
  };

  const handleSwitchRole = async (targetRole: Role) => {
    setShowRoleMenu(false);
    await quickSwitchDemo(targetRole);
    if (targetRole === 'ADMIN') navigate('/admin');
    else if (targetRole === 'AGENT') navigate('/staff');
    else navigate('/portal');
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'MANAGER':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'AGENT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-600 dark:from-white dark:via-brand-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Resolv<span className="font-black text-brand-600 dark:text-brand-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded border border-brand-200 dark:border-brand-800">
                AI Gov / Enterprise
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Overview
            </Link>

            <Link
              to="/portal"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                location.pathname.startsWith('/portal')
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Citizen Portal</span>
            </Link>

            {isAuthenticated && (user?.role === 'AGENT' || user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <Link
                to="/staff"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/staff')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Staff Desk</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Quick Demo Switcher Button */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center space-x-1 transition-all"
              title="Quickly switch demo personas"
            >
              <span>Demo Persona:</span>
              <span className="font-bold underline">{user?.role || 'Guest'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-sm animate-fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Switch Active Persona
                </div>
                <button
                  onClick={() => handleSwitchRole('ADMIN')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Admin (Sarah Vance)</div>
                    <div className="text-xs text-slate-500">Full system & analytics</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">ADMIN</span>
                </button>
                <button
                  onClick={() => handleSwitchRole('AGENT')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Staff Agent (Marcus)</div>
                    <div className="text-xs text-slate-500">Public Works & triage</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">AGENT</span>
                </button>
                <button
                  onClick={() => handleSwitchRole('CITIZEN')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Citizen (John Doe)</div>
                    <div className="text-xs text-slate-500">Submit & track tickets</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">CITIZEN</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications Popover */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                      {unreadNotifications > 0 && (
                        <span className="text-[11px] px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 font-bold rounded-full">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                            !notif.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5">
                              {notif.type === 'STATUS_UPDATE' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              {notif.type === 'ASSIGNMENT' && (
                                <Clock className="w-4 h-4 text-blue-500" />
                              )}
                              {notif.type === 'SLA_BREACH' && (
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                              )}
                              {notif.type === 'SYSTEM' && (
                                <Bot className="w-4 h-4 text-indigo-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {notif.title}
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Menu or Login CTA */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-sm animate-fade-in">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {user?.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    <span
                      className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                        user?.role
                      )}`}
                    >
                      {user?.role}
                    </span>
                  </div>

                  <Link
                    to="/portal"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Complaints</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
