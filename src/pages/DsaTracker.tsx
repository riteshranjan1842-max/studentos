import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Trash2, Loader2, ExternalLink, Code2, CheckCircle2,
  Circle, Clock, X, ChevronDown, Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { DsaProblem } from '../lib/types';

const TOPICS = [
  'Arrays & Vectors',
  'Strings',
  'Stacks & Queues',
  'Linked List',
  'Trees & BST',
  'Graphs',
  'Dynamic Programming',
  'Recursion & Backtracking',
  'Heaps / Priority Queue',
  'Sliding Window / Two Pointers',
  'Bit Manipulation',
] as const;

const TOPIC_SET = new Set<string>(TOPICS);

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

const STATUSES = ['Unsolved', 'In Progress', 'Solved'] as const;
type DsaStatus = (typeof STATUSES)[number];

const DIFF_META: Record<Difficulty, string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10',
  Medium: 'text-amber-400 bg-amber-500/10',
  Hard: 'text-rose-400 bg-rose-500/10',
};

const STATUS_ICON: Record<DsaStatus, React.ReactNode> = {
  Unsolved: <Circle className="w-4 h-4 text-slate-500" />,
  'In Progress': <Clock className="w-4 h-4 text-amber-400" />,
  Solved: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
};

const NEXT_STATUS: Record<DsaStatus, DsaStatus> = {
  Unsolved: 'In Progress',
  'In Progress': 'Solved',
  Solved: 'Unsolved',
};

export default function DsaTracker() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>('All');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('dsa_tracker')
        .select('id, user_id, problem_name, topic, difficulty, status, solution_link, problem_link, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setProblems((data as DsaProblem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function addProblem(p: {
    problem_name: string; topic: string; difficulty: Difficulty; solution_link: string; problem_link: string;
  }) {
    if (!user) return;
    const payload = {
      user_id: user.id,
      problem_name: p.problem_name.trim(),
      topic: p.topic,
      difficulty: p.difficulty,
      solution_link: p.solution_link.trim() || null,
      problem_link: p.problem_link.trim() || null,
    };
    const { data } = await supabase
      .from('dsa_tracker')
      .insert(payload)
      .select('id, user_id, problem_name, topic, difficulty, status, solution_link, problem_link, updated_at')
      .maybeSingle();
    if (data) setProblems((prev) => [data as DsaProblem, ...prev]);
    setShowAdd(false);
  }

  async function cycleStatus(id: string, current: DsaStatus) {
    const next = NEXT_STATUS[current];
    setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    await supabase
      .from('dsa_tracker')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  async function saveLink(id: string, link: string) {
    setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, solution_link: link || null } : p)));
    await supabase
      .from('dsa_tracker')
      .update({ solution_link: link || null, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  async function deleteProblem(id: string) {
    setProblems((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('dsa_tracker').delete().eq('id', id);
  }

  const solved = problems.filter((p) => p.status === 'Solved').length;
  const pct = problems.length > 0 ? Math.round((solved / problems.length) * 100) : 0;

  // Build the filter list: standard topics + any custom topics that exist in the data
  const customTopics = problems
    .map((p) => p.topic)
    .filter((t) => !TOPIC_SET.has(t))
    .filter((t, i, arr) => arr.indexOf(t) === i);
  const allFilterTopics = [...TOPICS, ...customTopics];

  // Count per topic for the filter dropdown
  const topicCount = (t: string) => problems.filter((p) => p.topic === t).length;

  const filteredProblems =
    filterTopic === 'All'
      ? problems
      : problems.filter((p) => p.topic === filterTopic);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">DSA Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Track problems by topic, save solution links, and watch your progress ring fill up.</p>
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Problem Checklist</h2>
              <p className="text-sm text-slate-500">Click a status icon to cycle: Unsolved → In Progress → Solved</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing pct={pct} solved={solved} total={problems.length} />
            <button
              onClick={() => setShowAdd((s) => !s)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Problem
            </button>
          </div>
        </div>

        {/* View filter dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 text-slate-300 text-sm font-medium px-3.5 py-2 rounded-lg border border-ink-700 transition-colors w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              {filterTopic === 'All' ? 'All Topics' : filterTopic}
              <span className="text-xs text-slate-500">
                ({filterTopic === 'All' ? problems.length : topicCount(filterTopic)})
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1 max-h-72 overflow-y-auto">
              <FilterOption
                label="All Topics"
                count={problems.length}
                active={filterTopic === 'All'}
                onClick={() => { setFilterTopic('All'); setFilterOpen(false); }}
              />
              <div className="my-1 border-t border-ink-700/60" />
              {allFilterTopics.map((t) => (
                <FilterOption
                  key={t}
                  label={t}
                  count={topicCount(t)}
                  active={filterTopic === t}
                  onClick={() => { setFilterTopic(t); setFilterOpen(false); }}
                />
              ))}
            </div>
          )}
        </div>

        {showAdd && (
          <AddProblemForm
            defaultTopic={filterTopic !== 'All' ? filterTopic : undefined}
            onSubmit={addProblem}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {/* Checklist */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">
              {filterTopic === 'All'
                ? 'No problems yet. Click "Add Problem" to start tracking.'
                : `No problems in ${filterTopic} yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredProblems.map((p) => (
              <DsaRow
                key={p.id}
                problem={p}
                showTopic={filterTopic === 'All' || customTopics.length > 0}
                onCycle={() => cycleStatus(p.id, p.status)}
                onSaveLink={(link) => saveLink(p.id, link)}
                onDelete={() => deleteProblem(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterOption({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-ink-700 transition-colors ${
        active ? 'text-brand-300 font-medium' : 'text-slate-300'
      }`}
    >
      <span>{label}</span>
      <span className="text-xs text-slate-500 bg-ink-850 px-1.5 py-0.5 rounded">{count}</span>
    </button>
  );
}

function ProgressRing({ pct, solved, total }: { pct: number; solved: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-ink-700" />
          <circle
            cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3.5"
            className="text-brand-500 transition-all duration-500"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {total === 0 ? '–' : `${pct}%`}
        </span>
      </div>
      <div className="text-xs text-slate-500 leading-tight">
        <p className="text-white font-semibold">{solved}/{total}</p>
        <p>solved</p>
      </div>
    </div>
  );
}

function DsaRow({
  problem, showTopic, onCycle, onSaveLink, onDelete,
}: {
  problem: DsaProblem;
  showTopic: boolean;
  onCycle: () => void;
  onSaveLink: (link: string) => void;
  onDelete: () => void;
}) {
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');

  function startEdit() {
    setLinkDraft(problem.solution_link ?? '');
    setEditingLink(true);
  }

  function saveLink() {
    onSaveLink(linkDraft);
    setEditingLink(false);
  }

  return (
    <div className="group flex items-center gap-3 p-2.5 rounded-lg bg-ink-800/40 hover:bg-ink-800/70 border border-ink-700/30 transition-colors">
      <button onClick={onCycle} title={`Status: ${problem.status} (click to change)`} className="shrink-0">
        {STATUS_ICON[problem.status]}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${problem.status === 'Solved' ? 'text-slate-400 line-through' : 'text-white'}`}>
          {problem.problem_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DIFF_META[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {showTopic && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300">
              {problem.topic}
            </span>
          )}
          {problem.problem_link && (
            <a
              href={problem.problem_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 truncate max-w-[160px]"
              title={problem.problem_link}
            >
              <ExternalLink className="w-3 h-3" /> Problem
            </a>
          )}
          {editingLink ? (
            <div className="flex items-center gap-1">
              <input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="LeetCode / solution URL"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveLink()}
                className="text-xs bg-ink-850 border border-ink-700 rounded px-2 py-0.5 text-slate-200 w-48 focus:outline-none focus:border-brand-500"
              />
              <button onClick={saveLink} className="text-xs text-brand-400 hover:text-brand-300">Save</button>
            </div>
          ) : problem.solution_link ? (
            <a
              href={problem.solution_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 truncate max-w-[200px]"
            >
              <ExternalLink className="w-3 h-3" /> Solution
            </a>
          ) : (
            <button onClick={startEdit} className="text-xs text-slate-600 hover:text-slate-400">+ add link</button>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddProblemForm({
  defaultTopic, onSubmit, onCancel,
}: {
  defaultTopic?: string;
  onSubmit: (p: { problem_name: string; topic: string; difficulty: Difficulty; solution_link: string; problem_link: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [problemLink, setProblemLink] = useState('');
  const [topic, setTopic] = useState<string>(defaultTopic ?? TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [link, setLink] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const finalTopic = isCustom ? customTopic.trim() : topic;
    if (!finalTopic) return;
    onSubmit({ problem_name: name, topic: finalTopic, difficulty, solution_link: link, problem_link: problemLink });
  }

  return (
    <form onSubmit={submit} className="mb-4 p-3.5 rounded-xl bg-ink-800/60 border border-brand-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Add a problem</p>
        <button type="button" onClick={onCancel} className="p-1 rounded text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Problem name (e.g. Two Sum)"
        autoFocus
        className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
      />
      <input
        value={problemLink}
        onChange={(e) => setProblemLink(e.target.value)}
        placeholder="Problem Link (Optional) — LeetCode / GeeksforGeeks URL"
        className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
      />

      {/* Unified Topics selector */}
      <div className="rounded-lg bg-ink-850/60 border border-ink-700/50 p-3 space-y-2">
        <label className="text-xs font-medium text-brand-300 flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3" /> Topics
        </label>
        {!isCustom ? (
          <select
            value={topic}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustom(true);
                setCustomTopic('');
              } else {
                setTopic(e.target.value);
              }
            }}
            className="w-full bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
          >
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Custom Topic…</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Type your custom topic…"
              autoFocus
              className="flex-1 bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => { setIsCustom(false); setCustomTopic(''); }}
              className="px-2.5 py-2 rounded-lg bg-ink-800 text-slate-400 text-xs hover:text-slate-200 transition-colors"
            >
              Back to list
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="bg-ink-850 border border-ink-700 rounded-lg px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Solution URL (optional)"
          className="bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        Add to tracker
      </button>
    </form>
  );
}
