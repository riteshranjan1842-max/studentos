import { useEffect, useState } from 'react';
import {
  Loader2, Mail, Phone, MapPin, Linkedin, Github, Globe,
  GraduationCap, Briefcase, Code2, FolderGit2, Palette, FileText, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ResumeData } from '../lib/types';

type Theme = 'modern-dark' | 'minimal-stark' | 'professional-tech';

const THEMES: { id: Theme; label: string; desc: string }[] = [
  { id: 'modern-dark', label: 'Modern Dark', desc: 'Sleek dark with gradient accents' },
  { id: 'minimal-stark', label: 'Minimal Stark', desc: 'Clean white, typography-first' },
  { id: 'professional-tech', label: 'Professional Tech', desc: 'Navy + teal, structured' },
];

export default function PortfolioGenerator() {
  const { user } = useAuth();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('modern-dark');

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('resumes')
        .select('id, user_id, full_name, email, phone, location, linkedin, github, website, summary, education, experience, skills, projects, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      setResume(data as ResumeData | null);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const hasData = resume && (
    resume.full_name || resume.email || (resume.experience?.length ?? 0) > 0 || (resume.projects?.length ?? 0) > 0
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Portfolio Preview</h1>
          <p className="text-sm text-slate-500 mt-1">Your resume data rendered as a live portfolio. Switch themes to find your look.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/career/resume"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 bg-ink-800 hover:bg-ink-700 px-3.5 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> Edit Resume
          </Link>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="flex items-center gap-2 mb-5">
        <Palette className="w-4 h-4 text-slate-500" />
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.desc}
            className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-colors ${
              theme === t.id
                ? 'bg-brand-600 text-white'
                : 'bg-ink-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview frame */}
      {!hasData ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-brand-400" />
          </div>
          <h3 className="text-base font-semibold text-white">No resume data yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Fill out the resume form first — your portfolio preview will render here automatically.
          </p>
          <Link
            to="/career/resume"
            className="inline-flex items-center gap-2 mt-5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> Build your resume
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-ink-700/50 shadow-2xl">
          {theme === 'modern-dark' && <ModernDark resume={resume!} />}
          {theme === 'minimal-stark' && <MinimalStark resume={resume!} />}
          {theme === 'professional-tech' && <ProfessionalTech resume={resume!} />}
        </div>
      )}
    </div>
  );
}

/* ============ Shared helpers ============ */

type PreviewProps = { resume: ResumeData };

function splitLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

/* ============ Theme 1: Modern Dark ============ */

function ModernDark({ resume }: PreviewProps) {
  const expLines = (desc: string) => splitLines(desc);
  return (
    <div className="bg-gradient-to-br from-slate-950 via-ink-900 to-slate-950 text-white">
      {/* Hero */}
      <div className="relative px-8 py-16 sm:px-12 sm:py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-400 text-sm font-medium tracking-widest uppercase mb-3">Portfolio</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">{resume.summary || 'Aspiring software engineer and CS student.'}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-400">
            {resume.email && <ContactLine icon={<Mail className="w-3.5 h-3.5" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3.5 h-3.5" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3.5 h-3.5" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3.5 h-3.5" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3.5 h-3.5" />} text={resume.linkedin} link={resume.linkedin} />}
          </div>
        </div>
      </div>

      <div className="px-8 sm:px-12 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Experience + Projects */}
        <div className="lg:col-span-2 space-y-8">
          {resume.experience && resume.experience.length > 0 && !resume.is_fresher && (
            <PreviewSection icon={<Briefcase className="w-4 h-4" />} title="Experience" accent="text-brand-400">
              <div className="space-y-5">
                {resume.experience.map((e) => (
                  <div key={e.id} className="border-l-2 border-brand-500/30 pl-4">
                    <div className="flex items-baseline justify-between flex-wrap gap-1">
                      <h3 className="font-semibold text-white">{e.role || 'Role'}</h3>
                      <span className="text-xs text-slate-500">{e.startDate} — {e.endDate || 'Present'}</span>
                    </div>
                    <p className="text-sm text-brand-400 mb-1.5">{e.company}</p>
                    {expLines(e.description).map((line, i) => (
                      <p key={i} className="text-sm text-slate-400 leading-relaxed">• {line}</p>
                    ))}
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {resume.projects && resume.projects.length > 0 && (
            <PreviewSection icon={<FolderGit2 className="w-4 h-4" />} title="Projects" accent="text-brand-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resume.projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">{p.name || 'Project'}</h3>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-2">{p.description}</p>
                    {p.tech && <p className="text-xs text-brand-400/70">{p.tech}</p>}
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}
        </div>

        {/* Right: Education + Skills */}
        <div className="space-y-8">
          {resume.education && resume.education.length > 0 && (
            <PreviewSection icon={<GraduationCap className="w-4 h-4" />} title="Education" accent="text-brand-400">
              <div className="space-y-4">
                {resume.education.map((e) => (
                  <div key={e.id}>
                    <h3 className="font-semibold text-white text-sm">{e.institution}</h3>
                    <p className="text-sm text-slate-400">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.startYear} — {e.endYear}{e.gpa ? ` · GPA ${e.gpa}` : ''}</p>
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <PreviewSection icon={<Code2 className="w-4 h-4" />} title="Skills" accent="text-brand-400">
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((s, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20">{s}</span>
                ))}
              </div>
            </PreviewSection>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Theme 2: Minimal Stark ============ */

function MinimalStark({ resume }: PreviewProps) {
  return (
    <div className="bg-white text-neutral-900">
      <div className="max-w-3xl mx-auto px-8 sm:px-12 py-16">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8 mb-10">
          <h1 className="text-5xl font-light tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-lg text-neutral-500 mt-3 font-light">{resume.summary || 'Aspiring software engineer and CS student.'}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-sm text-neutral-500">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.github && <a href={resume.github} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.github}</a>}
            {resume.linkedin && <a href={resume.linkedin} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.linkedin}</a>}
          </div>
        </div>

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && !resume.is_fresher && (
          <StarkSection title="Experience">
            <div className="space-y-6">
              {resume.experience.map((e) => (
                <div key={e.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="text-sm text-neutral-400 font-light">{e.startDate} — {e.endDate || 'Present'}</div>
                  <div className="sm:col-span-2">
                    <h3 className="font-medium text-neutral-900">{e.role} · <span className="text-neutral-500">{e.company}</span></h3>
                    {splitLines(e.description).map((line, i) => (
                      <p key={i} className="text-sm text-neutral-600 mt-1 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </StarkSection>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <StarkSection title="Projects">
            <div className="space-y-5">
              {resume.projects.map((p) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="text-sm text-neutral-400 font-light">{p.tech}</div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-neutral-900">{p.name}</h3>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </StarkSection>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <StarkSection title="Education">
            <div className="space-y-4">
              {resume.education.map((e) => (
                <div key={e.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="text-sm text-neutral-400 font-light">{e.startYear} — {e.endYear}</div>
                  <div className="sm:col-span-2">
                    <h3 className="font-medium text-neutral-900">{e.institution}</h3>
                    <p className="text-sm text-neutral-600">{e.degree}{e.field ? `, ${e.field}` : ''}{e.gpa ? ` · GPA ${e.gpa}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </StarkSection>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <StarkSection title="Skills">
            <p className="text-sm text-neutral-600 leading-relaxed">{resume.skills.join(' · ')}</p>
          </StarkSection>
        )}
      </div>
    </div>
  );
}

function StarkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-4">{title}</h2>
      {children}
    </section>
  );
}

/* ============ Theme 3: Professional Tech ============ */

function ProfessionalTech({ resume }: PreviewProps) {
  return (
    <div className="bg-slate-100 text-slate-800">
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-8 sm:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-teal-300 mt-1.5 text-sm font-medium">{resume.summary || 'Aspiring software engineer and CS student.'}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-300">
            {resume.email && <ContactLine icon={<Mail className="w-3 h-3" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3 h-3" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3 h-3" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3 h-3" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3 h-3" />} text={resume.linkedin} link={resume.linkedin} />}
            {resume.website && <ContactLine icon={<Globe className="w-3 h-3" />} text={resume.website} link={resume.website} />}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 sm:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-8">
          {resume.experience && resume.experience.length > 0 && !resume.is_fresher && (
            <TechSection title="Experience" icon={<Briefcase className="w-4 h-4" />}>
              <div className="space-y-5">
                {resume.experience.map((e) => (
                  <div key={e.id} className="border-l-2 border-teal-500 pl-4">
                    <h3 className="font-semibold text-slate-900">{e.role || 'Role'}</h3>
                    <p className="text-sm text-teal-600 font-medium">{e.company} · {e.startDate} — {e.endDate || 'Present'}</p>
                    {splitLines(e.description).map((line, i) => (
                      <p key={i} className="text-sm text-slate-600 mt-1 leading-relaxed">• {line}</p>
                    ))}
                  </div>
                ))}
              </div>
            </TechSection>
          )}

          {resume.projects && resume.projects.length > 0 && (
            <TechSection title="Projects" icon={<FolderGit2 className="w-4 h-4" />}>
              <div className="space-y-4">
                {resume.projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{p.name || 'Project'}</h3>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-500"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{p.description}</p>
                    {p.tech && <p className="text-xs text-teal-600 font-medium mt-2">{p.tech}</p>}
                  </div>
                ))}
              </div>
            </TechSection>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {resume.education && resume.education.length > 0 && (
            <TechSection title="Education" icon={<GraduationCap className="w-4 h-4" />}>
              <div className="space-y-3">
                {resume.education.map((e) => (
                  <div key={e.id}>
                    <h3 className="font-semibold text-slate-900 text-sm">{e.institution}</h3>
                    <p className="text-sm text-slate-600">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                    <p className="text-xs text-slate-500">{e.startYear} — {e.endYear}{e.gpa ? ` · GPA ${e.gpa}` : ''}</p>
                  </div>
                ))}
              </div>
            </TechSection>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <TechSection title="Skills" icon={<Code2 className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((s, i) => (
                  <span key={i} className="text-xs font-medium px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200">{s}</span>
                ))}
              </div>
            </TechSection>
          )}
        </div>
      </div>
    </div>
  );
}

function TechSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded bg-slate-900 text-teal-300 flex items-center justify-center">{icon}</div>
        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ============ Shared small components ============ */

function ContactLine({ icon, text, link }: { icon: React.ReactNode; text: string; link?: string }) {
  const content = (
    <span className="flex items-center gap-1.5">
      {icon}
      <span>{text}</span>
    </span>
  );
  if (link) {
    const href = link.startsWith('http') ? link : `https://${link}`;
    return <a href={href} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">{content}</a>;
  }
  return content;
}

function PreviewSection({
  icon, title, accent, children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className={`${accent}`}>{icon}</div>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
