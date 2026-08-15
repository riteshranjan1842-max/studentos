import { useState, useEffect } from 'react';
import {
  X, Bell, Settings, Check, Mail,
  BookOpen, AlertCircle, RefreshCw, BarChart2,
  Calendar, CheckCircle2, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { DsaProblem } from '../lib/types';

interface ControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'settings' | 'notifications' | 'analytics';
}

export default function ControlCenterModal({ isOpen, onClose, initialTab = 'settings' }: ControlCenterModalProps) {
  const { profile, user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'notifications' | 'analytics'>(initialTab);
  
  // Settings Form State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [emailReminders, setEmailReminders] = useState(profile?.email_reminders ?? true);
  const [reminderMins, setReminderMins] = useState(profile?.class_reminder_mins ?? 10);
  const [themeColor, setThemeColor] = useState(profile?.theme_color ?? 'indigo');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Analytics Stats State
  const [dsaProblems, setDsaProblems] = useState<DsaProblem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync profile state when profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmailReminders(profile.email_reminders ?? true);
      setReminderMins(profile.class_reminder_mins ?? 10);
      setThemeColor(profile.theme_color ?? 'indigo');
    }
  }, [profile]);

  // Load stats data for analytics
  useEffect(() => {
    async function loadStats() {
      if (!user || !isOpen) return;
      setLoadingStats(true);
      const { data } = await supabase
        .from('dsa_tracker')
        .select('*')
        .eq('user_id', user.id);
      setDsaProblems((data as DsaProblem[]) ?? []);
      setLoadingStats(false);
    }
    loadStats();
  }, [user, isOpen]);

  if (!isOpen) return null;

  async function handleSaveSettings() {
    setSaving(true);
    setSaveSuccess(false);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      email_reminders: emailReminders,
      class_reminder_mins: Number(reminderMins),
      theme_color: themeColor,
    });
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  }

  // DSA Analytics Calculations
  const totalDsa = dsaProblems.length;
  const solvedDsa = dsaProblems.filter(p => p.status === 'Solved').length;
  const inProgressDsa = dsaProblems.filter(p => p.status === 'In Progress').length;
  const unsolvedDsa = dsaProblems.filter(p => p.status === 'Unsolved').length;
  const dsaProgressPct = totalDsa > 0 ? Math.round((solvedDsa / totalDsa) * 100) : 0;

  const easyDsa = dsaProblems.filter(p => p.difficulty === 'Easy');
  const mediumDsa = dsaProblems.filter(p => p.difficulty === 'Medium');
  const hardDsa = dsaProblems.filter(p => p.difficulty === 'Hard');

  const easySolved = easyDsa.filter(p => p.status === 'Solved').length;
  const mediumSolved = mediumDsa.filter(p => p.status === 'Solved').length;
  const hardSolved = hardDsa.filter(p => p.status === 'Solved').length;

  const reattemptsDue = dsaProblems.filter(p => {
    if (!p.reattempt_at) return false;
    return new Date(p.reattempt_at) <= new Date();
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[640px] bg-ink-950/90 border border-ink-700/50 rounded-2xl shadow-2xl flex overflow-hidden animate-fadeIn font-sans">
        
        {/* Sidebar Tabs */}
        <aside className="w-56 bg-ink-900/60 border-r border-ink-700/30 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-wider">Control Center</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Manage your workspace preferences</p>
            </div>
            
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-ink-800/40 border border-transparent'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Account Settings</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-ink-800/40 border border-transparent'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="flex-1 text-left">Notifications</span>
                {reattemptsDue > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-ink-800/40 border border-transparent'
                }`}
              >
                <BarChart2 className="w-4.5 h-4.5" />
                <span>Workspace Stats</span>
              </button>
            </nav>
          </div>
          
          <div className="px-2 pb-2 text-[10px] text-slate-550 select-none">
            StudentOS Client Engine v1.0.4
          </div>
        </aside>

        {/* Modal Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Modal Header */}
          <header className="h-14 border-b border-ink-700/30 flex items-center justify-between px-6 shrink-0">
            <h3 className="text-base font-semibold text-white">
              {activeTab === 'settings' && 'Account Settings'}
              {activeTab === 'notifications' && 'Notification Preferences'}
              {activeTab === 'analytics' && 'Workspace Performance Analytics'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-ink-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Modal Tab Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
            
            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address</label>
                      <input
                        type="text"
                        value={user?.email || 'student@school.edu'}
                        disabled
                        className="w-full bg-ink-900 border border-ink-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Display Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ritesh Ranjan"
                        className="w-full bg-ink-800/60 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-800/40 my-6" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dashboard Customization</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Accent Theme Color</label>
                    <div className="flex items-center gap-3.5">
                      {[
                        { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                        { id: 'violet', label: 'Violet', bg: 'bg-violet-600' },
                        { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
                        { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
                        { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setThemeColor(theme.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${theme.bg} ${
                            themeColor === theme.id ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-950 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          title={theme.label}
                        >
                          {themeColor === theme.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-800/40 my-6" />

                {/* Save Success / Info banner */}
                {saveSuccess && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-xl animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Settings successfully saved and synchronized!</span>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving || !fullName.trim()}
                    className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-brand-500/10"
                  >
                    {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spaced Repetition Alerts</h4>
                  
                  <div className="flex items-start justify-between bg-ink-900/40 p-4 border border-ink-700/35 rounded-xl gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Email Reminders</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Receive instant email reminders directly from Resend when your tracked DSA reattempts are scheduled or due.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center pt-1">
                      <button
                        onClick={() => setEmailReminders(!emailReminders)}
                        className={`w-11 h-6 rounded-full relative transition-all ${
                          emailReminders ? 'bg-brand-500' : 'bg-ink-700 border border-ink-600'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                          emailReminders ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-800/40 my-6" />

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timetable Alert Intervals</h4>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-ink-900/40 p-4 border border-ink-700/35 rounded-xl gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Class Notification Lead Time</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Set the lead time window for class start reminders.
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <select
                        value={reminderMins}
                        onChange={(e) => setReminderMins(Number(e.target.value))}
                        className="bg-ink-800 border border-ink-700 text-slate-200 text-sm font-medium px-3.5 py-2 rounded-xl focus:outline-none focus:border-brand-500 transition-colors"
                      >
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-ink-800/40 my-6" />

                {/* Notifications Log / Feed */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-500" />
                    <span>Recent Notification History</span>
                  </h4>
                  
                  {reattemptsDue === 0 ? (
                    <div className="text-center py-8 bg-ink-900/20 border border-dashed border-ink-800 rounded-2xl text-slate-500 text-xs">
                      No active alerts. All DSA spaced repetitions are up to date!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                      {dsaProblems.filter(p => {
                        if (!p.reattempt_at) return false;
                        return new Date(p.reattempt_at) <= new Date();
                      }).map(p => (
                        <div key={p.id} className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-2.5">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">DSA Reattempt Due: {p.problem_name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Topic: {p.topic} · Spaced repetition alert active</p>
                          </div>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">DUE</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Save Notification Rules
                  </button>
                </div>
              </div>
            )}

            {/* --- ANALYTICS TAB --- */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {loadingStats ? (
                  <div className="flex justify-center py-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                  </div>
                ) : totalDsa === 0 ? (
                  <div className="text-center py-12 bg-ink-900/10 border border-dashed border-ink-800 rounded-2xl">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-505">No DSA tracker statistics available yet.</p>
                    <p className="text-xs text-slate-600 mt-0.5">Track problems to activate this performance dashboard.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Top line summary counters */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-ink-900/40 border border-ink-700/35 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{totalDsa}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Total Tracked</p>
                      </div>
                      <div className="bg-ink-900/40 border border-ink-700/35 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-emerald-450">{solvedDsa}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Solved</p>
                      </div>
                      <div className="bg-ink-900/40 border border-ink-700/35 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-500">{reattemptsDue}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Reattempts Due</p>
                      </div>
                    </div>

                    {/* Progress Chart Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Solver breakdown card */}
                      <div className="bg-ink-900/20 border border-ink-750 rounded-xl p-5">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Solves by Difficulty</h5>
                        <div className="space-y-4">
                          {/* Easy */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-300">Easy ({easySolved}/{easyDsa.length})</span>
                              <span className="text-slate-400">{easyDsa.length > 0 ? Math.round((easySolved/easyDsa.length)*100) : 0}%</span>
                            </div>
                            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${easyDsa.length > 0 ? (easySolved/easyDsa.length)*100 : 0}%` }} />
                            </div>
                          </div>

                          {/* Medium */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-300">Medium ({mediumSolved}/{mediumDsa.length})</span>
                              <span className="text-slate-400">{mediumDsa.length > 0 ? Math.round((mediumSolved/mediumDsa.length)*100) : 0}%</span>
                            </div>
                            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${mediumDsa.length > 0 ? (mediumSolved/mediumDsa.length)*100 : 0}%` }} />
                            </div>
                          </div>

                          {/* Hard */}
                          <div>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-300">Hard ({hardSolved}/{hardDsa.length})</span>
                              <span className="text-slate-400">{hardDsa.length > 0 ? Math.round((hardSolved/hardDsa.length)*100) : 0}%</span>
                            </div>
                            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${hardDsa.length > 0 ? (hardSolved/hardDsa.length)*100 : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic SVG Donut Chart */}
                      <div className="bg-ink-900/20 border border-ink-750 rounded-xl p-5 flex items-center justify-between gap-6">
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Overall Progress</h5>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-slate-300">Solved ({dsaProgressPct}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <span className="text-xs text-slate-300">In Progress ({totalDsa > 0 ? Math.round((inProgressDsa/totalDsa)*100) : 0}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
                            <span className="text-xs text-slate-300">Unsolved ({totalDsa > 0 ? Math.round((unsolvedDsa/totalDsa)*100) : 0}%)</span>
                          </div>
                        </div>

                        {/* SVG Pie Chart */}
                        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            {/* Base track */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="4.2" />
                            
                            {/* Solved Segment */}
                            <circle
                              cx="18" cy="18" r="15.915" fill="none"
                              stroke="#10b981" strokeWidth="4.2"
                              strokeDasharray={`${dsaProgressPct} ${100 - dsaProgressPct}`}
                              strokeDashoffset="0"
                            />
                            
                            {/* In Progress Segment */}
                            <circle
                              cx="18" cy="18" r="15.915" fill="none"
                              stroke="#6366f1" strokeWidth="4.2"
                              strokeDasharray={`${totalDsa > 0 ? (inProgressDsa/totalDsa)*100 : 0} ${totalDsa > 0 ? 100 - (inProgressDsa/totalDsa)*100 : 100}`}
                              strokeDashoffset={String(-dsaProgressPct)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-black text-white">{solvedDsa}</span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider -mt-0.5">Solved</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
        
      </div>
    </div>
  );
}
