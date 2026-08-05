import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Check, Trash2, Loader2, Calendar, Clock, MapPin, Sparkles, TrendingUp, Target, Code2, Pencil, X, Save, CalendarPlus, Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { QuickTask, StudentMetrics, TimetableEntry } from '../lib/types';
import TimetableModal, { type TimetableFormState } from '../components/TimetableModal';

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

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [adding, setAdding] = useState(false);
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [manageMode, setManageMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

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
        .select('id, user_id, title, done, due_date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTasks((data as QuickTask[]) ?? []);
      setLoadingTasks(false);
    }
    loadTasks();
  }, [user]);

  useEffect(() => {
    async function loadMetrics() {
      if (!user) return;
      const { data } = await supabase
        .from('student_metrics')
        .select('id, user_id, cgpa, attendance_pct, dsa_solved, updated_at, created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      setMetrics((data as StudentMetrics | null) ?? null);
      setLoadingMetrics(false);
    }
    loadMetrics();
  }, [user]);

  async function saveMetrics(
    patch: Partial<Pick<StudentMetrics, 'cgpa' | 'attendance_pct' | 'dsa_solved'>>,
  ) {
    if (!user) return;
    const payload = { ...patch, user_id: user.id, updated_at: new Date().toISOString() };
    const { data } = await supabase
      .from('student_metrics')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id, user_id, cgpa, attendance_pct, dsa_solved, updated_at, created_at')
      .maybeSingle();
    if (data) setMetrics(data as StudentMetrics);
  }

  useEffect(() => {
    async function loadTimetable() {
      if (!user) return;
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, user_id, day, subject, start_time, end_time, room, color, created_at')
        .eq('user_id', user.id)
        .order('day', { ascending: true })
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
      day: data.day,
      subject: data.subject.trim(),
      start_time: data.start_time,
      end_time: data.end_time,
      room: data.room.trim() || null,
      color: data.color,
    };
    if (id) {
      const { data: updated } = await supabase
        .from('timetable_entries')
        .update(payload)
        .eq('id', id)
        .select('id, user_id, day, subject, start_time, end_time, room, color, created_at')
        .maybeSingle();
      if (updated) {
        setTimetable((prev) =>
          prev.map((e) => (e.id === id ? (updated as TimetableEntry) : e)),
        );
      }
    } else {
      const { data: created } = await supabase
        .from('timetable_entries')
        .insert(payload)
        .select('id, user_id, day, subject, start_time, end_time, room, color, created_at')
        .maybeSingle();
      if (created) setTimetable((prev) => [...prev, created as TimetableEntry].sort(sortTimetable));
    }
    setModalOpen(false);
    setEditingEntry(null);
  }

  async function deleteTimetableEntry(id: string) {
    setTimetable((prev) => prev.filter((e) => e.id !== id));
    await supabase.from('timetable_entries').delete().eq('id', id);
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
    const { data } = await supabase
      .from('quick_tasks')
      .insert({ title: newTask.trim(), user_id: user.id })
      .select('id, user_id, title, done, due_date, created_at')
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
            <span className="font-semibold text-white">{todayClasses.length} classes</span> today
            and{' '}
            <span className="font-semibold text-white">{tasks.length - completedCount} pending tasks</span>.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Pill icon={<Calendar className="w-3.5 h-3.5" />} label={`Today is ${todayName}`} />
            <Pill icon={<Clock className="w-3.5 h-3.5" />} label={`${todayClasses.length} classes today`} />
            <Pill icon={<Target className="w-3.5 h-3.5" />} label={`${progress}% tasks done`} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <EditableStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Current CGPA"
          color="emerald"
          loading={loadingMetrics}
          emptyText="N/A"
          emptySub="Not set yet"
          value={metrics?.cgpa != null ? metrics.cgpa.toFixed(2) : null}
          sub="Your latest CGPA"
          inputType="number"
          inputStep="0.01"
          inputMin={0}
          inputMax={10}
          inputPlaceholder="e.g. 8.75"
          onSave={(v) => saveMetrics({ cgpa: v == null ? null : Number(v) })}
        />
        <EditableStatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Attendance"
          color="sky"
          loading={loadingMetrics}
          emptyText="N/A"
          emptySub="Not set yet"
          value={metrics?.attendance_pct != null ? `${metrics.attendance_pct.toFixed(0)}%` : null}
          sub="This semester"
          inputType="number"
          inputStep="0.1"
          inputMin={0}
          inputMax={100}
          inputPlaceholder="e.g. 89"
          suffix="%"
          onSave={(v) => saveMetrics({ attendance_pct: v == null ? null : Number(v) })}
        />
        <EditableStatCard
          icon={<Code2 className="w-5 h-5" />}
          label="DSA Solved"
          color="violet"
          loading={loadingMetrics}
          emptyText="0"
          emptySub="Not set yet"
          value={metrics?.dsa_solved != null ? String(metrics.dsa_solved) : null}
          sub="of 180 problems"
          inputType="number"
          inputStep="1"
          inputMin={0}
          inputPlaceholder="e.g. 45"
          onSave={(v) => saveMetrics({ dsa_solved: v == null ? null : Math.round(Number(v)) })}
        />
        <StatCard icon={<Sparkles className="w-5 h-5" />} label="AI Credits" value="12" sub="remaining" color="amber" />
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
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 bg-ink-800/50 hover:bg-ink-800 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id, task.done)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      task.done
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-ink-600 hover:border-brand-500'
                    }`}
                  >
                    {task.done && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Timetable */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 card-hover">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Weekly Timetable</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your classes for the week</p>
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
                Add your classes to see your weekly schedule here. It syncs to your account automatically.
              </p>
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <CalendarPlus className="w-4 h-4" /> Set Up Weekly Timetable
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {days.map((day) => {
                const dayClasses = timetable.filter((c) => c.day === day).sort(sortTimetable);
                const isToday = day === todayName;
                return (
                  <div
                    key={day}
                    className={`rounded-xl p-3 border min-h-[140px] ${
                      isToday ? 'bg-brand-600/5 border-brand-500/30' : 'bg-ink-800/40 border-ink-700/40'
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2.5 ${isToday ? 'text-brand-300' : 'text-slate-400'}`}>
                      {day.slice(0, 3)}
                    </p>
                    <div className="space-y-2">
                      {dayClasses.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">Free day</p>
                      ) : (
                        dayClasses.map((c) => (
                          <div
                            key={c.id}
                            className={`group/entry relative rounded-lg p-2 border text-xs ${colorMap[c.color] ?? colorMap.sky}`}
                          >
                            <p className="font-semibold leading-tight pr-1">{c.subject}</p>
                            <div className="flex items-center gap-1 mt-1 opacity-70">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{c.start_time}</span>
                            </div>
                            {c.room && (
                              <div className="flex items-center gap-1 opacity-70">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{c.room}</span>
                              </div>
                            )}
                            {manageMode && (
                              <div className="absolute top-1 right-1 flex gap-0.5">
                                <button
                                  onClick={() => openEditModal(c)}
                                  className="p-1 rounded bg-ink-900/80 text-slate-300 hover:text-brand-300 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => deleteTimetableEntry(c.id)}
                                  className="p-1 rounded bg-ink-900/80 text-slate-300 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
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

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <div className="glass rounded-xl p-4 card-hover">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function EditableStatCard({
  icon, label, color, value, sub, emptyText, emptySub, loading,
  inputType, inputStep, inputMin, inputMax, inputPlaceholder, suffix, onSave,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  value: string | null;
  sub: string;
  emptyText: string;
  emptySub: string;
  loading: boolean;
  inputType: string;
  inputStep?: string;
  inputMin?: number;
  inputMax?: number;
  inputPlaceholder: string;
  suffix?: string;
  onSave: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  };

  function startEdit() {
    setDraft(value != null ? value.replace('%', '') : '');
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    onSave(draft.trim() === '' ? null : draft);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="glass rounded-xl p-4 border-brand-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
            {icon}
          </div>
          <button onClick={cancel} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-ink-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <div className="relative">
            <input
              type={inputType}
              step={inputStep}
              min={inputMin}
              max={inputMax}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={inputPlaceholder}
              autoFocus
              className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">{suffix}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 card-hover group relative">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <button
          onClick={startEdit}
          title="Edit"
          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="h-8 flex items-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
        </div>
      ) : value != null ? (
        <p className="text-2xl font-bold text-white">{value}</p>
      ) : (
        <div>
          <p className="text-2xl font-bold text-slate-600">{emptyText}</p>
          <p className="text-xs text-slate-600 mt-0.5">{emptySub}</p>
        </div>
      )}
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {value != null && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}


