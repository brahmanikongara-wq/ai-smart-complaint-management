import React from 'react';
import { Sparkles, ShieldCheck, HeartHandshake, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-brand-600 dark:from-white dark:to-brand-400 bg-clip-text text-transparent">
                ResolvAI Platform
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Next-generation municipal and enterprise complaint resolution ecosystem powered by LLMs, real-time semantic triage, and automated routing.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              System Capabilities
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Sub-second AI Classification</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Vector Semantic Duplicate Check</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-500" />
                <span>24/7 Conversational Triage Bot</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              SLA Compliance
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <div>Critical Hazard: <span className="font-semibold text-rose-500">4 Hours</span></div>
              <div>High Priority: <span className="font-semibold text-amber-500">12 Hours</span></div>
              <div>Standard Request: <span className="font-semibold text-emerald-500">24 Hours</span></div>
              <div className="pt-2 text-[11px] text-slate-400">SOC2 Type II & GDPR Compliant</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ResolvAI Platform. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span className="inline-flex items-center space-x-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </span>
            <span>v1.0.0 (Production Build)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
