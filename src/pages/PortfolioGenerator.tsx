import { useEffect, useState } from 'react';
import {
  Loader2, Mail, Phone, MapPin, Linkedin, Github,
  GraduationCap, Briefcase, Code2, FolderGit2, Palette, FileText, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ResumeData, EducationItem, ExperienceItem, ProjectItem, CustomSection } from '../lib/types';

type Theme = 'modern-dark' | 'minimal-stark' | 'professional-tech' | 'academic-serif';

const THEMES: { id: Theme; label: string; desc: string }[] = [
  { id: 'modern-dark', label: 'Modern Dark', desc: 'Sleek dark with gradient accents' },
  { id: 'minimal-stark', label: 'Minimal Stark', desc: 'Clean white, typography-first' },
  { id: 'professional-tech', label: 'Professional Tech', desc: 'Navy + teal, structured' },
  { id: 'academic-serif', label: 'Academic Serif', desc: 'Classic monochrome LaTeX style (Corporate Standard)' },
];

function convertToSections(r: any): CustomSection[] {
  const list: CustomSection[] = [];
  if (r.education && r.education.length > 0) {
    list.push({ id: 'edu', title: 'Education', type: 'education', items: r.education });
  }
  if (r.experience && r.experience.length > 0) {
    list.push({ id: 'exp', title: 'Experience', type: 'experience', items: r.experience });
  }
  if (r.projects && r.projects.length > 0) {
    list.push({ id: 'proj', title: 'Projects', type: 'projects', items: r.projects });
  }
  if (r.skills && r.skills.length > 0) {
    list.push({ id: 'skills', title: 'Technical Skills', type: 'skills', items: r.skills });
  }
  if (r.certifications && r.certifications.length > 0) {
    list.push({ id: 'certs', title: 'Certifications', type: 'bullet-list', items: r.certifications });
  }
  if (r.achievements && r.achievements.length > 0) {
    list.push({ id: 'ach', title: 'Achievements', type: 'bullet-list', items: r.achievements });
  }
  return list;
}

export default function PortfolioGenerator() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('modern-dark');

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('resumes')
        .select('id, user_id, title, full_name, email, phone, location, linkedin, github, website, summary, education, experience, skills, projects, tenth_marks, tenth_year, tenth_board, tenth_school, tenth_city, twelfth_marks, twelfth_year, twelfth_board, twelfth_school, twelfth_city, is_fresher, certifications, achievements, sections, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (data && data.length > 0) {
        const formatted = data.map(r => ({
          ...r,
          sections: r.sections ?? convertToSections(r)
        })) as ResumeData[];
        setResumes(formatted);
        setActiveId(formatted[0].id);
        setResume(formatted[0]);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    const active = resumes.find(r => r.id === activeId);
    if (active) {
      setResume({
        ...active,
        sections: active.sections ?? convertToSections(active)
      });
    }
  }, [activeId, resumes]);

  function exportPortfolioToPDF() {
    if (!resume) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export as PDF.");
      return;
    }

    const previewContainer = document.querySelector('.portfolio-preview-container');
    if (!previewContainer) {
      alert("Preview container not found.");
      return;
    }

    const htmlContent = previewContainer.innerHTML;
    const bodyClass = theme === 'modern-dark' ? 'bg-slate-950 text-white' : 
                      (theme === 'minimal-stark' || theme === 'academic-serif') ? 'bg-white text-neutral-900' : 
                      'bg-slate-50 text-slate-900';

    printWindow.document.write(`
      <html>
        <head>
          <title>${resume.full_name || 'Resume'}_Portfolio</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    brand: {
                      50: '#f5f8ff',
                      100: '#ebf1ff',
                      200: '#dce7ff',
                      300: '#c3d5ff',
                      400: '#9db8ff',
                      500: '#5d9dff',
                      600: '#3b76f6',
                      700: '#2b5ddc',
                      800: '#254eb2',
                      900: '#23438e',
                      950: '#152454',
                    },
                    ink: {
                      700: '#334155',
                      800: '#1e293b',
                      850: '#182232',
                      900: '#0f172a',
                      950: '#020617',
                    }
                  }
                }
              }
            }
          </script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');
            body {
              font-family: 'Outfit', 'Inter', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-variant-numeric: lining-nums !important;
              font-feature-settings: "lnum" 1 !important;
            }
            @media print {
              body {
                background-color: ${theme === 'modern-dark' ? '#020617' : theme === 'minimal-stark' ? '#ffffff' : '#f8fafc'} !important;
                color: ${theme === 'modern-dark' ? '#ffffff' : '#111827'} !important;
              }
              @page {
                size: A4;
                margin: 0.6cm !important;
              }
              html, body {
                font-size: 10px !important;
                line-height: 1.15 !important;
              }
              /* Compress spacings specifically for printing to ensure 1-page fit */
              section, div, p, li, h1, h2, h3, h4, hr {
                margin-top: 0.15rem !important;
                margin-bottom: 0.15rem !important;
                padding-top: 0.15rem !important;
                padding-bottom: 0.15rem !important;
              }
              .space-y-4 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.25rem !important;
              }
              .space-y-6 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.35rem !important;
              }
              .space-y-8 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.4rem !important;
              }
              .py-8 {
                padding-top: 0.3rem !important;
                padding-bottom: 0.3rem !important;
              }
              .py-10 {
                padding-top: 0.5rem !important;
                padding-bottom: 0.5rem !important;
              }
              .px-6 {
                padding-left: 0.3rem !important;
                padding-right: 0.3rem !important;
              }
              .px-8 {
                padding-left: 0.4rem !important;
                padding-right: 0.4rem !important;
              }
              .p-8 {
                padding: 0.4rem !important;
              }
              .p-4 {
                padding: 0.2rem !important;
              }
              .pb-6 {
                padding-bottom: 0.2rem !important;
              }
              .mb-6 {
                margin-bottom: 0.2rem !important;
              }
              .mt-6 {
                margin-top: 0.2rem !important;
              }
              .pt-5 {
                padding-top: 0.2rem !important;
              }
              .pb-2.5 {
                padding-bottom: 0.1rem !important;
              }
              .pb-2 {
                padding-bottom: 0.1rem !important;
              }
              .pb-10 {
                padding-bottom: 0.4rem !important;
              }
              .my-1.5 {
                margin-top: 0.1rem !important;
                margin-bottom: 0.1rem !important;
              }
            }
          </style>
        </head>
        <body class="${bodyClass} p-8">
          <div class="max-w-4xl mx-auto">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

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
          {resumes.length > 1 && (
            <select
              value={activeId || ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-medium h-9"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || 'Untitled Resume'}
                </option>
              ))}
            </select>
          )}
          {hasData && (
            <button
              onClick={exportPortfolioToPDF}
              className="flex items-center gap-1.5 text-sm text-brand-300 hover:text-brand-200 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/20 px-3.5 py-2 rounded-lg transition-colors font-medium animate-fadeIn"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          )}
          <Link
            to="/career/resume"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 bg-ink-800 hover:bg-ink-700 px-3.5 py-2 rounded-lg transition-colors font-medium"
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
                : 'bg-ink-800 text-slate-440 hover:text-slate-200'
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
          <p className="text-sm text-slate-505 mt-1 max-w-sm mx-auto">
            Fill out the resume form first — your portfolio preview will render here automatically.
          </p>
          <Link
            to="/career/resume"
            className="inline-flex items-center gap-2 mt-5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors font-medium"
          >
            <FileText className="w-4 h-4" /> Build your resume
          </Link>
        </div>
      ) : (
        <div className="portfolio-preview-container rounded-2xl overflow-hidden border border-ink-700/50 shadow-2xl">
          {theme === 'modern-dark' && <ModernDark resume={resume!} />}
          {theme === 'minimal-stark' && <MinimalStark resume={resume!} />}
          {theme === 'professional-tech' && <ProfessionalTech resume={resume!} />}
          {theme === 'academic-serif' && <AcademicSerif resume={resume!} />}
        </div>
      )}
    </div>
  );
}

/* ============ Shared preview helpers ============ */

type PreviewProps = { resume: ResumeData };

function splitLines(text: any): string[] {
  if (!text) return [];
  if (Array.isArray(text)) {
    return text.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text.split('\n').map((l: string) => l.trim()).filter(Boolean);
}

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

/* ============ Theme 1: Modern Dark ============ */function ModernDark({ resume }: PreviewProps) {
  return (
    <div className="bg-gradient-to-br from-slate-950 via-ink-900 to-slate-950 text-white min-h-[500px]">
      {/* Hero */}
      <div className="relative px-6 py-10 overflow-hidden border-b border-ink-800/40">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-brand-400 text-[10px] font-bold tracking-widest uppercase mb-2">Portfolio</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-sm text-slate-455 mt-2 max-w-lg leading-relaxed">{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-slate-500">
            {resume.email && <ContactLine icon={<Mail className="w-3.5 h-3.5 text-brand-400" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3.5 h-3.5 text-brand-400" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3.5 h-3.5 text-brand-400" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3.5 h-3.5 text-brand-400" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3.5 h-3.5 text-brand-400" />} text={resume.linkedin} link={resume.linkedin} />}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8 max-w-3xl mx-auto">
        {resume.sections?.map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <PreviewSection key={section.id} icon={<GraduationCap className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">University / College</p>
                    {section.items.map((e: EducationItem) => (
                      <div key={e.id} className="flex justify-between items-start border-l border-brand-500/20 pl-3">
                        <div>
                          <h3 className="font-bold text-white text-xs">{e.institution || 'University Name'}</h3>
                          <p className="text-[11px] text-slate-400">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                          <p className="text-[10px] text-slate-505 mt-0.5">
                            {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                          </p>
                        </div>
                        {e.gpa && (
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs font-extrabold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20 inline-block shadow-sm">
                              {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {section.title.toLowerCase().includes('education') && (resume.tenth_marks || resume.twelfth_marks) && (
                    <div className="space-y-3.5">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Schooling</p>
                      {resume.twelfth_marks && (
                        <div className="flex justify-between items-start border-l border-brand-500/20 pl-3 animate-fadeIn">
                          <div>
                            <h4 className="font-bold text-white text-xs">12th Class (Higher Secondary)</h4>
                            <p className="text-[11px] text-slate-400 leading-normal">{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                            {resume.twelfth_board && <p className="text-[10px] text-slate-500 mt-0.5">Board: {resume.twelfth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs text-brand-300 font-bold">{resume.twelfth_marks}%</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{resume.twelfth_year}</p>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className="flex justify-between items-start border-l border-brand-500/20 pl-3 animate-fadeIn">
                          <div>
                            <h4 className="font-bold text-white text-xs">10th Class (Secondary)</h4>
                            <p className="text-[11px] text-slate-400 leading-normal">{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                            {resume.tenth_board && <p className="text-[10px] text-slate-500 mt-0.5">Board: {resume.tenth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs text-brand-300 font-bold">{resume.tenth_marks}%</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{resume.tenth_year}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PreviewSection>
            );
          }

          if (section.type === 'experience') {
            return (
              <PreviewSection key={section.id} icon={<Briefcase className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <div className="space-y-6">
                  {section.items.map((e: ExperienceItem) => (
                    <div key={e.id} className="relative border-l border-brand-500/20 pl-4 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h3 className="font-bold text-white text-sm">{e.role || 'Role'}</h3>
                          <p className="text-xs text-slate-350 font-medium">{e.company}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {e.startDate} — {e.endDate || 'Present'}
                        </span>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs leading-relaxed font-normal">
                        {splitLines(e.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (section.type === 'projects') {
            return (
              <PreviewSection key={section.id} icon={<FolderGit2 className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {section.items.map((p: ProjectItem) => (
                    <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-500/20 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-bold text-white text-xs">{p.name || 'Project'}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.github_link && (
                            <a href={p.github_link.startsWith('http') ? p.github_link : `https://${p.github_link}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(p.live_link || p.link) && (
                            <a href={(p.live_link || p.link)!.startsWith('http') ? (p.live_link || p.link) : `https://${p.live_link || p.link}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      {p.tech && <p className="text-[10px] text-brand-400 mb-2 font-medium">{p.tech}</p>}
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                        {splitLines(p.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (section.type === 'skills') {
            return (
              <PreviewSection key={section.id} icon={<Code2 className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <div className="flex flex-wrap gap-2">
                  {section.items.map((s: string, idx: number) => (
                    <span key={idx} className="text-xs font-semibold px-3 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20">{s}</span>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <PreviewSection key={section.id} icon={<FileText className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs leading-relaxed">
                  {section.items.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </PreviewSection>
            );
          }

          if (section.type === 'text') {
            return (
              <PreviewSection key={section.id} icon={<FileText className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <p className="text-xs text-slate-400 leading-relaxed">{section.items[0]}</p>
              </PreviewSection>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

/* ============ Theme 2: Minimal Stark ============ */

function MinimalStark({ resume }: PreviewProps) {
  return (
    <div className="bg-white text-neutral-900 min-h-[500px]">
      <div className="px-6 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 mb-6">
          <h1 className="text-3xl font-light tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-sm text-neutral-505 mt-2 font-light leading-relaxed">{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-neutral-400 font-light">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.github && <a href={`https://${resume.github}`} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.github}</a>}
            {resume.linkedin && <a href={`https://${resume.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.linkedin}</a>}
          </div>
        </div>

        {resume.sections?.map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <div className="space-y-3.5">
                  {section.items.map((e: EducationItem) => (
                    <div key={e.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2.5">
                      <div className="text-[11px] text-neutral-400 font-light">
                        {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                      </div>
                      <div className="sm:col-span-3 flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-semibold text-neutral-900">{e.institution || 'University Name'}</h3>
                          <p className="text-xs text-neutral-600">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                        </div>
                        {e.gpa && (
                          <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded shrink-0 ml-4">
                            {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {section.title.toLowerCase().includes('education') && (resume.twelfth_marks || resume.tenth_marks) && (
                    <>
                      {resume.twelfth_marks && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2">
                          <div className="text-[11px] text-neutral-400 font-light">{resume.twelfth_year}</div>
                          <div className="sm:col-span-3 flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-semibold text-neutral-900">12th Class (Higher Secondary)</h3>
                              <p className="text-xs text-neutral-505 mt-0.5">{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                              {resume.twelfth_board && <p className="text-[11px] text-neutral-400">Board: {resume.twelfth_board}</p>}
                            </div>
                            <span className="text-xs font-bold text-neutral-800 shrink-0 ml-4">{resume.twelfth_marks}%</span>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2">
                          <div className="text-[11px] text-neutral-400 font-light">{resume.tenth_year}</div>
                          <div className="sm:col-span-3 flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-semibold text-neutral-900">10th Class (Secondary)</h3>
                              <p className="text-xs text-neutral-505 mt-0.5">{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                              {resume.tenth_board && <p className="text-[11px] text-neutral-400">Board: {resume.tenth_board}</p>}
                            </div>
                            <span className="text-xs font-bold text-neutral-800 shrink-0 ml-4">{resume.tenth_marks}%</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </StarkSection>
            );
          }

          if (section.type === 'experience') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <div className="space-y-6">
                  {section.items.map((e: ExperienceItem) => (
                    <div key={e.id} className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                      <div className="text-[11px] text-neutral-400 font-light">{e.startDate} — {e.endDate || 'Present'}</div>
                      <div className="sm:col-span-3">
                        <h3 className="text-xs font-semibold text-neutral-900">{e.role} · <span className="text-neutral-500 font-normal">{e.company}</span></h3>
                        <ul className="list-disc pl-4 space-y-1 text-neutral-605 text-xs mt-1">
                          {splitLines(e.description).map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </StarkSection>
            );
          }

          if (section.type === 'projects') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <div className="space-y-4">
                  {section.items.map((p: ProjectItem) => (
                    <div key={p.id} className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                      <div className="text-[11px] text-neutral-400 font-light truncate">{p.tech}</div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-neutral-900">{p.name}</h3>
                          <div className="flex items-center gap-2">
                            {p.github_link && (
                              <a href={p.github_link.startsWith('http') ? p.github_link : `https://${p.github_link}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {(p.live_link || p.link) && (
                              <a href={(p.live_link || p.link)!.startsWith('http') ? (p.live_link || p.link) : `https://${p.live_link || p.link}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </StarkSection>
            );
          }

          if (section.type === 'skills') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <div className="space-y-1">
                  {section.items.map((s: string, idx: number) => (
                    <p key={idx} className="text-xs text-neutral-605">{s}</p>
                  ))}
                </div>
              </StarkSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 text-xs">
                  {section.items.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </StarkSection>
            );
          }

          if (section.type === 'text') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <p className="text-xs text-neutral-600 leading-relaxed">{section.items[0]}</p>
              </StarkSection>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function StarkSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 border-t border-neutral-100 pt-5">
      <h2 className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

/* ============ Theme 3: Professional Tech ============ */

function ProfessionalTech({ resume }: PreviewProps) {
  return (
    <div className="bg-slate-100 text-slate-800 min-h-[500px]">
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className="text-teal-300 mt-1 text-xs font-medium uppercase tracking-wider">{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3.5 text-[11px] text-slate-300">
            {resume.email && <ContactLine icon={<Mail className="w-3.5 h-3.5 text-teal-400" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3.5 h-3.5 text-teal-400" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3.5 h-3.5 text-teal-400" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3.5 h-3.5 text-teal-400" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3.5 h-3.5 text-teal-400" />} text={resume.linkedin} link={resume.linkedin} />}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8 animate-fadeIn">
        {resume.sections?.map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <TechSection key={section.id} title={section.title} icon={<GraduationCap className="w-3.5 h-3.5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-teal-655 uppercase tracking-wide">University / College</p>
                    {section.items.map((e: EducationItem) => (
                      <div key={e.id} className="flex justify-between items-start border-l border-teal-500 pl-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">{e.institution || 'University Name'}</h3>
                          <p className="text-xs text-slate-655 font-medium">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                          <p className="text-[10px] text-slate-505 mt-0.5">
                            {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                          </p>
                        </div>
                        {e.gpa && (
                          <div className="text-right shrink-0 ml-4 animate-fadeIn">
                            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shadow-sm inline-block">
                              {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {section.title.toLowerCase().includes('education') && (resume.tenth_marks || resume.twelfth_marks) && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-teal-655 uppercase tracking-wide">Schooling</p>
                      {resume.twelfth_marks && (
                        <div className="flex justify-between items-start border-l border-teal-500 pl-3 animate-fadeIn">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">12th Class (Higher Secondary)</h4>
                            <p className="text-xs text-slate-600 leading-normal">{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                            {resume.twelfth_board && <p className="text-[10px] text-slate-450 mt-0.5">Board: {resume.twelfth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs text-teal-600 font-bold">{resume.twelfth_marks}%</span>
                            <p className="text-[10px] text-slate-505 mt-0.5">{resume.twelfth_year}</p>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className="flex justify-between items-start border-l border-teal-500 pl-3 animate-fadeIn">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">10th Class (Secondary)</h4>
                            <p className="text-xs text-slate-600 leading-normal">{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                            {resume.tenth_board && <p className="text-[10px] text-slate-455 mt-0.5">Board: {resume.tenth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs text-teal-600 font-bold">{resume.tenth_marks}%</span>
                            <p className="text-[10px] text-slate-505 mt-0.5">{resume.tenth_year}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TechSection>
            );
          }

          if (section.type === 'experience') {
            return (
              <TechSection key={section.id} title={section.title} icon={<Briefcase className="w-3.5 h-3.5" />}>
                <div className="space-y-4">
                  {section.items.map((e: ExperienceItem) => (
                    <div key={e.id} className="border-l-2 border-teal-500 pl-3">
                      <h3 className="font-semibold text-slate-900 text-xs">{e.role || 'Role'}</h3>
                      <p className="text-[11px] text-teal-650 font-semibold">{e.company} · {e.startDate} — {e.endDate || 'Present'}</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 text-xs mt-1">
                        {splitLines(e.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TechSection>
            );
          }

          if (section.type === 'projects') {
            return (
              <TechSection key={section.id} title={section.title} icon={<FolderGit2 className="w-3.5 h-3.5" />}>
                <div className="space-y-3.5">
                  {section.items.map((p: ProjectItem) => (
                    <div key={p.id} className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs">{p.name || 'Project'}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.github_link && (
                            <a href={p.github_link.startsWith('http') ? p.github_link : `https://${p.github_link}`} target="_blank" rel="noreferrer" className="text-slate-455 hover:text-slate-800 transition-colors">
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {(p.live_link || p.link) && (
                            <a href={(p.live_link || p.link)!.startsWith('http') ? (p.live_link || p.link) : `https://${p.live_link || p.link}`} target="_blank" rel="noreferrer" className="text-teal-655 hover:text-teal-555 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      {p.tech && <p className="text-[10px] text-teal-600 font-bold mt-2 uppercase tracking-wide">{p.tech}</p>}
                      <ul className="list-disc pl-4 space-y-1 text-slate-605 text-xs mt-1.5 leading-relaxed font-normal">
                        {splitLines(p.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TechSection>
            );
          }

          if (section.type === 'skills') {
            return (
              <TechSection key={section.id} title={section.title} icon={<Code2 className="w-3.5 h-3.5" />}>
                <div className="flex flex-wrap gap-1.5">
                  {section.items.map((s: string, i: number) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-teal-50 text-teal-705 border border-teal-200">{s}</span>
                  ))}
                </div>
              </TechSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <TechSection key={section.id} title={section.title} icon={<FileText className="w-3.5 h-3.5" />}>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs leading-relaxed">
                  {section.items.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </TechSection>
            );
          }

          if (section.type === 'text') {
            return (
              <TechSection key={section.id} title={section.title} icon={<FileText className="w-3.5 h-3.5" />}>
                <p className="text-xs text-slate-600 leading-relaxed">{section.items[0]}</p>
              </TechSection>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function TechSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-6.5 h-6.5 rounded bg-slate-900 text-teal-300 flex items-center justify-center p-1.5 shrink-0">{icon}</div>
        <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AcademicSerif({ resume }: PreviewProps) {
  return (
    <div className="bg-white text-black min-h-[500px] font-serif p-8 md:p-12 leading-relaxed" style={{ fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Centered Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-wide text-black uppercase">{resume.full_name || 'Your Name'}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-black/80 font-normal">
            {resume.location && <span>{resume.location}</span>}
            {resume.email && (
              <>
                <span className="text-slate-400">|</span>
                <a href={`mailto:${resume.email}`} className="hover:underline">{resume.email}</a>
              </>
            )}
            {resume.phone && (
              <>
                <span className="text-slate-400">|</span>
                <span>{resume.phone}</span>
              </>
            )}
            {resume.github && (
              <>
                <span className="text-slate-400">|</span>
                <a href={resume.github.startsWith('http') ? resume.github : `https://${resume.github}`} target="_blank" rel="noreferrer" className="hover:underline">
                  {resume.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                </a>
              </>
            )}
            {resume.linkedin && (
              <>
                <span className="text-slate-400">|</span>
                <a href={resume.linkedin.startsWith('http') ? resume.linkedin : `https://${resume.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">
                  {resume.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                </a>
              </>
            )}
            {resume.website && (
              <>
                <span className="text-slate-400">|</span>
                <a href={resume.website.startsWith('http') ? resume.website : `https://${resume.website}`} target="_blank" rel="noreferrer" className="hover:underline">{resume.website}</a>
              </>
            )}
          </div>
        </div>

        {/* Summary Section */}
        {resume.summary && (
          <div>
            <h2 className="text-sm font-bold tracking-wider text-black uppercase">Summary</h2>
            <hr className="border-t border-black/80 my-1.5" />
            <p className="text-xs text-black/90 leading-relaxed font-serif">{resume.summary}</p>
          </div>
        )}

        {/* Dynamic Sections */}
        {resume.sections && resume.sections.map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <div className="space-y-4">
                  {section.items.map((e: EducationItem) => {
                    const datesStr = e.is_current ? `${e.startYear || 'N/A'} — Present` : `${e.startYear || 'N/A'} — ${e.endYear || 'N/A'}`;
                    return (
                      <div key={e.id} className="text-xs">
                        <div className="flex justify-between items-start font-bold text-black">
                          <h3>{e.institution || 'University/College Name'}</h3>
                          <span>{datesStr}</span>
                        </div>
                        <div className="flex justify-between items-start text-[11px] text-black/90 italic mt-0.5">
                          <p>{e.degree}{e.field ? ` — ${e.field}` : ''}</p>
                          {e.gpa && <span className="font-bold not-italic">GPA: {e.gpa}</span>}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Class 12th & 10th Details if it is the primary Education section */}
                  {section.title.toLowerCase().includes('education') && (
                    <>
                      {resume.twelfth_marks && (
                        <div className="text-[11px] font-serif text-black/90 mt-2.5 pt-2 border-t border-dashed border-black/15">
                          <div className="flex justify-between items-start font-bold text-black text-[11px]">
                            <h4>Class XII: {resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''} ({resume.twelfth_board || 'CBSE'})</h4>
                            <span>{resume.twelfth_year}</span>
                          </div>
                          <div className="flex justify-between items-start text-[10px] text-black/85 italic mt-0.5">
                            <p>Higher Secondary Education</p>
                            <span className="font-bold not-italic">Marks: {resume.twelfth_marks}%</span>
                          </div>
                        </div>
                      )}
                      
                      {resume.tenth_marks && (
                        <div className="text-[11px] font-serif text-black/90 mt-2">
                          <div className="flex justify-between items-start font-bold text-black text-[11px]">
                            <h4>Class X: {resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''} ({resume.tenth_board || 'CBSE'})</h4>
                            <span>{resume.tenth_year}</span>
                          </div>
                          <div className="flex justify-between items-start text-[10px] text-black/85 italic mt-0.5">
                            <p>Secondary Education</p>
                            <span className="font-bold not-italic">Marks: {resume.tenth_marks}%</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          }

          if (section.type === 'experience') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <div className="space-y-4">
                  {section.items.map((e: ExperienceItem) => (
                    <div key={e.id} className="text-xs">
                      <div className="flex justify-between items-start font-bold text-black">
                        <div>
                          <h3 className="font-bold text-black">{e.role || 'Role'}</h3>
                          <p className="italic text-black/80">{e.company}</p>
                        </div>
                        <p className="font-medium text-black/85">
                          {e.startDate} — {e.endDate || 'Present'}
                        </p>
                      </div>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px]">
                        {splitLines(e.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === 'projects') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <div className="space-y-4">
                  {section.items.map((p: ProjectItem) => (
                    <div key={p.id} className="text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-bold text-black text-xs truncate">{p.name || 'Project'}</h3>
                          {p.tech && <span className="text-[10px] font-normal text-black/70 truncate">| {p.tech}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-4">
                          {p.github_link && (
                            <a href={p.github_link.startsWith('http') ? p.github_link : `https://${p.github_link}`} target="_blank" rel="noreferrer" className="text-black/60 hover:text-black transition-colors">
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(p.live_link || p.link) && (
                            <a href={(p.live_link || p.link)!.startsWith('http') ? (p.live_link || p.link) : `https://${p.live_link || p.link}`} target="_blank" rel="noreferrer" className="text-black/60 hover:text-black transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px]">
                        {splitLines(p.description).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (section.type === 'skills') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <div className="text-xs space-y-1 font-serif">
                  {section.items.map((s: string, idx: number) => {
                    const colonIdx = s.indexOf(':');
                    if (colonIdx > -1) {
                      const heading = s.substring(0, colonIdx).trim();
                      const details = s.substring(colonIdx + 1).trim();
                      return (
                        <p key={idx} className="text-black/90 leading-relaxed text-[11px]">
                          <span className="font-bold">{heading}:</span> {details}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-black/90 leading-relaxed text-[11px]">
                        {s}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <ul className="list-disc pl-5 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px]">
                  {section.items.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            );
          }

          if (section.type === 'text') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <p className="text-xs text-black/90 leading-relaxed font-serif">{section.items[0]}</p>
              </div>
            );
          }

          return null;
        })}

      </div>
    </div>
  );
}
