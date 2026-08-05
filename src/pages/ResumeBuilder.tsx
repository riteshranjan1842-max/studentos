import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Check, User, GraduationCap,
  Briefcase, Code2, FolderGit2, Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ResumeData, EducationItem, ExperienceItem, ProjectItem } from '../lib/types';

const EMPTY_RESUME = {
  full_name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  website: '',
  summary: '',
  is_fresher: false,
  tenth_marks: '',
  tenth_year: '',
  tenth_board: '',
  twelfth_marks: '',
  twelfth_year: '',
  twelfth_board: '',
  education: [] as EducationItem[],
  experience: [] as ExperienceItem[],
  skills: [] as string[],
  projects: [] as ProjectItem[],
};

type ResumeState = typeof EMPTY_RESUME;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [resume, setResume] = useState<ResumeState>(EMPTY_RESUME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  // Load resume
  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('resumes')
        .select('id, user_id, full_name, email, phone, location, linkedin, github, website, summary, education, experience, skills, projects, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const r = data as ResumeData;
        setResume({
          full_name: r.full_name ?? '',
          email: r.email ?? '',
          phone: r.phone ?? '',
          location: r.location ?? '',
          linkedin: r.linkedin ?? '',
          github: r.github ?? '',
          website: r.website ?? '',
          summary: r.summary ?? '',
          is_fresher: r.is_fresher ?? false,
          tenth_marks: r.tenth_marks ?? '',
          tenth_year: r.tenth_year ?? '',
          tenth_board: r.tenth_board ?? '',
          twelfth_marks: r.twelfth_marks ?? '',
          twelfth_year: r.twelfth_year ?? '',
          twelfth_board: r.twelfth_board ?? '',
          education: r.education ?? [],
          experience: r.experience ?? [],
          skills: r.skills ?? [],
          projects: r.projects ?? [],
        });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  // Debounced save
  const save = useCallback(async (data: ResumeState) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('resumes')
      .upsert({
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }, [user]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => save(resume), 800);
    return () => clearTimeout(t);
  }, [resume, loading, save]);

  function update<K extends keyof ResumeState>(key: K, value: ResumeState[K]) {
    setResume((prev) => ({ ...prev, [key]: value }));
  }

  // Education
  function addEducation() {
    update('education', [...resume.education, { id: uid(), institution: '', degree: '', field: '', startYear: '', endYear: '', gpa: '' }]);
  }
  function updateEdu(id: string, patch: Partial<EducationItem>) {
    update('education', resume.education.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEdu(id: string) {
    update('education', resume.education.filter((e) => e.id !== id));
  }

  // Experience
  function addExperience() {
    update('experience', [...resume.experience, { id: uid(), company: '', role: '', startDate: '', endDate: '', description: '' }]);
  }
  function updateExp(id: string, patch: Partial<ExperienceItem>) {
    update('experience', resume.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeExp(id: string) {
    update('experience', resume.experience.filter((e) => e.id !== id));
  }

  // Skills
  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    update('skills', [...resume.skills, s]);
    setSkillInput('');
  }
  function removeSkill(idx: number) {
    update('skills', resume.skills.filter((_, i) => i !== idx));
  }

  // Projects
  function addProject() {
    update('projects', [...resume.projects, { id: uid(), name: '', description: '', link: '', tech: '' }]);
  }
  function updateProj(id: string, patch: Partial<ProjectItem>) {
    update('projects', resume.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeProj(id: string) {
    update('projects', resume.projects.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Resume Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Fill in your details — they save automatically and power your portfolio preview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {saving ? (
            <span className="flex items-center gap-1.5 text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1.5 text-emerald-400/70"><Check className="w-3.5 h-3.5" /> Saved {savedAt}</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        {/* Personal Info */}
        <Section icon={<User className="w-5 h-5" />} title="Personal Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Full Name" value={resume.full_name} onChange={(v) => update('full_name', v)} placeholder="Jane Doe" />
            <Field label="Email" value={resume.email} onChange={(v) => update('email', v)} placeholder="jane@email.com" />
            <Field label="Phone" value={resume.phone} onChange={(v) => update('phone', v)} placeholder="+1 555-0100" />
            <Field label="Location" value={resume.location} onChange={(v) => update('location', v)} placeholder="San Francisco, CA" />
            <Field label="LinkedIn" value={resume.linkedin} onChange={(v) => update('linkedin', v)} placeholder="linkedin.com/in/janedoe" />
            <Field label="GitHub" value={resume.github} onChange={(v) => update('github', v)} placeholder="github.com/janedoe" />
            <Field label="Website" value={resume.website} onChange={(v) => update('website', v)} placeholder="janedoe.dev" />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Professional Summary</label>
            <textarea
              value={resume.summary}
              onChange={(e) => update('summary', e.target.value)}
              rows={3}
              placeholder="A short paragraph about your background and goals…"
              className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>
        </Section>

        {/* Education */}
        <Section icon={<GraduationCap className="w-5 h-5" />} title="Education" onAdd={addEducation} addLabel="Add Education">
          {/* 10th & 12th Board — fixed at top */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20">
              <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-3">10th Board (Secondary)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Marks (%)" value={resume.tenth_marks} onChange={(v) => update('tenth_marks', v)} placeholder="92.5" />
                <Field label="Completion Year" value={resume.tenth_year} onChange={(v) => update('tenth_year', v)} placeholder="2019" />
                <BoardSelect label="Board" value={resume.tenth_board} onChange={(v) => update('tenth_board', v)} />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20">
              <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-3">12th Board (Higher Secondary)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Marks (%)" value={resume.twelfth_marks} onChange={(v) => update('twelfth_marks', v)} placeholder="89.0" />
                <Field label="Completion Year" value={resume.twelfth_year} onChange={(v) => update('twelfth_year', v)} placeholder="2021" />
                <BoardSelect label="Board" value={resume.twelfth_board} onChange={(v) => update('twelfth_board', v)} />
              </div>
            </div>
          </div>

          {/* University degrees — repeatable */}
          <div className="pt-2">
            <p className="text-xs font-medium text-slate-500 mb-2">University / College Degrees</p>
            {resume.education.length === 0 && <EmptyHint text="Add your college education" />}
            {resume.education.map((e) => (
              <div key={e.id} className="group relative p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/40 space-y-3 mb-3">
                <RemoveBtn onClick={() => removeEdu(e.id)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Institution" value={e.institution} onChange={(v) => updateEdu(e.id, { institution: v })} placeholder="Stanford University" />
                  <Field label="Degree" value={e.degree} onChange={(v) => updateEdu(e.id, { degree: v })} placeholder="B.S." />
                  <Field label="Field of Study" value={e.field} onChange={(v) => updateEdu(e.id, { field: v })} placeholder="Computer Science" />
                  <Field label="GPA" value={e.gpa} onChange={(v) => updateEdu(e.id, { gpa: v })} placeholder="3.8" />
                  <Field label="Start Year" value={e.startYear} onChange={(v) => updateEdu(e.id, { startYear: v })} placeholder="2021" />
                  <Field label="End Year" value={e.endYear} onChange={(v) => updateEdu(e.id, { endYear: v })} placeholder="2025" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section icon={<Briefcase className="w-5 h-5" />} title="Experience" onAdd={!resume.is_fresher ? addExperience : undefined} addLabel="Add Experience">
          {/* Fresher toggle */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-800/60 border border-ink-700/50 cursor-pointer hover:border-brand-500/30 transition-colors">
            <input
              type="checkbox"
              checked={resume.is_fresher}
              onChange={(e) => update('is_fresher', e.target.checked)}
              className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30"
            />
            <span className="text-sm text-slate-200">I am a fresher / I don't have corporate work experience yet</span>
          </label>

          {/* Experience blocks — hidden when fresher */}
          <div className={`transition-all duration-300 overflow-hidden ${resume.is_fresher ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            {resume.experience.length === 0 && <EmptyHint text="Add your work experience" />}
            {resume.experience.map((e) => (
              <div key={e.id} className="group relative p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/40 space-y-3">
                <RemoveBtn onClick={() => removeExp(e.id)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Company" value={e.company} onChange={(v) => updateExp(e.id, { company: v })} placeholder="Google" />
                  <Field label="Role" value={e.role} onChange={(v) => updateExp(e.id, { role: v })} placeholder="SDE Intern" />
                  <Field label="Start Date" value={e.startDate} onChange={(v) => updateExp(e.id, { startDate: v })} placeholder="Jun 2024" />
                  <Field label="End Date" value={e.endDate} onChange={(v) => updateExp(e.id, { endDate: v })} placeholder="Aug 2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea
                    value={e.description}
                    onChange={(ev) => updateExp(e.id, { description: ev.target.value })}
                    rows={2}
                    placeholder="What did you work on? Use bullet-style lines."
                    className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Fresher notice — shown when fresher */}
          <div className={`transition-all duration-300 overflow-hidden ${resume.is_fresher ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 rounded-xl bg-brand-500/5 border border-brand-500/20 text-center">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                No experience added. Your portfolio will automatically highlight your <span className="text-brand-300 font-medium">Projects</span>, <span className="text-brand-300 font-medium">Academic Achievements</span>, and <span className="text-brand-300 font-medium">Technical Skills</span> instead!
              </p>
            </div>
          </div>
        </Section>

        {/* Skills */}
        <Section icon={<Code2 className="w-5 h-5" />} title="Technical Skills">
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Type a skill and press Enter (e.g. React)"
              className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button onClick={addSkill} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-3.5 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {resume.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((s, i) => (
                <span key={i} className="group flex items-center gap-1.5 bg-ink-800 border border-ink-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg">
                  {s}
                  <button onClick={() => removeSkill(i)} className="text-slate-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {resume.skills.length === 0 && <EmptyHint text="Add your technical skills" />}
        </Section>

        {/* Projects */}
        <Section icon={<FolderGit2 className="w-5 h-5" />} title="Projects" onAdd={addProject} addLabel="Add Project">
          {resume.projects.length === 0 && <EmptyHint text="Add your projects" />}
          {resume.projects.map((p) => (
            <div key={p.id} className="group relative p-3.5 rounded-xl bg-ink-800/40 border border-ink-700/40 space-y-3">
              <RemoveBtn onClick={() => removeProj(p.id)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Project Name" value={p.name} onChange={(v) => updateProj(p.id, { name: v })} placeholder="StudentOS" />
                <Field label="Tech Stack" value={p.tech} onChange={(v) => updateProj(p.id, { tech: v })} placeholder="React, Supabase, TypeScript" />
              </div>
              <Field label="Link" value={p.link} onChange={(v) => updateProj(p.id, { link: v })} placeholder="github.com/janedoe/studentos" />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={p.description}
                  onChange={(ev) => updateProj(p.id, { description: ev.target.value })}
                  rows={2}
                  placeholder="What does it do?"
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>
            </div>
          ))}
        </Section>

        {/* CTA to portfolio */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Done editing? Visit the </span>
          <a href="/career/portfolio" className="text-brand-400 hover:text-brand-300 font-medium">Portfolio page</a>
          <span> to see your live preview.</span>
        </div>
      </div>
    </div>
  );
}

/* ============ Shared form components ============ */

function Section({
  icon, title, onAdd, addLabel, children,
}: {
  icon: React.ReactNode;
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">{icon}</div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
            <Plus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
      />
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 text-center py-4">{text}</p>;
}

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];

function BoardSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
      >
        <option value="">Select board</option>
        {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  );
}
