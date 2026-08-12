import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Check, Trash2, Loader2, Calendar, Clock, MapPin, Sparkles, Target, Pencil, CalendarPlus, Settings2, User, Trophy, Compass, ExternalLink, ChevronDown, ChefHat } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { QuickTask, TimetableEntry } from '../lib/types';
import TimetableModal, { type TimetableFormState } from '../components/TimetableModal';
import { STRIVER_SHEET_PROBLEMS } from './DsaTracker';
import { NEETCODE_150_PROBLEMS } from '../data/neetcode150';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const colorMap: Record<string, string> = {
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
};

function sortTimetable(a: TimetableEntry, b: TimetableEntry) {
  const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
  if (dayOrder !== 0) return dayOrder;
  return a.start_time.localeCompare(b.start_time);
}

const TASK_COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'amber', 'rose'];

const TASK_COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/35 text-white',
  green: 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/35 text-white',
  purple: 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/35 text-white',
  orange: 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/35 text-white',
  pink: 'bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/35 text-white',
  teal: 'bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/35 text-white',
  amber: 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/35 text-white',
  rose: 'bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/35 text-white',
};

const PLATFORM_NAMES: Record<string, string> = {
  leetcode: 'LeetCode',
  codechef: 'CodeChef',
  geeksforgeeks: 'GeeksforGeeks',
  codeforces: 'Codeforces',
  hackerrank: 'HackerRank',
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  leetcode: (
    <svg className="w-5 h-5 text-orange-500 fill-current" viewBox="0 0 24 24">
      <path d="M16.102 17.93l-2.69 2.607c-.466.451-1.111.696-1.744.696a2.285 2.285 0 0 1-1.745-.696L3.92 14.517a2.262 2.262 0 0 1 0-3.225l9.098-9.023c.448-.449 1.097-.696 1.738-.696.642 0 1.29.247 1.739.696l2.793 2.766a2.262 2.262 0 0 1 0 3.225l-4.57 4.536t-4.57 4.536c-.449.449-1.097.696-1.739.696-.642 0-1.29-.247-1.738-.696L8.47 11.23a.754.754 0 0 1 0-1.075.77.77 0 0 1 1.082 0l2.366 2.347 4.57-4.537a.754.754 0 0 1 1.083 0 .77.77 0 0 1 0 1.075l-4.569 4.537-2.691 2.671-1.084-1.075 4.57-4.537a.754.754 0 0 1 1.083 0 .77.77 0 0 1 0 1.075l-4.57 4.537z" />
    </svg>
  ),
  codechef: (
    <ChefHat className="w-5 h-5 text-[#b97a3e]" />
  ),
  geeksforgeeks: (
    <svg className="w-5 h-5 text-[#2f8d46] fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 14.8c-1.32-.42-2.12-1.63-2.12-3.32 0-1.72.84-2.92 2.2-3.32.32-.1.44-.46.24-.72l-.4-.52c-.14-.18-.42-.2-.6-.06C7.3 10.38 6.5 11.96 6.5 13.5c0 1.94.94 3.7 3.02 4.2.22.06.46-.1.46-.34v-.7c-.02-.26-.2-.36-.28-.36zm4.8-.84c0-.24-.24-.4-.46-.34-.08 0-.26.1-.28.36v.7c0 .24.24.4.46.34 2.08-.5 3.02-2.26 3.02-4.2 0-1.54-.8-3.12-3.02-4.64-.18-.14-.46-.12-.6.06l-.4.52c-.2.26-.08.62.24.72 1.36.4 2.2 1.6 2.2 3.32 0 1.69-.8 2.9-2.12 3.32z" />
    </svg>
  ),
  codeforces: (
    <div className="flex gap-0.5 items-end h-5 w-5 shrink-0 justify-center">
      <div className="w-1.5 h-3 bg-blue-500 rounded-sm"></div>
      <div className="w-1.5 h-5 bg-red-500 rounded-sm"></div>
      <div className="w-1.5 h-4 bg-yellow-500 rounded-sm"></div>
    </div>
  ),
  hackerrank: (
    <svg className="w-5 h-5 text-[#2ec866] fill-current" viewBox="0 0 24 24">
      <path d="M12.012 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm.012 16.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zm-3-8.5v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1zm4 3h-2v-2h2v2z" />
    </svg>
  ),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dueDsaCount, setDueDsaCount] = useState(0);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [manageMode, setManageMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // POTD State
  const [activePlatform, setActivePlatform] = useState<string>('leetcode');
  const [allPotd, setAllPotd] = useState<Record<string, { title: string; link: string; difficulty: string; tags: string[] } | null>>({});
  const [loadingPotd, setLoadingPotd] = useState(true);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);

  // Sheet progress state (Striver and NeetCode)
  const [activeSheet, setActiveSheet] = useState<'striver' | 'neetcode'>('striver');
  const [sheetProgress, setSheetProgress] = useState<{
    striver: { solved: number; total: number };
    neetcode: { solved: number; total: number };
  }>({
    striver: { solved: 0, total: 191 },
    neetcode: { solved: 0, total: 150 }
  });
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchPotd() {
      setLoadingPotd(true);
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/potd`, {
          method: 'POST',
          headers
        });

        if (res.ok) {
          const json = await res.json();
          if (json) {
            setAllPotd(json);
            setLoadingPotd(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Edge Function potd failed, falling back to local rotation:', err);
      }

      // Fallback
      const getDayOfYear = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
      };

      const fallbackProblems = [
        {
          title: "Two Sum",
          link: "https://leetcode.com/problems/two-sum/",
          difficulty: "Easy",
          tags: ["Arrays", "Hash Table"]
        },
        {
          title: "Add Two Numbers",
          link: "https://leetcode.com/problems/add-two-numbers/",
          difficulty: "Medium",
          tags: ["Linked List", "Math"]
        },
        {
          title: "Longest Substring Without Repeating Characters",
          link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
          difficulty: "Medium",
          tags: ["Hash Table", "String", "Sliding Window"]
        },
        {
          title: "Container With Most Water",
          link: "https://leetcode.com/problems/container-with-most-water/",
          difficulty: "Medium",
          tags: ["Arrays", "Two Pointers"]
        }
      ];

      const dayOfYear = getDayOfYear();
      
      const localResults: Record<string, any> = {
        leetcode: fallbackProblems[dayOfYear % fallbackProblems.length],
        codechef: {
          title: "Chef and Brain Speed",
          link: "https://www.codechef.com/problems/CBSPEED",
          difficulty: "Easy",
          tags: ["Basic Math"]
        },
        geeksforgeeks: {
          title: "Find transition point",
          link: "https://practice.geeksforgeeks.org/problems/find-transition-point-1587115620/1",
          difficulty: "Easy",
          tags: ["Binary Search"]
        },
        codeforces: {
          title: "158A. Next Round",
          link: "https://codeforces.com/problemset/problem/158/A",
          difficulty: "Easy",
          tags: ["implementation"]
        },
        hackerrank: {
          title: "Simple Array Sum",
          link: "https://www.hackerrank.com/challenges/simple-array-sum/problem",
          difficulty: "Easy",
          tags: ["Algorithms"]
        }
      };

      setAllPotd(localResults);
      setLoadingPotd(false);
    }
    
    fetchPotd();
  }, []);

  useEffect(() => {
    async function loadSheetProgress() {
      if (!user) return;
      setLoadingSheet(true);
      try {
        const { data } = await supabase
          .from('dsa_tracker')
          .select('problem_name, status')
          .eq('user_id', user.id);

        if (data) {
          const solvedProblems = data.filter((p) => p.status === 'Solved');
          
          const striverSolved = solvedProblems.filter((p) => 
            STRIVER_SHEET_PROBLEMS.some(s => s.name.toLowerCase() === p.problem_name.toLowerCase())
          ).length;
          
          const neetcodeSolved = solvedProblems.filter((p) => 
            NEETCODE_150_PROBLEMS.some(s => s.name.toLowerCase() === p.problem_name.toLowerCase())
          ).length;
          
          setSheetProgress({
            striver: { solved: striverSolved, total: STRIVER_SHEET_PROBLEMS.length },
            neetcode: { solved: neetcodeSolved, total: NEETCODE_150_PROBLEMS.length }
          });
        }
      } catch (err) {
        console.error('Error loading sheet progress:', err);
      } finally {
        setLoadingSheet(false);
      }
    }
    loadSheetProgress();
  }, [user]);

  const displayName = profile?.full_name || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayName = days[(new Date().getDay() + 6) % 7] || 'Monday';
  const todayClasses = timetable.filter((c) => c.day === todayName);

  useEffect(() => {
    async function loadTasks() {
      if (!user) return;
      const { data } = await supabase
        .from('quick_tasks')
        .select('id, user_id, title, done, due_date, color, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTasks((data as QuickTask[]) ?? []);
      setLoadingTasks(false);
    }
    loadTasks();
  }, [user]);

  useEffect(() => {
    async function loadDueDsa() {
      if (!user) return;
      const { data } = await supabase
        .from('dsa_tracker')
        .select('id, reattempt_at')
        .eq('user_id', user.id);
      
      const due = (data ?? []).filter((p) => {
        if (!p.reattempt_at) return false;
        return new Date(p.reattempt_at) <= new Date();
      }).length;
      
      setDueDsaCount(due);
    }
    loadDueDsa();
  }, [user]);

  useEffect(() => {
    async function loadTimetable() {
      if (!user) return;
      const { data } = await supabase
        .from('timetable')
        .select('id, user_id, day:day_of_week, subject, start_time, end_time, professor, room, color, created_at')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      setTimetable((data as TimetableEntry[]) ?? []);
      setLoadingTimetable(false);
    }
    loadTimetable();
  }, [user]);

  async function saveTimetableEntry(data: TimetableFormState, id?: string) {
    if (!user) return;
    const payload = {
      user_id: user.id,
      day_of_week: data.day,
      subject: data.subject.trim(),
      start_time: data.start_time,
      end_time: data.end_time,
      room: data.room.trim() || null,
      color: data.color,
      branch: 'Computer Science',
    };
    if (id) {
      const { data: updated } = await supabase
        .from('timetable')
        .update(payload)
        .eq('id', id)
        .select('id, user_id, day:day_of_week, subject, start_time, end_time, professor, room, color, created_at')
        .maybeSingle();
      if (updated) {
        setTimetable((prev) =>
          prev.map((e) => (e.id === id ? (updated as TimetableEntry) : e)),
        );
      }
    } else {
      const { data: created } = await supabase
        .from('timetable')
        .insert(payload)
        .select('id, user_id, day:day_of_week, subject, start_time, end_time, professor, room, color, created_at')
        .maybeSingle();
      if (created) setTimetable((prev) => [...prev, created as TimetableEntry].sort(sortTimetable));
    }
    setModalOpen(false);
    setEditingEntry(null);
  }

  async function deleteTimetableEntry(id: string) {
    setTimetable((prev) => prev.filter((e) => e.id !== id));
    await supabase.from('timetable').delete().eq('id', id);
  }

  function openAddModal() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  function openEditModal(entry: TimetableEntry) {
    setEditingEntry(entry);
    setModalOpen(true);
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !user) return;
    setAdding(true);
    const color = TASK_COLORS[tasks.length % TASK_COLORS.length];
    const { data } = await supabase
      .from('quick_tasks')
      .insert({ title: newTask.trim(), user_id: user.id, color })
      .select('id, user_id, title, done, due_date, color, created_at')
      .maybeSingle();
    if (data) setTasks((prev) => [data as QuickTask, ...prev]);
    setNewTask('');
    setAdding(false);
  }

  async function toggleTask(id: string, done: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    await supabase.from('quick_tasks').update({ done: !done }).eq('id', id);
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('quick_tasks').delete().eq('id', id);
  }

  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const potd = allPotd[activePlatform] || null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 p-6 lg:p-8 mb-6">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(93,157,255,0.5) 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <p className="text-brand-200/80 text-sm font-medium">{greeting},</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mt-1">
            {displayName} 👋
          </h1>
          <p className="text-brand-100/70 mt-3 max-w-lg">
            Here's what your week looks like. You have{' '}
            <span className="font-semibold text-white">{todayClasses.length} classes</span> today,{' '}
            <span className="font-semibold text-white">{tasks.length - completedCount} pending tasks</span>
            {dueDsaCount > 0 && (
              <>
                , and <span className="font-semibold text-rose-300 animate-pulse">{dueDsaCount} DSA reattempts</span> due today
              </>
            )}
            .
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Pill icon={<Calendar className="w-3.5 h-3.5" />} label={`Today is ${todayName}`} />
            <Pill icon={<Clock className="w-3.5 h-3.5" />} label={`${todayClasses.length} classes today`} />
            <Pill icon={<Target className="w-3.5 h-3.5" />} label={`${progress}% tasks done`} />
            {dueDsaCount > 0 && (
              <Pill icon={<Clock className="w-3.5 h-3.5 text-rose-300 animate-pulse" />} label={`${dueDsaCount} DSA Reattempts Due`} />
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
        
        {/* Card 1: LeetCode POTD */}
        <div 
          onClick={() => {
            if (potd?.link) {
              window.open(potd.link, '_blank', 'noreferrer');
            }
          }}
          className={`glass rounded-xl p-4 card-hover flex flex-col justify-between h-[155px] relative cursor-pointer ${platformDropdownOpen ? 'z-30' : 'z-10'}`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-500/10 shrink-0">
                  {PLATFORM_ICONS[activePlatform]}
                </div>
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">
                  {PLATFORM_NAMES[activePlatform]} POTD
                </span>
              </div>
              
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {potd && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    potd.difficulty === 'Easy' 
                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' 
                      : potd.difficulty === 'Medium' 
                        ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' 
                        : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {potd.difficulty}
                  </span>
                )}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlatformDropdownOpen((o) => !o);
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-350 hover:bg-ink-800 transition-colors border border-ink-700/60"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${platformDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {platformDropdownOpen && (
                    <div className="absolute right-0 mt-1 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1 w-36 z-50 animate-fadeIn">
                      {Object.keys(PLATFORM_NAMES).map((plat) => (
                        <button
                          key={plat}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlatform(plat);
                            setPlatformDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
                            activePlatform === plat 
                              ? 'text-brand-400 bg-brand-500/10' 
                              : 'text-slate-300 hover:text-white hover:bg-ink-700'
                          }`}
                        >
                          {PLATFORM_ICONS[plat]}
                          <span>{PLATFORM_NAMES[plat]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3">
              {loadingPotd ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-500">Loading POTD...</span>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-white leading-snug truncate" title={potd?.title}>
                    {potd?.title || 'No active problem'}
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-[38px] overflow-hidden">
                    {potd?.tags && potd.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-ink-800 border border-ink-700 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-2.5 border-t border-ink-700/50 pt-2 flex items-center justify-between text-[10px]">
            <span className="font-extrabold uppercase tracking-wider text-slate-500">{PLATFORM_NAMES[activePlatform]} POTD</span>
            <span className="text-brand-400 font-bold flex items-center gap-0.5 hover:text-brand-300">Solve <ExternalLink className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Card 2: Sheet Selector Progress */}
        <div 
          onClick={() => {
            const targetTab = activeSheet === 'striver' ? 'striver-sheet' : 'neetcode-150';
            navigate(`/tech/dsa?tab=${targetTab}`);
          }}
          className={`glass rounded-xl p-4 card-hover flex flex-col justify-between h-[155px] relative cursor-pointer ${sheetDropdownOpen ? 'z-30' : 'z-10'}`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-400 bg-violet-500/10 shrink-0">
                  <Trophy className="w-4.5 h-4.5" />
                </div>
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">
                  {activeSheet === 'striver' ? 'Striver SDE Sheet' : 'NeetCode 150'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSheetDropdownOpen((o) => !o);
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-350 hover:bg-ink-800 transition-colors border border-ink-700/60"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sheetDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sheetDropdownOpen && (
                    <div className="absolute right-0 mt-1 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1 w-44 z-50 animate-fadeIn">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSheet('striver');
                          setSheetDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
                          activeSheet === 'striver' 
                            ? 'text-brand-400 bg-brand-500/10' 
                            : 'text-slate-300 hover:text-white hover:bg-ink-700'
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5 text-violet-400" />
                        <span>Striver SDE Sheet</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSheet('neetcode');
                          setSheetDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-2 ${
                          activeSheet === 'neetcode' 
                            ? 'text-brand-400 bg-brand-500/10' 
                            : 'text-slate-300 hover:text-white hover:bg-ink-700'
                        }`}
                      >
                        <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                        <span>NeetCode 150</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3">
              {loadingSheet ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-500">Loading progress...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black text-white">
                    {activeSheet === 'striver' ? sheetProgress.striver.solved : sheetProgress.neetcode.solved} / {activeSheet === 'striver' ? sheetProgress.striver.total : sheetProgress.neetcode.total}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Problems Solved</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2.5 border-t border-ink-700/50 pt-2 flex items-center justify-between text-[10px]">
            <span className="font-extrabold uppercase tracking-wider text-slate-500">
              {activeSheet === 'striver' ? 'Striver SDE Sheet' : 'NeetCode 150'}
            </span>
            <span className="text-brand-400 font-bold flex items-center gap-0.5 hover:text-brand-300">View <Compass className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Card 3: Coding Roadmap Quick Access */}
        <div className="glass rounded-xl p-4 card-hover flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 bg-emerald-500/10 shrink-0">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Coding Roadmap</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <Link to="/tech/roadmap#stage-0" className="px-2 py-1 text-[9px] font-bold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all text-center truncate">
                Fundamentals
              </Link>
              <Link to="/tech/roadmap#stage-1" className="px-2 py-1 text-[9px] font-bold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-lg transition-all text-center truncate">
                DSA
              </Link>
              <Link to="/tech/roadmap#stage-2" className="px-2 py-1 text-[9px] font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all text-center truncate">
                Web Dev
              </Link>
              <Link to="/tech/roadmap#stage-3" className="px-2 py-1 text-[9px] font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all text-center truncate">
                Systems
              </Link>
            </div>
          </div>
          <div className="border-t border-ink-700/50 pt-2 text-[10px] text-slate-500 text-center">
            Quick Modules Navigation
          </div>
        </div>

        {/* Card 4: AI Credits */}
        <div className="glass rounded-xl p-4 card-hover flex flex-col justify-between h-[155px]">
          <div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-400 bg-amber-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white">100</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">AI Credits</p>
            </div>
          </div>
          <div className="mt-2.5 border-t border-ink-700/50 pt-2 flex items-center justify-between text-[10px]">
            <span className="font-extrabold uppercase tracking-wider text-slate-500">Credits Balance</span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[9px]">Remaining</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Tasks */}
        <div className="lg:col-span-1 glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Tasks</h2>
            <span className="text-xs text-slate-500 bg-ink-800 px-2.5 py-1 rounded-full">
              {completedCount}/{tasks.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <form onSubmit={addTask} className="flex gap-2 mb-4">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={adding || !newTask.trim()}
              className="px-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-lg text-white transition-colors"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {loadingTasks ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No tasks yet. Add one above.
              </div>
            ) : (
              tasks.map((task) => {
                const bgClass = task.color && TASK_COLOR_CLASSES[task.color] 
                  ? TASK_COLOR_CLASSES[task.color] 
                  : 'bg-ink-800/50 hover:bg-ink-800 border border-transparent text-slate-200';
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${bgClass}`}
                  >
                  <button
                    onClick={() => toggleTask(task.id, task.done)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      task.done
                        ? 'bg-brand-650 border-brand-550 text-white'
                        : task.color 
                          ? 'border-white/40 hover:border-white/80' 
                          : 'border-ink-600 hover:border-brand-500'
                    }`}
                  >
                    {task.done && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm font-semibold ${task.done ? 'line-through opacity-50 text-white' : 'text-white'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-all ${
                      task.color ? 'text-white/60 hover:text-white' : 'text-slate-505 hover:text-rose-400'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Respective Day Schedule</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your classes for today</p>
            </div>
            {timetable.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
                <button
                  onClick={() => setManageMode((m) => !m)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    manageMode ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30' : 'bg-ink-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" /> {manageMode ? 'Done' : 'Manage'}
                </button>
              </div>
            )}
          </div>

          {loadingTimetable ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          ) : timetable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <CalendarPlus className="w-7 h-7 text-brand-400" />
              </div>
              <h3 className="text-base font-semibold text-white">No timetable yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Add your classes to see your schedule here. It syncs to your account automatically.
              </p>
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <CalendarPlus className="w-4 h-4" /> Set Up Weekly Timetable
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-brand-600/5 border border-brand-500/20 rounded-xl p-4">
                <div>
                  <h3 className="text-base font-semibold text-white uppercase tracking-wide">
                    {todayName}'s Classes
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Showing today's schedule. You have {todayClasses.length} classes today.
                  </p>
                </div>
              </div>

              {todayClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-ink-800/20 border border-ink-700/30 rounded-xl">
                  <p className="text-sm text-slate-500 italic">No classes today. Enjoy your day! 🎉</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayClasses.sort(sortTimetable).map((c) => (
                    <div
                      key={c.id}
                      className={`group/entry relative rounded-xl p-4 border card-hover ${colorMap[c.color] ?? colorMap.sky}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-base font-semibold text-white leading-tight">{c.subject}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs opacity-80">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{c.start_time} - {c.end_time}</span>
                            </div>
                            {c.room && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Room: {c.room}</span>
                              </div>
                            )}
                            {c.professor && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>Prof: {c.professor}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {manageMode && (
                          <div className="flex gap-1.5 shrink-0 ml-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 rounded-lg bg-ink-900/80 text-slate-300 hover:text-brand-300 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTimetableEntry(c.id)}
                              className="p-1.5 rounded-lg bg-ink-900/80 text-slate-300 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TimetableModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        onSave={saveTimetableEntry}
        editing={editingEntry}
      />
    </div>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/15 rounded-full px-3 py-1.5 text-xs text-white/90">
      {icon}
      <span>{label}</span>
    </div>
  );
}




