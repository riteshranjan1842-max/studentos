import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus, Trash2, Loader2, Briefcase, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { JobApplication } from '../lib/types';

const JOB_STATUSES = ['Applied', 'Interviewing', 'Offer', 'Rejected'] as const;
type JobStatus = (typeof JOB_STATUSES)[number];

const JOB_STATUS_META: Record<JobStatus, { color: string; dot: string; border: string }> = {
  Applied: { color: 'text-sky-300', dot: 'bg-sky-500', border: 'border-sky-500/30' },
  Interviewing: { color: 'text-amber-300', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  Offer: { color: 'text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
  Rejected: { color: 'text-rose-300', dot: 'bg-rose-500', border: 'border-rose-500/30' },
};

export default function Trackers() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('job_applications')
        .select('id, user_id, company_name, role, status, date_applied, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setJobs((data as JobApplication[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  async function addJob(j: { company_name: string; role: string }) {
    if (!user) return;
    const payload = { user_id: user.id, company_name: j.company_name.trim(), role: j.role.trim() };
    const { data } = await supabase
      .from('job_applications')
      .insert(payload)
      .select('id, user_id, company_name, role, status, date_applied, created_at')
      .maybeSingle();
    if (data) setJobs((prev) => [data as JobApplication, ...prev]);
    setShowAdd(false);
  }

  async function moveJob(id: string, status: JobStatus) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    await supabase.from('job_applications').update({ status }).eq('id', id);
  }

  async function deleteJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    await supabase.from('job_applications').delete().eq('id', id);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Application Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Track your job applications from Applied to Offer.</p>
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Job Application Pipeline</h2>
              <p className="text-sm text-slate-500">Move cards between stages as you progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>

        {showAdd && <AddJobForm onSubmit={addJob} onCancel={() => setShowAdd(false)} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {JOB_STATUSES.map((status) => {
              const colJobs = jobs.filter((j) => j.status === status);
              const meta = JOB_STATUS_META[status];
              return (
                <div key={status} className={`rounded-xl border ${meta.border} bg-ink-800/30 p-3 min-h-[200px]`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <h3 className={`text-sm font-semibold ${meta.color}`}>{status}</h3>
                    </div>
                    <span className="text-xs text-slate-500 bg-ink-800 px-1.5 py-0.5 rounded">{colJobs.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colJobs.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-6">No applications</p>
                    ) : (
                      colJobs.map((j) => (
                        <JobCard
                          key={j.id}
                          job={j}
                          onMove={(s) => moveJob(j.id, s)}
                          onDelete={() => deleteJob(j.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({
  job, onMove, onDelete,
}: {
  job: JobApplication;
  onMove: (status: JobStatus) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const date = new Date(job.date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="group relative p-3 rounded-lg bg-ink-850/80 border border-ink-700/50 hover:border-ink-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{job.company_name}</p>
          <p className="text-xs text-slate-400 truncate">{job.role}</p>
          <p className="text-[10px] text-slate-600 mt-1">Applied {date}</p>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 p-1 rounded text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="relative mt-2">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 bg-ink-800 hover:bg-ink-700 px-2 py-1.5 rounded-md transition-colors"
        >
          Move to... <ChevronDown className="w-3 h-3" />
        </button>
        {menuOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-ink-800 border border-ink-700 rounded-lg shadow-xl py-1">
            {JOB_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { onMove(s); setMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-ink-700 transition-colors ${
                  s === job.status ? 'text-brand-300 font-medium' : 'text-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${JOB_STATUS_META[s].dot}`} />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddJobForm({
  onSubmit, onCancel,
}: {
  onSubmit: (j: { company_name: string; role: string }) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onSubmit({ company_name: company, role });
  }

  return (
    <form onSubmit={submit} className="mb-4 p-3.5 rounded-xl bg-ink-800/60 border border-brand-500/20 flex flex-col sm:flex-row gap-2 sm:items-end">
      <div className="flex-1">
        <label className="text-xs text-slate-500 mb-1 block">Company</label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Google"
          autoFocus
          className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-slate-500 mb-1 block">Role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. SDE Intern"
          className="w-full bg-ink-850 border border-ink-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg bg-ink-800 text-slate-400 text-sm hover:text-slate-200 transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
          Add
        </button>
      </div>
    </form>
  );
}
