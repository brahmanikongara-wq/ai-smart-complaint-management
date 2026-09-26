import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  BarChart3,
  Clock,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Users,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import RibbonGlow from '../components/originkit/ui/ribbon-glow';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user, quickSwitchDemo } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  // Interactive Live AI Triage Demo on Landing Page!
  const [demoInput, setDemoInput] = useState('High pressure water pipe burst flooding Main Street and baseline garages');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState<any>({
    category: 'Water Supply & Contamination',
    department: 'Public Works & Infrastructure',
    sentiment: 'NEGATIVE',
    urgency: 0.92,
    priority: 'CRITICAL',
    slaHours: 4,
  });

  const handleTestTriage = async (text: string) => {
    setDemoInput(text);
    setIsAnalyzing(true);
    try {
      const [classRes, sentRes] = await Promise.all([
        api.post('/ai/classify', { title: text, description: text }),
        api.post('/ai/sentiment', { title: text, description: text }),
      ]);

      if (classRes.data.success && sentRes.data.success) {
        setDemoResult({
          category: classRes.data.data.categoryName,
          department: classRes.data.data.departmentName,
          sentiment: sentRes.data.data.sentiment,
          urgency: sentRes.data.data.urgencyScore,
          priority: sentRes.data.data.priority,
          slaHours: sentRes.data.data.priority === 'CRITICAL' ? 4 : sentRes.data.data.priority === 'HIGH' ? 12 : 24,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickDemo = async (role: any) => {
    await quickSwitchDemo(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'AGENT') navigate('/staff');
    else navigate('/portal');
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section — RibbonGlow WebGL Background */}
      <section className="relative overflow-hidden">
        {/* RibbonGlow fills the full hero as an animated WebGL canvas */}
        <div className="absolute inset-0 w-full" style={{ minHeight: 680, zIndex: 0 }}>
          <RibbonGlow
            background={isDark ? '#08070F' : '#F3F0FF'}
            color1={isDark ? '#2FD3F2' : '#7B61FF'}
            color2={isDark ? '#7B61FF' : '#06B6D4'}
            speed={42}
            size={105}
            angle={-160}
            hover={120}
            reach={300}
            style={{ minHeight: 680, minWidth: 320 }}
          />
        </div>
        {/* Subtle vignette overlay to help text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, transparent 30%, rgba(8,7,15,0.55) 100%)'
              : 'radial-gradient(ellipse at 50% 0%, transparent 30%, rgba(243,240,255,0.55) 100%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Next-Gen AI Complaint Triage & Service Resolution</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Intelligent Citizen Service &{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Smart AI Complaint Resolution
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate triage delays. ResolvAI auto-classifies requests, detects urgency and duplicates, routes to the right specialist, and resolves issues with SLA-backed accountability.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/portal"
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-700 shadow-lg shadow-brand-500/25 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
            >
              <span>Explore Citizen Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => handleQuickDemo('ADMIN')}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center space-x-2 transition-all hover:scale-105"
            >
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span>Launch Admin Analytics</span>
            </button>

            <button
              onClick={() => handleQuickDemo('AGENT')}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center space-x-2 transition-all hover:scale-105"
            >
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Open Staff Desk</span>
            </button>
          </div>

          {/* Key Metrics Banner */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl glass-card">
              <div className="text-2xl font-black text-slate-900 dark:text-white">99.4%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Triage Classification Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">4.8 / 5.0</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Citizen Satisfaction (CSAT)</div>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">&lt; 0.8s</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Real-time Semantic Routing</div>
            </div>
            <div className="p-4 rounded-2xl glass-card">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">24 / 7</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Conversational Assistant Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live AI Triage Playground */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Model Demo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Try the Live AI Semantic Triage Engine
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Type any free-form complaint or pick a sample scenario below to test instant category prediction, sentiment detection, and SLA prioritization.
            </p>
          </div>

          {/* Quick Scenario Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleTestTriage('Dangerous 10-inch pothole in front of elementary school crosswalk')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              🚗 School Zone Pothole
            </button>
            <button
              onClick={() => handleTestTriage('Billed twice $89.99 for fiber broadband after transaction timeout')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              💳 Double Billing Dispute
            </button>
            <button
              onClick={() => handleTestTriage('Mobile portal app crashes on biometric face authentication iOS 18')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              📱 Mobile App Glitch
            </button>
            <button
              onClick={() => handleTestTriage('Municipal garbage container overflowing emitting foul odor for 4 days')}
              className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            >
              🗑️ Waste Disposal Hazard
            </button>
          </div>

          {/* Input Box */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Type any complaint..."
            />
            <button
              onClick={() => handleTestTriage(demoInput)}
              disabled={isAnalyzing || !demoInput.trim()}
              className="px-6 py-3 rounded-2xl font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <span>Analyzing NLP...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Run Live Triage</span>
                </>
              )}
            </button>
          </div>

          {/* Output Card */}
          {demoResult && (
            <div className="mt-6 p-5 rounded-2xl bg-white/10 border border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div>
                <span className="text-[10px] text-cyan-200 uppercase font-bold block">Assigned Category</span>
                <span className="text-sm font-bold text-white">{demoResult.category}</span>
                <div className="text-[11px] text-slate-300">{demoResult.department}</div>
              </div>

              <div>
                <span className="text-[10px] text-cyan-200 uppercase font-bold block">Predicted Priority</span>
                <span className={`inline-block mt-0.5 text-xs font-black px-2.5 py-0.5 rounded-full ${
                  demoResult.priority === 'CRITICAL' ? 'bg-rose-500 text-white' :
                  demoResult.priority === 'HIGH' ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                }`}>
                  {demoResult.priority}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-cyan-200 uppercase font-bold block">Sentiment & Urgency</span>
                <span className="text-sm font-bold text-white">
                  {demoResult.sentiment} ({(demoResult.urgency * 100).toFixed(0)}%)
                </span>
                <div className="text-[11px] text-slate-300">Semantic threat rating</div>
              </div>

              <div>
                <span className="text-[10px] text-cyan-200 uppercase font-bold block">SLA Commitment</span>
                <span className="text-sm font-bold text-emerald-400">{demoResult.slaHours} Hours Max</span>
                <div className="text-[11px] text-slate-300">Automated escalation trigger</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for Modern Smart Governance & Service Teams
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Every ticket goes through a deep AI pipeline that eliminates manual triage bottlenecks and ensures every citizen request is tracked through full resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-3xl glass-card space-y-3 hover:border-brand-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              24/7 Conversational Bot & RAG
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Citizens can file complaints conversationally, look up live statuses by ticket ID, or ask policy questions. Instant human handoff is always one click away.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-3 hover:border-brand-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Vector Semantic Duplicate Check
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Detects clusters of identical or related issues across city blocks using cosine similarity over embeddings, preventing duplicate investigation work.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card space-y-3 hover:border-brand-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Auto-Escalation & SLA Rules
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Configurable SLA clocks per department and priority tier. Tickets approaching breach are highlighted and auto-escalated to senior managers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
