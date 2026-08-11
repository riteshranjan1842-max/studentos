import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Check, User, GraduationCap,
  Briefcase, Code2, FolderGit2, Palette, FileText, ExternalLink, Mail, Phone, MapPin, Github, Linkedin, Save, Upload, Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ResumeData, EducationItem, ExperienceItem, ProjectItem, CustomSection } from '../lib/types';

type Theme = 'modern-dark' | 'minimal-stark' | 'professional-tech' | 'academic-serif';

const EMPTY_RESUME = {
  id: '',
  title: 'My Resume',
  selected_theme: 'modern-dark' as Theme,
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
  tenth_school: '',
  tenth_city: '',
  twelfth_marks: '',
  twelfth_year: '',
  twelfth_board: '',
  twelfth_school: '',
  twelfth_city: '',
  education: [] as EducationItem[],
  experience: [] as ExperienceItem[],
  skills: [] as string[],
  projects: [] as ProjectItem[],
  certifications: [] as string[],
  achievements: [] as string[],
  sections: [] as CustomSection[],
  body_font_size: '12px',
  layout_version: 'classic',
};

type ResumeState = typeof EMPTY_RESUME;

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

function normalizeResumeData(raw: any): ResumeState {
  if (!raw) return { ...EMPTY_RESUME };

  const safeString = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join('\n');
    if (typeof val === 'object') return val.text || JSON.stringify(val);
    return String(val);
  };

  const safeBoolean = (val: any, fallback = false): boolean => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === 1 || val === '1';
  };

  const safeStringArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => safeString(item)).filter(Boolean);
    }
    if (typeof val === 'string') {
      return val.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
  };

  const safeEducation = (items: any[] | null | undefined): EducationItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      id: safeString(item.id, Math.random().toString(36).slice(2, 10)),
      institution: safeString(item.institution),
      degree: safeString(item.degree),
      field: safeString(item.field),
      startYear: safeString(item.startYear),
      endYear: safeString(item.endYear),
      gpa: safeString(item.gpa),
      is_current: safeBoolean(item.is_current),
      current_year_sem: safeString(item.current_year_sem),
    }));
  };

  const safeExperience = (items: any[] | null | undefined): ExperienceItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      id: safeString(item.id, Math.random().toString(36).slice(2, 10)),
      company: safeString(item.company),
      role: safeString(item.role),
      startDate: safeString(item.startDate),
      endDate: safeString(item.endDate),
      description: safeString(item.description),
    }));
  };

  const safeProjects = (items: any[] | null | undefined): ProjectItem[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      id: safeString(item.id, Math.random().toString(36).slice(2, 10)),
      name: safeString(item.name),
      description: safeString(item.description),
      link: safeString(item.link || item.live_link),
      github_link: safeString(item.github_link),
      live_link: safeString(item.live_link || item.link),
      tech: safeString(item.tech),
    }));
  };

  const safeSections = (sections: any[] | null | undefined): CustomSection[] => {
    if (!sections || !Array.isArray(sections)) return [];
    return sections.map(sec => {
      let safeItems: any[] = [];
      if (sec.type === 'education') safeItems = safeEducation(sec.items);
      else if (sec.type === 'experience') safeItems = safeExperience(sec.items);
      else if (sec.type === 'projects') safeItems = safeProjects(sec.items);
      else if (sec.type === 'skills' || sec.type === 'bullet-list' || sec.type === 'text') {
        safeItems = safeStringArray(sec.items);
      }
      return {
        id: safeString(sec.id, Math.random().toString(36).slice(2, 10)),
        title: safeString(sec.title, 'Custom Section'),
        type: sec.type || 'text',
        items: safeItems
      };
    });
  };

  return {
    id: safeString(raw.id),
    title: safeString(raw.title, 'My Resume'),
    selected_theme: safeString(raw.selected_theme, 'modern-dark') as Theme,
    full_name: safeString(raw.full_name),
    email: safeString(raw.email),
    phone: safeString(raw.phone),
    location: safeString(raw.location),
    linkedin: safeString(raw.linkedin),
    github: safeString(raw.github),
    website: safeString(raw.website),
    summary: safeString(raw.summary),
    is_fresher: safeBoolean(raw.is_fresher),
    tenth_marks: safeString(raw.tenth_marks),
    tenth_year: safeString(raw.tenth_year),
    tenth_board: safeString(raw.tenth_board),
    tenth_school: safeString(raw.tenth_school),
    tenth_city: safeString(raw.tenth_city),
    twelfth_marks: safeString(raw.twelfth_marks),
    twelfth_year: safeString(raw.twelfth_year),
    twelfth_board: safeString(raw.twelfth_board),
    twelfth_school: safeString(raw.twelfth_school),
    twelfth_city: safeString(raw.twelfth_city),
    education: safeEducation(raw.education),
    experience: safeExperience(raw.experience),
    skills: safeStringArray(raw.skills),
    projects: safeProjects(raw.projects),
    certifications: safeStringArray(raw.certifications),
    achievements: safeStringArray(raw.achievements),
    sections: raw.sections && raw.sections.length > 0 ? safeSections(raw.sections) : safeSections(convertToSections(raw)),
    body_font_size: safeString(raw.body_font_size, '12px'),
    layout_version: safeString(raw.layout_version, 'classic'),
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeState>(EMPTY_RESUME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector('.portfolio-preview-container');
      if (el) {
        // A4 height threshold at 96 DPI is ~1122px.
        const height = el.scrollHeight;
        setIsOverflowing(height > 1122);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [resume]);

  // Load resumes list
  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('resumes')
        .select('id, user_id, title, selected_theme, body_font_size, layout_version, full_name, email, phone, location, linkedin, github, website, summary, education, experience, skills, projects, tenth_marks, tenth_year, tenth_board, tenth_school, tenth_city, twelfth_marks, twelfth_year, twelfth_board, twelfth_school, twelfth_city, is_fresher, certifications, achievements, sections, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        const normalized = data.map(r => normalizeResumeData(r) as any) as ResumeData[];
        setResumes(normalized);
        setActiveId(normalized[0].id);
      } else {
        // Create initial default resume
        const { data: newRow, error: insError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            title: 'My Resume',
            selected_theme: 'modern-dark',
            body_font_size: '12px',
            layout_version: 'classic',
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
            tenth_school: '',
            tenth_city: '',
            twelfth_marks: '',
            twelfth_year: '',
            twelfth_board: '',
            twelfth_school: '',
            twelfth_city: '',
            education: [],
            experience: [],
            skills: [],
            projects: [],
            certifications: [],
            achievements: [],
            sections: [
              { id: 'edu', title: 'Education', type: 'education', items: [] },
              { id: 'exp', title: 'Experience', type: 'experience', items: [] },
              { id: 'skills', title: 'Technical Skills', type: 'skills', items: [] },
              { id: 'proj', title: 'Projects', type: 'projects', items: [] },
              { id: 'certs', title: 'Certifications', type: 'bullet-list', items: [] },
              { id: 'ach', title: 'Achievements', type: 'bullet-list', items: [] }
            ]
          })
          .select()
          .single();

        if (newRow && !insError) {
          const normalizedRow = normalizeResumeData(newRow) as any as ResumeData;
          setResumes([normalizedRow]);
          setActiveId(normalizedRow.id);
        }
      }
      setLoading(false);
    }
    load();
  }, [user]);

  // When activeId changes, populate the resume form state
  useEffect(() => {
    if (!activeId) return;
    const active = resumes.find(r => r.id === activeId);
    if (active) {
      setResume(normalizeResumeData(active));
    }
  }, [activeId, resumes]);

  // Debounced save
  const save = useCallback(async (data: ResumeState, isManual = false) => {
    if (!user || !data.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('resumes')
      .upsert({
        id: data.id,
        user_id: user.id,
        title: data.title,
        selected_theme: data.selected_theme,
        body_font_size: data.body_font_size,
        layout_version: data.layout_version,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedin: data.linkedin,
        github: data.github,
        website: data.website,
        summary: data.summary,
        is_fresher: data.is_fresher,
        tenth_marks: data.tenth_marks,
        tenth_year: data.tenth_year,
        tenth_board: data.tenth_board,
        tenth_school: data.tenth_school,
        tenth_city: data.tenth_city,
        twelfth_marks: data.twelfth_marks,
        twelfth_year: data.twelfth_year,
        twelfth_board: data.twelfth_board,
        twelfth_school: data.twelfth_school,
        twelfth_city: data.twelfth_city,
        education: data.education,
        experience: data.experience,
        skills: data.skills,
        projects: data.projects,
        certifications: data.certifications,
        achievements: data.achievements,
        sections: data.sections,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setResumes(prev => prev.map(r => r.id === data.id ? { ...r, ...data } as ResumeData : r));
      if (isManual) {
        showToast("Resume saved successfully", "success");
      }
    } else {
      showToast("Failed to save resume: " + error.message, "error");
    }
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString());
  }, [user]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (loading || !resume.id || resume.id !== activeId) return;

    // Only auto-save if local state actually differs from the database state
    const activeSaved = resumes.find(r => r.id === activeId);
    if (activeSaved) {
      const savedNormalized = normalizeResumeData(activeSaved);
      if (JSON.stringify(savedNormalized) === JSON.stringify(resume)) {
        return;
      }
    }

    const t = setTimeout(() => save(resume, false), 2000);
    return () => clearTimeout(t);
  }, [resume, loading, save, activeId, resumes]);

  async function createNewResume() {
    if (!user) return;
    setSaving(true);

    // Save the current active resume first before opening/creating another
    if (resume.id) {
      const normalizedCurrent = normalizeResumeData(resume);
      const { error: saveError } = await supabase
        .from('resumes')
        .upsert({
          id: normalizedCurrent.id,
          user_id: user.id,
          title: normalizedCurrent.title,
          selected_theme: normalizedCurrent.selected_theme,
          body_font_size: normalizedCurrent.body_font_size,
          layout_version: normalizedCurrent.layout_version,
          full_name: normalizedCurrent.full_name,
          email: normalizedCurrent.email,
          phone: normalizedCurrent.phone,
          location: normalizedCurrent.location,
          linkedin: normalizedCurrent.linkedin,
          github: normalizedCurrent.github,
          website: normalizedCurrent.website,
          summary: normalizedCurrent.summary,
          is_fresher: normalizedCurrent.is_fresher,
          tenth_marks: normalizedCurrent.tenth_marks,
          tenth_year: normalizedCurrent.tenth_year,
          tenth_board: normalizedCurrent.tenth_board,
          tenth_school: normalizedCurrent.tenth_school,
          tenth_city: normalizedCurrent.tenth_city,
          twelfth_marks: normalizedCurrent.twelfth_marks,
          twelfth_year: normalizedCurrent.twelfth_year,
          twelfth_board: normalizedCurrent.twelfth_board,
          twelfth_school: normalizedCurrent.twelfth_school,
          twelfth_city: normalizedCurrent.twelfth_city,
          education: normalizedCurrent.education,
          experience: normalizedCurrent.experience,
          skills: normalizedCurrent.skills,
          projects: normalizedCurrent.projects,
          certifications: normalizedCurrent.certifications,
          achievements: normalizedCurrent.achievements,
          sections: normalizedCurrent.sections,
          updated_at: new Date().toISOString(),
        });
      
      if (!saveError) {
        // Update local resumes list with current resume state
        setResumes(prev => prev.map(r => r.id === normalizedCurrent.id ? (normalizedCurrent as any as ResumeData) : r));
      }
    }

    // Now insert a new, clean default resume starting from a completely blank template
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: `Resume #${resumes.length + 1}`,
        selected_theme: 'modern-dark',
        body_font_size: '12px',
        layout_version: 'classic',
        full_name: '',
        email: user.email || '',
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
        tenth_school: '',
        tenth_city: '',
        twelfth_marks: '',
        twelfth_year: '',
        twelfth_board: '',
        twelfth_school: '',
        twelfth_city: '',
        education: [],
        experience: [],
        skills: [],
        projects: [],
        certifications: [],
        achievements: [],
        sections: [
          { id: 'edu', title: 'Education', type: 'education', items: [] },
          { id: 'exp', title: 'Experience', type: 'experience', items: [] },
          { id: 'skills', title: 'Technical Skills', type: 'skills', items: [] },
          { id: 'proj', title: 'Projects', type: 'projects', items: [] },
          { id: 'certs', title: 'Certifications', type: 'bullet-list', items: [] },
          { id: 'ach', title: 'Achievements', type: 'bullet-list', items: [] }
        ],
      })
      .select()
      .single();

    if (data && !error) {
      const newResume = normalizeResumeData(data) as any as ResumeData;
      setResumes(prev => [newResume, ...prev]);
      setActiveId(newResume.id);
      showToast("New resume version created successfully", "success");
    } else {
      showToast("Failed to create new resume version: " + (error?.message || "Unknown error"), "error");
    }
    setSaving(false);
  }

  async function deleteResume() {
    if (!user || !activeId) return;
    if (resumes.length <= 1) {
      alert("You must keep at least one resume.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) {
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', activeId);

    if (!error) {
      const remaining = resumes.filter(r => r.id !== activeId);
      setResumes(remaining);
      setActiveId(remaining[0].id);
      showToast("Resume deleted successfully", "success");
    } else {
      showToast("Failed to delete resume: " + error.message, "error");
    }
    setSaving(false);
  }

  const [parsing, setParsing] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      // 1. Convert to base64
      const base64Data = await fileToBase64(file);

      // 2. Call OCR to get raw text
      const ocrRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'ocr',
          image: base64Data,
          mimeType: file.type
        })
      });

      if (!ocrRes.ok) {
        throw new Error('Failed to extract text from resume.');
      }
      const ocrData = await ocrRes.json();
      const extractedText = ocrData.result;

      if (!extractedText) {
        throw new Error('No text content found in the uploaded resume.');
      }

      // 3. Call Chat action to parse text to structured JSON matching our exact schema
      const parseRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [
            {
              role: 'user',
              content: `You are a resume parsing assistant. Parse the following unstructured resume text into a valid JSON object matching the Resume Schema. 
              Output ONLY the raw JSON block. Do not include markdown code block formatting (like \`\`\`json). Just return the raw JSON text.

              Instructions:
              1. Extract standard contact details into the top-level keys.
              2. For all sections that contain details, identify the section title and contents.
              3. You MUST map all sections of the resume into the "sections" array. Ensure the sections remain in the exact order they appeared in the user's resume.
              4. Determine the section type:
                 - "education": for school/college/university details. Items should follow EducationItem schema.
                 - "experience": for work/corporate experience. Items should follow ExperienceItem schema.
                 - "projects": for projects. Items should follow ProjectItem schema.
                 - "skills": for technical/soft skills. Items should be category strings like "Languages: Java, C++".
                 - "bullet-list": for achievements, certifications, leadership, extracurriculars, or any other custom bullet-pointed sections. Items should be simple strings.
                 - "text": for summaries or paragraphs. Items should be a single string.

              Resume Text:
              ${extractedText}

              Resume Schema to Match:
              {
                "full_name": string,
                "email": string,
                "phone": string,
                "location": string,
                "linkedin": string,
                "github": string,
                "website": string,
                "summary": string,
                "is_fresher": boolean,
                "tenth_marks": string,
                "tenth_year": string,
                "tenth_board": string,
                "tenth_school": string,
                "tenth_city": string,
                "twelfth_marks": string,
                "twelfth_year": string,
                "twelfth_board": string,
                "twelfth_school": string,
                "twelfth_city": string,
                "sections": Array of {
                  "id": string (random generated e.g. "edu", "exp", or a random code),
                  "title": string (the exact section title from user's resume, e.g. "Education", "PROFESSIONAL EXPERIENCE", "Leadership & Activities"),
                  "type": "education" | "experience" | "projects" | "skills" | "bullet-list" | "text",
                  "items": Array of appropriate item types
                }
              }`
            }
          ]
        })
      });

      if (!parseRes.ok) {
        throw new Error('Failed to parse resume content.');
      }

      const parseData = await parseRes.json();
      let rawJson = parseData.result.trim();
      
      // Strip markdown code fences if Gemini added them despite instructions
      if (rawJson.startsWith('```')) {
        rawJson = rawJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }

      const parsedResume = JSON.parse(rawJson);

      // Helper to generate a random ID for education/experience/projects if missing
      const ensureItemIds = (items: any[]) => {
        return (items || []).map(item => {
          if (typeof item === 'object' && item !== null) {
            return { id: item.id || Math.random().toString(36).slice(2, 10), ...item };
          }
          return item;
        });
      };

      const finalSections = (parsedResume.sections || []).map((sec: any) => ({
        id: sec.id || Math.random().toString(36).slice(2, 10),
        title: sec.title || 'Custom Section',
        type: sec.type || 'text',
        items: ensureItemIds(sec.items)
      }));

      // 4. Update the active resume state and sanitize through normalizeResumeData
      setResume(prev => normalizeResumeData({
        ...prev,
        ...parsedResume,
        sections: finalSections.length > 0 ? finalSections : prev.sections,
      }));

      alert("Resume parsed successfully! Review the filled sections below and manually edit if needed.");
    } catch (err) {
      console.error(err);
      alert("Failed to parse resume: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setParsing(false);
    }
  }

  function update<K extends keyof ResumeState>(key: K, value: ResumeState[K]) {
    setResume((prev) => ({ ...prev, [key]: value }));
  }

  // Dynamic Section Helpers
  const addSection = (type: CustomSection['type']) => {
    const defaultTitles = {
      education: 'Education',
      experience: 'Experience',
      projects: 'Projects',
      skills: 'Technical Skills',
      'bullet-list': 'Certifications & Achievements',
      text: 'Summary'
    };
    const newSection: CustomSection = {
      id: uid(),
      title: defaultTitles[type] || 'New Section',
      type,
      items: []
    };
    setResume(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const removeSection = (sIdx: number) => {
    setResume(prev => ({
      ...prev,
      sections: (prev.sections || []).filter((_, i) => i !== sIdx)
    }));
  };

  const updateSectionTitle = (sIdx: number, newTitle: string) => {
    setResume(prev => {
      const copy = [...(prev.sections || [])];
      if (copy[sIdx]) {
        copy[sIdx] = { ...copy[sIdx], title: newTitle };
      }
      return { ...prev, sections: copy };
    });
  };

  const updateSectionItems = (sIdx: number, newItems: any[]) => {
    setResume(prev => {
      const copy = [...(prev.sections || [])];
      if (copy[sIdx]) {
        copy[sIdx] = { ...copy[sIdx], items: newItems };
      }
      return { ...prev, sections: copy };
    });
  };

  const addSectionItem = (sIdx: number) => {
    setResume(prev => {
      const copy = [...(prev.sections || [])];
      const section = copy[sIdx];
      if (!section) return prev;

      let newItem: any;
      if (section.type === 'education') {
        newItem = {
          id: uid(),
          institution: '',
          degree: '',
          field: '',
          startYear: '',
          endYear: '',
          gpa: '',
          is_current: false,
          current_year_sem: ''
        };
      } else if (section.type === 'experience') {
        newItem = {
          id: uid(),
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          description: ''
        };
      } else if (section.type === 'projects') {
        newItem = {
          id: uid(),
          name: '',
          description: '',
          tech: '',
          github_link: '',
          live_link: ''
        };
      } else {
        newItem = '';
      }

      copy[sIdx] = { ...section, items: [...section.items, newItem] };
      return { ...prev, sections: copy };
    });
  };

  const removeSectionItem = (sIdx: number, itemIdx: number) => {
    setResume(prev => {
      const copy = [...(prev.sections || [])];
      const section = copy[sIdx];
      if (!section) return prev;

      const newItems = section.items.filter((_, i) => i !== itemIdx);
      copy[sIdx] = { ...section, items: newItems };
      return { ...prev, sections: copy };
    });
  };

  function exportPortfolioToPDF() {
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
    const currentTheme = resume.selected_theme || 'modern-dark';
    const bodyClass = currentTheme === 'modern-dark' ? 'bg-slate-950 text-white' : 
                      (currentTheme === 'minimal-stark' || currentTheme === 'academic-serif') ? 'bg-white text-neutral-900' : 
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
            @import url('https://cdn.jsdelivr.net/npm/computer-modern@0.1.3/cmu-serif.css');
            body {
              font-family: 'Outfit', 'Inter', sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-variant-numeric: lining-nums !important;
              font-feature-settings: "lnum" 1 !important;
            }
            .font-serif {
              font-family: 'CMU Serif', Georgia, serif !important;
            }
            ${resume.layout_version === 'updated' ? `
            :root {
              --resume-body-font-size: ${resume.body_font_size || '12px'};
            }
            .resume-body-text {
              font-size: var(--resume-body-font-size) !important;
            }
            @media print {
              @page {
                size: A4;
                margin: 0 !important;
              }
              body {
                padding: 15mm !important;
                margin: 0 !important;
                background-color: ${currentTheme === 'modern-dark' ? '#020617' : currentTheme === 'minimal-stark' ? '#ffffff' : '#f8fafc'} !important;
                color: ${currentTheme === 'modern-dark' ? '#ffffff' : '#111827'} !important;
              }
              .max-w-4xl {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
              }
              html, body {
                font-size: 10px !important;
                line-height: 1.15 !important;
              }
              /* Compress spacings specifically for printing to ensure 1-page fit */
              .layout-updated section, 
              .layout-updated div, 
              .layout-updated p, 
              .layout-updated li, 
              .layout-updated h1, 
              .layout-updated h2, 
              .layout-updated h3, 
              .layout-updated h4, 
              .layout-updated hr {
                margin-top: 0.12rem !important;
                margin-bottom: 0.12rem !important;
                padding-top: 0.12rem !important;
                padding-bottom: 0.12rem !important;
              }
              .layout-updated ul,
              .layout-updated ol {
                margin-top: 0.08rem !important;
                margin-bottom: 0.08rem !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }
              .layout-updated li {
                margin-top: 0.04rem !important;
                margin-bottom: 0.04rem !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                line-height: 1.12 !important;
              }
              .layout-updated h1,
              .layout-updated h2,
              .layout-updated h3,
              .layout-updated h4,
              .layout-updated h5,
              .layout-updated h6 {
                margin-top: 0.12rem !important;
                margin-bottom: 0.12rem !important;
                line-height: 1.1 !important;
              }
              .layout-updated .space-y-1 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-1\\.5 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-2 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-2\\.5 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-3 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-3\\.5 > :not([hidden]) ~ :not([hidden]),
              .layout-updated .space-y-4 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.12rem !important;
              }
              .layout-updated .space-y-6 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.2rem !important;
              }
              .layout-updated .space-y-8 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.25rem !important;
              }
              .layout-updated .py-8 {
                padding-top: 0.2rem !important;
                padding-bottom: 0.2rem !important;
              }
              .layout-updated .py-10 {
                padding-top: 0.35rem !important;
                padding-bottom: 0.35rem !important;
              }
              .layout-updated .px-6 {
                padding-left: 0.3rem !important;
                padding-right: 0.3rem !important;
              }
              .layout-updated .px-8 {
                padding-left: 0.4rem !important;
                padding-right: 0.4rem !important;
              }
              .layout-updated .p-8 {
                padding: 0.4rem !important;
              }
              .layout-updated .p-4 {
                padding: 0.15rem !important;
              }
              .layout-updated .pb-6 {
                padding-bottom: 0.15rem !important;
              }
              .layout-updated .mb-6 {
                margin-bottom: 0.15rem !important;
              }
              .layout-updated .mt-6 {
                margin-top: 0.15rem !important;
              }
              .layout-updated .pt-5 {
                padding-top: 0.15rem !important;
              }
              .layout-updated .pb-2\\.5 {
                padding-bottom: 0.08rem !important;
              }
              .layout-updated .pb-2 {
                padding-bottom: 0.08rem !important;
              }
              .layout-updated .pb-10 {
                padding-bottom: 0.3rem !important;
              }
              .layout-updated .my-1\\.5 {
                margin-top: 0.08rem !important;
                margin-bottom: 0.08rem !important;
              }
              .layout-updated .border-t.border-dashed {
                margin-top: 0.1rem !important;
                padding-top: 0.1rem !important;
              }
            }
            ` : ''}
          </style>
        </head>
        <body class="${bodyClass} p-8">
          <div class="max-w-4xl mx-auto ${(resume.layout_version || 'classic') === 'updated' ? 'layout-updated' : 'layout-classic'}">
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

  function getSectionIcon(type: CustomSection['type']) {
    switch (type) {
      case 'education': return <GraduationCap className="w-5 h-5" />;
      case 'experience': return <Briefcase className="w-5 h-5" />;
      case 'projects': return <FolderGit2 className="w-5 h-5" />;
      case 'skills': return <Code2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  }

  function renderSectionInputs(section: CustomSection, sIdx: number) {
    if (section.type === 'education') {
      return (
        <div className="space-y-4">
          {section.title.toLowerCase().includes('education') && (
            <div className="space-y-3 mb-4">
              <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest mb-3">10th Board (Secondary)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Marks (%)" value={resume.tenth_marks} onChange={(v) => update('tenth_marks', v)} placeholder="92.5" />
                  <Field label="Completion Year" value={resume.tenth_year} onChange={(v) => update('tenth_year', v)} placeholder="2019" />
                  <BoardSelect label="Board" value={resume.tenth_board} onChange={(v) => update('tenth_board', v)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <Field label="School Name" value={resume.tenth_school} onChange={(v) => update('tenth_school', v)} placeholder="St. Xavier's School" />
                  <Field label="City" value={resume.tenth_city} onChange={(v) => update('tenth_city', v)} placeholder="Greater Noida" />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/20">
                <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest mb-3">12th Board (Higher Secondary)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Marks (%)" value={resume.twelfth_marks} onChange={(v) => update('twelfth_marks', v)} placeholder="89.0" />
                  <Field label="Completion Year" value={resume.twelfth_year} onChange={(v) => update('twelfth_year', v)} placeholder="2021" />
                  <BoardSelect label="Board" value={resume.twelfth_board} onChange={(v) => update('twelfth_board', v)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <Field label="School Name" value={resume.twelfth_school} onChange={(v) => update('twelfth_school', v)} placeholder="Delhi Public School" />
                  <Field label="City" value={resume.twelfth_city} onChange={(v) => update('twelfth_city', v)} placeholder="Greater Noida" />
                </div>
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-slate-400 mb-2">College Degrees</p>
          {section.items.length === 0 && <EmptyHint text="No degrees added yet" />}
          {section.items.map((e: EducationItem, itemIdx: number) => (
            <div key={e.id || itemIdx} className="bg-ink-800/40 p-4 border border-ink-700/60 rounded-xl space-y-3 relative group/item">
              <button
                onClick={() => removeSectionItem(sIdx, itemIdx)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-450 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Institution"
                  value={e.institution || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, institution: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="ILM University"
                />
                <Field
                  label="Degree"
                  value={e.degree || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, degree: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="BTech"
                />
                <Field
                  label="Field of Study"
                  value={e.field || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, field: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="Computer Science"
                />
                <Field
                  label="GPA / Percentage"
                  value={e.gpa || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, gpa: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="GPA (e.g. 7.0) / Marks (%)"
                />
                <Field
                  label="Start Year"
                  value={e.startYear || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, startYear: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="2021"
                />
                {!e.is_current ? (
                  <Field
                    label="End Year"
                    value={e.endYear || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...e, endYear: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="2025"
                  />
                ) : (
                  <Field
                    label="Current Year / Sem (e.g. 3rd Year)"
                    value={e.current_year_sem || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...e, current_year_sem: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="e.g. 3rd Year"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={e.is_current || false}
                  onChange={(ev) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...e, is_current: ev.target.checked };
                    updateSectionItems(sIdx, copy);
                  }}
                  id={`current-edu-${e.id || itemIdx}`}
                  className="rounded bg-ink-900 border-ink-750 text-brand-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor={`current-edu-${e.id || itemIdx}`} className="text-[11px] text-slate-400 font-medium cursor-pointer select-none">Currently studying here</label>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'experience') {
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-800/60 border border-ink-700/50 cursor-pointer hover:border-brand-500/30 transition-colors">
            <input
              type="checkbox"
              checked={resume.is_fresher}
              onChange={(e) => update('is_fresher', e.target.checked)}
              className="w-4 h-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500/30 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Fresher Mode (I do not have work experience yet)</span>
          </label>

          <div className={`transition-all duration-300 overflow-hidden ${resume.is_fresher ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            {section.items.length === 0 && <EmptyHint text="No experience items added yet" />}
            {section.items.map((exp: ExperienceItem, itemIdx: number) => (
              <div key={exp.id || itemIdx} className="bg-ink-800/40 p-4 border border-ink-700/60 rounded-xl space-y-3 relative group/item mb-3">
                <button
                  onClick={() => removeSectionItem(sIdx, itemIdx)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-rose-455 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Company"
                    value={exp.company || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...exp, company: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="Google"
                  />
                  <Field
                    label="Role"
                    value={exp.role || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...exp, role: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="SDE Intern"
                  />
                  <Field
                    label="Start Date"
                    value={exp.startDate || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...exp, startDate: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="Jun 2024"
                  />
                  <Field
                    label="End Date"
                    value={exp.endDate || ''}
                    onChange={(val) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...exp, endDate: val };
                      updateSectionItems(sIdx, copy);
                    }}
                    placeholder="Aug 2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={exp.description || ''}
                    onChange={(ev) => {
                      const copy = [...section.items];
                      copy[itemIdx] = { ...exp, description: ev.target.value };
                      updateSectionItems(sIdx, copy);
                    }}
                    rows={2}
                    placeholder="Describe your work. Use bullet-style lines."
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${resume.is_fresher ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 rounded-xl bg-brand-500/5 border border-brand-500/20 text-center">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed">
                Corporate experience hidden. Your portfolio layout will highlight your Projects, Academics, and Skills instead!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (section.type === 'projects') {
      return (
        <div className="space-y-4">
          {section.items.length === 0 && <EmptyHint text="No projects added yet" />}
          {section.items.map((p: ProjectItem, itemIdx: number) => (
            <div key={p.id || itemIdx} className="bg-ink-800/40 p-4 border border-ink-700/60 rounded-xl space-y-3 relative group/item">
              <button
                onClick={() => removeSectionItem(sIdx, itemIdx)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-455 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Project Name"
                  value={p.name || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...p, name: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="StudentOS"
                />
                <Field
                  label="Tech Stack"
                  value={p.tech || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...p, tech: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="React, Supabase, TypeScript"
                />
                <Field
                  label="GitHub Repo Link"
                  value={p.github_link || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...p, github_link: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="github.com/user/repo"
                />
                <Field
                  label="Live Demo Link"
                  value={p.live_link || p.link || ''}
                  onChange={(val) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...p, live_link: val, link: val };
                    updateSectionItems(sIdx, copy);
                  }}
                  placeholder="demo.vercel.app"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={p.description || ''}
                  onChange={(ev) => {
                    const copy = [...section.items];
                    copy[itemIdx] = { ...p, description: ev.target.value };
                    updateSectionItems(sIdx, copy);
                  }}
                  rows={2}
                  placeholder="Describe your project. Use bullet-style lines."
                  className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'skills') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              id={`new-skill-heading-${sIdx}`}
              placeholder="Heading (e.g. Languages)"
              className="sm:col-span-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-550 focus:outline-none focus:border-brand-500"
            />
            <input
              id={`new-skill-details-${sIdx}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const hInput = document.getElementById(`new-skill-heading-${sIdx}`) as HTMLInputElement;
                  const dInput = document.getElementById(`new-skill-details-${sIdx}`) as HTMLInputElement;
                  if (dInput && dInput.value.trim()) {
                    const heading = hInput ? hInput.value.trim() : '';
                    const details = dInput.value.trim();
                    const s = heading ? `${heading}: ${details}` : details;
                    updateSectionItems(sIdx, [...section.items, s]);
                    dInput.value = '';
                    if (hInput) hInput.value = '';
                  }
                }
              }}
              placeholder="Details (e.g. Java, C++) - Press Enter"
              className="sm:col-span-2 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-550 focus:outline-none focus:border-brand-500"
            />
          </div>
          {section.items.length > 0 && (
            <div className="space-y-2 mt-2">
              {section.items.map((s: string, idx: number) => {
                const colonIdx = s.indexOf(':');
                const heading = colonIdx > -1 ? s.substring(0, colonIdx).trim() : '';
                const details = colonIdx > -1 ? s.substring(colonIdx + 1).trim() : s;
                return (
                  <div key={idx} className="group flex items-center justify-between gap-1.5 bg-ink-900 border border-ink-750 px-3 py-1.5 rounded-lg hover:border-slate-600 transition-colors">
                    <span className="text-xs text-slate-200">
                      {heading && <span className="font-bold text-brand-350 mr-1">{heading}:</span>}
                      {details}
                    </span>
                    <button 
                      onClick={() => removeSectionItem(sIdx, idx)} 
                      className="text-slate-500 hover:text-rose-455 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {section.items.length === 0 && <EmptyHint text="Add your skills above" />}
        </div>
      );
    }

    if (section.type === 'bullet-list') {
      return (
        <div className="space-y-3">
          <input
            id={`new-bullet-${sIdx}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.currentTarget as HTMLInputElement;
                const v = input.value.trim();
                if (v) {
                  updateSectionItems(sIdx, [...section.items, v]);
                  input.value = '';
                }
              }
            }}
            placeholder="Type a point and press Enter..."
            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-550 focus:outline-none focus:border-brand-500"
          />
          {section.items.length > 0 && (
            <div className="space-y-2 mt-2">
              {section.items.map((b: string, idx: number) => (
                <div key={idx} className="group flex items-center justify-between gap-1.5 bg-ink-900 border border-ink-750 px-3 py-1.5 rounded-lg hover:border-slate-600 transition-colors">
                  <span className="text-xs text-slate-200">{b}</span>
                  <button 
                    onClick={() => removeSectionItem(sIdx, idx)} 
                    className="text-slate-500 hover:text-rose-455 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {section.items.length === 0 && <EmptyHint text="No points added yet" />}
        </div>
      );
    }

    if (section.type === 'text') {
      return (
        <textarea
          value={section.items[0] || ''}
          onChange={(ev) => {
            updateSectionItems(sIdx, [ev.target.value]);
          }}
          rows={3}
          placeholder="Enter text content..."
          className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
        />
      );
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-800/40">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Resume Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your credentials. Changes save instantly and compile into your live portfolio.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-sm flex items-center gap-2 select-none">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
            {savedAt && (
              <span 
                className={`flex items-center gap-1.5 font-medium transition-all duration-300 ${
                  saving ? 'text-slate-450 opacity-60' : 'text-emerald-450/70 opacity-100'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Saved {savedAt}</span>
              </span>
            )}
          </div>
          <button
            onClick={() => save(resume, true)}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Resume
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT column: Editor form controls */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6 max-h-[82vh] overflow-y-auto pr-2 scrollbar-thin">
          
          {/* Resume Switcher Controls */}
          <div className="bg-ink-850/60 border border-ink-700/60 rounded-2xl p-4 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Manage Resumes</label>
              <button
                onClick={createNewResume}
                className="flex items-center gap-1 bg-brand-600/15 hover:bg-brand-600/25 text-brand-300 border border-brand-500/20 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Create Another Resume
              </button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={activeId || ''}
                onChange={(e) => setActiveId(e.target.value)}
                className="flex-1 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 h-9"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || 'Untitled Resume'}
                  </option>
                ))}
              </select>
              <button
                onClick={deleteResume}
                title="Delete current resume"
                className="flex items-center justify-center bg-ink-800 hover:bg-rose-950/40 border border-ink-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-455 rounded-lg p-2.5 transition-colors shrink-0 h-9"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {resume.id && (
              <div className="flex flex-col gap-1.5 pt-3 border-t border-ink-800/40">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Resume Name</label>
                <input
                  value={resume.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. Software Engineer Resume"
                  className="w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            <div className="flex flex-col gap-2 pt-3 border-t border-ink-800/40">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">AI Import (PDF / Word / Image)</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleResumeUpload}
                  disabled={parsing}
                  className="hidden"
                  id="resume-file-upload"
                />
                <label
                  htmlFor="resume-file-upload"
                  className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg py-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    parsing 
                      ? 'border-brand-500 bg-brand-500/5 text-brand-400 pointer-events-none' 
                      : 'border-ink-700 bg-ink-950 text-slate-350 hover:text-white hover:border-slate-500 hover:bg-ink-900'
                  }`}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                      AI Parsing Resume...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload previous Resume PDF/Image
                    </>
                  )}
                </label>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal">
                Our AI will parse your uploaded resume and automatically populate all sections below, keeping your formatting baseline.
              </p>
            </div>
          </div>

          {/* Personal Info */}
          <Section icon={<User className="w-5 h-5" />} title="Personal Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" value={resume.full_name} onChange={(v) => update('full_name', v)} placeholder="Jane Doe" />
              <Field label="Email" value={resume.email} onChange={(v) => update('email', v)} placeholder="jane@email.com" />
              <Field label="Phone" value={resume.phone} onChange={(v) => update('phone', v)} placeholder="+1 555-0100" />
              <Field label="Location" value={resume.location} onChange={(v) => update('location', v)} placeholder="San Francisco, CA" />
              <Field label="LinkedIn" value={resume.linkedin} onChange={(v) => update('linkedin', v)} placeholder="linkedin.com/in/janedoe" />
              <Field label="GitHub" value={resume.github} onChange={(v) => update('github', v)} placeholder="github.com/janedoe" />
              <Field label="Website" value={resume.website} onChange={(v) => update('website', v)} placeholder="janedoe.dev" />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Professional Summary</label>
              <textarea
                value={resume.summary}
                onChange={(e) => update('summary', e.target.value)}
                rows={3}
                placeholder="A short paragraph about your background and goals…"
                className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>
          </Section>

          {/* Dynamic Sections */}
          {resume.sections?.map((section, sIdx) => (
            <Section 
              key={section.id || sIdx} 
              icon={getSectionIcon(section.type)} 
              title={section.title}
              onAdd={section.type !== 'text' && section.type !== 'skills' && section.type !== 'bullet-list' ? () => addSectionItem(sIdx) : undefined}
              addLabel={`Add Item`}
              onDeleteSection={() => removeSection(sIdx)}
              onChangeTitle={(newTitle) => updateSectionTitle(sIdx, newTitle)}
            >
              {renderSectionInputs(section, sIdx)}
            </Section>
          ))}

          {/* Add Custom Section Box */}
          <div className="bg-ink-850/60 border border-ink-700/60 rounded-2xl p-4 space-y-3 mb-6">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Add Resume Section</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => addSection('education')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Education
              </button>
              <button
                onClick={() => addSection('experience')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Experience
              </button>
              <button
                onClick={() => addSection('projects')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Projects
              </button>
              <button
                onClick={() => addSection('skills')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Tech Skills
              </button>
              <button
                onClick={() => addSection('bullet-list')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Bullet List
              </button>
              <button
                onClick={() => addSection('text')}
                className="bg-ink-900 border border-ink-750 hover:border-slate-500 hover:bg-ink-800 text-slate-200 text-[10px] py-2 px-2.5 rounded-lg transition-all cursor-pointer font-semibold text-left"
              >
                + Text Block
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT column: Live Preview Frame */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-4">
          <div className="sticky top-4 space-y-4">
            
            {/* Toolbar */}
            <div className="glass rounded-2xl p-4 flex flex-col gap-3.5 border border-ink-700/50">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Theme selector */}
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mr-1.5 select-none">Theme</span>
                    <div className="flex flex-wrap gap-1">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => update('selected_theme', t.id)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            resume.selected_theme === t.id
                              ? 'bg-brand-600 text-white'
                              : 'bg-ink-800 text-slate-450 hover:text-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Selector */}
                  <div className="flex items-center gap-2 relative group">
                    <Settings className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mr-1 select-none">Layout</span>
                    <div className="flex gap-1">
                      {[
                        { id: 'classic', label: 'Classic' },
                        { id: 'updated', label: 'Updated' }
                      ].map((v) => (
                        <button
                          key={v.id}
                          onClick={() => update('layout_version', v.id)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            (resume.layout_version || 'classic') === v.id
                              ? 'bg-brand-600 text-white'
                              : 'bg-ink-800 text-slate-450 hover:text-slate-200'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-500 hidden sm:inline ml-1 font-medium font-sans">
                      {(resume.layout_version || 'classic') === 'classic'
                        ? 'Classic: original spacing'
                        : 'Updated: tighter spacing, A4-optimized'}
                    </span>
                    
                    {/* Brief Tooltip caption on hover */}
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-30 w-64 p-3 bg-ink-950 border border-slate-800/80 rounded-xl shadow-2xl text-[10px] text-slate-350 leading-relaxed font-sans pointer-events-none">
                      <span className="font-bold text-slate-100 block mb-0.5">Layout Spacing Version</span>
                      Classic: original spacing.<br />Updated: tighter spacing, A4-optimized, adjustable font size.
                    </div>
                  </div>
                </div>

                <button
                  onClick={exportPortfolioToPDF}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-300 hover:text-brand-200 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/20 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer self-start xl:self-auto"
                >
                  <FileText className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>

              {/* Row 2: Font Size control & Page Fit status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-ink-800/60">
                {/* Font Size control */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mr-1.5 select-none font-sans">Font Size</span>
                  <div className="flex gap-1">
                    {[
                      { id: '10px', label: 'Small (10px)' },
                      { id: '12px', label: 'Default (12px)' },
                      { id: '14px', label: 'Large (14px)' }
                    ].map((f) => {
                      const isDisabled = (resume.layout_version || 'classic') === 'classic';
                      return (
                        <button
                          key={f.id}
                          disabled={isDisabled}
                          onClick={() => update('body_font_size', f.id)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                            isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-ink-900 text-slate-600 border border-transparent'
                              : (resume.body_font_size || '12px') === f.id
                              ? 'bg-brand-600/30 text-brand-200 border border-brand-500/40 cursor-pointer'
                              : 'bg-ink-800 text-slate-450 border border-transparent hover:text-slate-200 cursor-pointer'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Page fit / Overflow indicator */}
                <div className="flex items-center gap-2 select-none font-sans">
                  {(resume.layout_version || 'classic') === 'classic' ? (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-900/40 border border-slate-800/40 px-2.5 py-1 rounded-lg">Classic spacing active</span>
                  ) : isOverflowing ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2.5 py-1.5 rounded-lg animate-pulse">
                      <span>⚠️ Running onto page 2 — try small font size</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>✓ Fits on 1 page</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Portfolio Preview Simulated Viewport */}
            <div className="rounded-2xl border border-ink-700/50 shadow-2xl overflow-auto max-h-[75vh] scrollbar-thin flex justify-center bg-ink-950/40 p-4">
              <div 
                className={`portfolio-preview-container shadow-2xl w-[794px] min-h-[1122px] shrink-0 ${(resume.layout_version || 'classic') === 'updated' ? 'layout-updated' : 'layout-classic'}`}
                style={{ '--resume-body-font-size': resume.body_font_size || '12px' } as React.CSSProperties}
              >
                {resume.selected_theme === 'modern-dark' && <ModernDark resume={resume} />}
                {resume.selected_theme === 'minimal-stark' && <MinimalStark resume={resume} />}
                {resume.selected_theme === 'professional-tech' && <ProfessionalTech resume={resume} />}
                {resume.selected_theme === 'academic-serif' && <AcademicSerif resume={resume} />}
              </div>
            </div>

          </div>
        </div>

      </div>
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/25 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.15)]'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ============ Shared form small elements ============ */

function Section({
  icon, title, onAdd, addLabel, onDeleteSection, onChangeTitle, children,
}: {
  icon: React.ReactNode;
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  onDeleteSection?: () => void;
  onChangeTitle?: (newTitle: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5 relative group/sec">
      {onDeleteSection && (
        <button 
          onClick={onDeleteSection}
          title="Delete this section"
          className="absolute top-5 right-5 text-slate-500 hover:text-rose-450 opacity-0 group-hover/sec:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center justify-between mb-4 pr-6">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">{icon}</div>
          {onChangeTitle ? (
            <input
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              className="bg-transparent text-sm font-bold text-white uppercase tracking-wider focus:outline-none focus:border-b border-brand-500/40 w-full"
            />
          ) : (
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
          )}
        </div>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors shrink-0 ml-3">
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
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-505 focus:outline-none focus:border-brand-500 transition-colors"
      />
    </div>
  );
}



function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-slate-500 text-center py-4">{text}</p>;
}

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];

function BoardSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
      >
        <option value="">Select board</option>
        {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
    </div>
  );
}

/* ============ Shared live preview helpers ============ */

type PreviewProps = { resume: ResumeState };

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

/* ============ Theme 1: Modern Dark ============ */

function ModernDark({ resume }: PreviewProps) {
  const isUpdated = resume.layout_version === 'updated';
  const bodyTextClass = isUpdated ? 'resume-body-text' : '';

  return (
    <div className="bg-gradient-to-br from-slate-950 via-ink-900 to-slate-950 text-white min-h-[1122px]">
      {/* Hero */}
      <div className="relative px-6 py-10 overflow-hidden border-b border-ink-800/40">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-brand-400 text-[10px] font-bold tracking-widest uppercase mb-2">Portfolio</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className={`text-sm text-slate-450 mt-2 max-w-lg leading-relaxed ${bodyTextClass}`}>{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-xs text-slate-500">
            {resume.email && <ContactLine icon={<Mail className="w-3.5 h-3.5 text-brand-400" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3.5 h-3.5 text-brand-400" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3.5 h-3.5 text-brand-400" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3.5 h-3.5 text-brand-400" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3.5 h-3.5 text-brand-400" />} text={resume.linkedin} link={resume.linkedin} />}
          </div>
        </div>
      </div>

      <div className={`px-6 py-8 ${isUpdated ? 'space-y-4' : 'space-y-8'} max-w-3xl mx-auto`}>
        {resume.sections?.filter(sec => !sec.title.toLowerCase().includes('summary')).map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <PreviewSection key={section.id} icon={<GraduationCap className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <div className={isUpdated ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                  <div className={isUpdated ? "space-y-2" : "space-y-4"}>
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">University / College</p>
                    {section.items.map((e: EducationItem) => (
                      <div key={e.id} className={isUpdated ? "flex justify-between items-start border-l border-brand-500/20 pl-3 py-0.5" : "flex justify-between items-start border-l border-brand-500/20 pl-3"}>
                        <div>
                          <h3 className="font-bold text-white text-xs leading-tight">{e.institution || 'University Name'}</h3>
                          <p className={`text-[11px] text-slate-400 mt-0.5 leading-tight ${bodyTextClass}`}>{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                          <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>
                            {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                          </p>
                        </div>
                        {e.gpa && (
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs font-extrabold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20 inline-block shadow-sm ${bodyTextClass}`}>
                              {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {section.title.toLowerCase().includes('education') && (resume.tenth_marks || resume.twelfth_marks) && (
                    <div className={isUpdated ? "space-y-2" : "space-y-3"}>
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Schooling</p>
                      {resume.twelfth_marks && (
                        <div className={isUpdated ? "flex justify-between items-start border-l border-brand-500/20 pl-3 py-0.5 animate-fadeIn" : "flex justify-between items-start border-l border-brand-500/20 pl-3 animate-fadeIn"}>
                          <div>
                            <h4 className="font-bold text-white text-xs leading-tight">12th Class (Higher Secondary)</h4>
                            <p className={`text-[11px] text-slate-400 leading-normal mt-0.5 ${bodyTextClass}`}>{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                            {resume.twelfth_board && <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.twelfth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs text-brand-300 font-bold ${bodyTextClass}`}>{resume.twelfth_marks}%</span>
                            <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>{resume.twelfth_year}</p>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className={isUpdated ? "flex justify-between items-start border-l border-brand-500/20 pl-3 py-0.5 animate-fadeIn" : "flex justify-between items-start border-l border-brand-500/20 pl-3 animate-fadeIn"}>
                          <div>
                            <h4 className="font-bold text-white text-xs leading-tight">10th Class (Secondary)</h4>
                            <p className={`text-[11px] text-slate-400 leading-normal mt-0.5 ${bodyTextClass}`}>{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                            {resume.tenth_board && <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.tenth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs text-brand-300 font-bold ${bodyTextClass}`}>{resume.tenth_marks}%</span>
                            <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>{resume.tenth_year}</p>
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
                        <span className={`text-[10px] text-slate-500 shrink-0 font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full ${bodyTextClass}`}>
                          {e.startDate} — {e.endDate || 'Present'}
                        </span>
                      </div>
                      <ul className={`list-disc pl-4 space-y-1 text-slate-400 text-xs leading-relaxed font-normal ${bodyTextClass}`}>
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
                      {p.tech && <p className={`text-[10px] text-brand-400 mb-2 font-medium ${bodyTextClass}`}>{p.tech}</p>}
                      <ul className={`list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed ${bodyTextClass}`}>
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
                    <span key={idx} className={`text-xs font-semibold px-3 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20 ${bodyTextClass}`}>{s}</span>
                  ))}
                </div>
              </PreviewSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <PreviewSection key={section.id} icon={<FileText className="w-4 h-4 text-brand-400" />} title={section.title} accent="text-brand-400">
                <ul className={`list-disc pl-5 space-y-1 text-slate-400 text-xs leading-relaxed ${bodyTextClass}`}>
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
                <p className={`text-xs text-slate-400 leading-relaxed ${bodyTextClass}`}>{section.items[0]}</p>
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
  const isUpdated = resume.layout_version === 'updated';
  const bodyTextClass = isUpdated ? 'resume-body-text' : '';

  return (
    <div className="bg-white text-neutral-900 min-h-[1122px]">
      <div className="px-6 py-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-6 mb-6">
          <h1 className="text-3xl font-light tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className={`text-sm text-neutral-500 mt-2 font-light leading-relaxed ${bodyTextClass}`}>{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-neutral-400 font-light">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.github && <a href={`https://${resume.github}`} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.github}</a>}
            {resume.linkedin && <a href={`https://${resume.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-neutral-900">{resume.linkedin}</a>}
          </div>
        </div>

        {resume.sections?.filter(sec => !sec.title.toLowerCase().includes('summary')).map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <div className={isUpdated ? "space-y-2" : "space-y-3.5"}>
                  {section.items.map((e: EducationItem) => (
                    <div key={e.id} className={isUpdated ? "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-1.5" : "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2.5"}>
                      <div className={`text-[11px] text-neutral-400 font-light ${bodyTextClass}`}>
                        {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                      </div>
                      <div className="sm:col-span-3 flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-semibold text-neutral-900 leading-tight">{e.institution || 'University Name'}</h3>
                          <p className={`text-xs text-neutral-600 mt-0.5 leading-tight ${bodyTextClass}`}>{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                        </div>
                        {e.gpa && (
                          <span className={`text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded shrink-0 ml-4 ${bodyTextClass}`}>
                            {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {section.title.toLowerCase().includes('education') && (resume.twelfth_marks || resume.tenth_marks) && (
                    <>
                      {resume.twelfth_marks && (
                        <div className={isUpdated ? "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-1.5" : "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2"}>
                          <div className={`text-[11px] text-neutral-400 font-light ${bodyTextClass}`}>{resume.twelfth_year}</div>
                          <div className="sm:col-span-3 flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-semibold text-neutral-900 leading-tight">12th Class (Higher Secondary)</h3>
                              <p className={`text-xs text-neutral-500 mt-0.5 leading-normal ${bodyTextClass}`}>{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                              {resume.twelfth_board && <p className={`text-[11px] text-neutral-400 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.twelfth_board}</p>}
                            </div>
                            <span className={`text-xs font-bold text-neutral-800 shrink-0 ml-4 ${bodyTextClass}`}>{resume.twelfth_marks}%</span>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className={isUpdated ? "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-1.5" : "grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-neutral-100 pb-2"}>
                          <div className={`text-[11px] text-neutral-400 font-light ${bodyTextClass}`}>{resume.tenth_year}</div>
                          <div className="sm:col-span-3 flex justify-between items-start">
                            <div>
                              <h3 className="text-xs font-semibold text-neutral-900 leading-tight">10th Class (Secondary)</h3>
                              <p className={`text-xs text-neutral-500 mt-0.5 leading-normal ${bodyTextClass}`}>{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                              {resume.tenth_board && <p className={`text-[11px] text-neutral-400 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.tenth_board}</p>}
                            </div>
                            <span className={`text-xs font-bold text-neutral-800 shrink-0 ml-4 ${bodyTextClass}`}>{resume.tenth_marks}%</span>
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
                      <div className={`text-[11px] text-neutral-400 font-light ${bodyTextClass}`}>{e.startDate} — {e.endDate || 'Present'}</div>
                      <div className="sm:col-span-3">
                        <h3 className="text-xs font-semibold text-neutral-900 leading-tight">{e.role} · <span className="text-neutral-500 font-normal">{e.company}</span></h3>
                        <ul className={`list-disc pl-4 space-y-1 text-neutral-600 text-xs mt-1 ${bodyTextClass}`}>
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
                      <div className={`text-[11px] text-neutral-400 font-light truncate ${bodyTextClass}`}>{p.tech}</div>
                      <div className="sm:col-span-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-neutral-900 leading-tight">{p.name}</h3>
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
                        <p className={`text-xs text-neutral-600 mt-0.5 leading-relaxed ${bodyTextClass}`}>{p.description}</p>
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
                    <p key={idx} className={`text-xs text-neutral-605 ${bodyTextClass}`}>{s}</p>
                  ))}
                </div>
              </StarkSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <StarkSection key={section.id} title={section.title}>
                <ul className={`list-disc pl-5 space-y-1 text-neutral-600 text-xs ${bodyTextClass}`}>
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
                <p className={`text-xs text-neutral-600 leading-relaxed ${bodyTextClass}`}>{section.items[0]}</p>
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
  const isUpdated = resume.layout_version === 'updated';
  const bodyTextClass = isUpdated ? 'resume-body-text' : '';

  return (
    <div className="bg-slate-100 text-slate-800 min-h-[1122px]">
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">{resume.full_name || 'Your Name'}</h1>
          <p className={`text-teal-300 mt-1 text-xs font-medium uppercase tracking-wider ${bodyTextClass}`}>{resume.summary || 'CS Student & Aspiring Software Engineer.'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3.5 text-[11px] text-slate-300">
            {resume.email && <ContactLine icon={<Mail className="w-3.5 h-3.5 text-teal-400" />} text={resume.email} />}
            {resume.phone && <ContactLine icon={<Phone className="w-3.5 h-3.5 text-teal-400" />} text={resume.phone} />}
            {resume.location && <ContactLine icon={<MapPin className="w-3.5 h-3.5 text-teal-400" />} text={resume.location} />}
            {resume.github && <ContactLine icon={<Github className="w-3.5 h-3.5 text-teal-400" />} text={resume.github} link={resume.github} />}
            {resume.linkedin && <ContactLine icon={<Linkedin className="w-3.5 h-3.5 text-teal-400" />} text={resume.linkedin} link={resume.linkedin} />}
          </div>
        </div>
      </div>

      <div className={`max-w-3xl mx-auto px-6 py-8 ${isUpdated ? 'space-y-4' : 'space-y-8'} animate-fadeIn`}>
        {resume.sections?.filter(sec => !sec.title.toLowerCase().includes('summary')).map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <TechSection key={section.id} title={section.title} icon={<GraduationCap className="w-3.5 h-3.5" />}>
                <div className={isUpdated ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                  <div className={isUpdated ? "space-y-2" : "space-y-4"}>
                    <p className="text-[10px] font-bold text-teal-655 uppercase tracking-wide">University / College</p>
                    {section.items.map((e: EducationItem) => (
                      <div key={e.id} className={isUpdated ? "flex justify-between items-start border-l border-teal-500 pl-3 py-0.5" : "flex justify-between items-start border-l border-teal-500 pl-3"}>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs leading-tight">{e.institution || 'University Name'}</h3>
                          <p className={`text-xs text-slate-655 font-medium leading-tight ${bodyTextClass}`}>{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                          <p className={`text-[10px] text-slate-500 mt-0.5 leading-tight ${bodyTextClass}`}>
                            {e.startYear || 'N/A'} — {e.is_current ? 'Present' : (e.endYear || 'N/A')}
                          </p>
                        </div>
                        {e.gpa && (
                          <div className="text-right shrink-0 ml-4 animate-fadeIn">
                            <span className={`text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shadow-sm inline-block ${bodyTextClass}`}>
                              {e.is_current && e.current_year_sem ? `${e.current_year_sem} · ` : ''}GPA {e.gpa}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {section.title.toLowerCase().includes('education') && (resume.tenth_marks || resume.twelfth_marks) && (
                    <div className={isUpdated ? "space-y-2" : "space-y-3"}>
                      <p className="text-[10px] font-bold text-teal-655 uppercase tracking-wide">Schooling</p>
                      {resume.twelfth_marks && (
                        <div className={isUpdated ? "flex justify-between items-start border-l border-teal-500 pl-3 py-0.5 animate-fadeIn" : "flex justify-between items-start border-l border-teal-500 pl-3 animate-fadeIn"}>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs leading-tight">12th Class (Higher Secondary)</h4>
                            <p className={`text-xs text-slate-600 leading-normal mt-0.5 ${bodyTextClass}`}>{resume.twelfth_school || 'School Name'}{resume.twelfth_city ? `, ${resume.twelfth_city}` : ''}</p>
                            {resume.twelfth_board && <p className={`text-[10px] text-slate-455 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.twelfth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs text-teal-600 font-bold ${bodyTextClass}`}>{resume.twelfth_marks}%</span>
                            <p className={`text-[10px] text-slate-555 mt-0.5 leading-tight ${bodyTextClass}`}>{resume.twelfth_year}</p>
                          </div>
                        </div>
                      )}
                      {resume.tenth_marks && (
                        <div className={isUpdated ? "flex justify-between items-start border-l border-teal-500 pl-3 py-0.5 animate-fadeIn" : "flex justify-between items-start border-l border-teal-500 pl-3 animate-fadeIn"}>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs leading-tight">10th Class (Secondary)</h4>
                            <p className={`text-xs text-slate-600 leading-normal mt-0.5 ${bodyTextClass}`}>{resume.tenth_school || 'School Name'}{resume.tenth_city ? `, ${resume.tenth_city}` : ''}</p>
                            {resume.tenth_board && <p className={`text-[10px] text-slate-455 mt-0.5 leading-tight ${bodyTextClass}`}>Board: {resume.tenth_board}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs text-teal-600 font-bold ${bodyTextClass}`}>{resume.tenth_marks}%</span>
                            <p className={`text-[10px] text-slate-555 mt-0.5 leading-tight ${bodyTextClass}`}>{resume.tenth_year}</p>
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
                      <p className={`text-[11px] text-teal-650 font-semibold ${bodyTextClass}`}>{e.company} · {e.startDate} — {e.endDate || 'Present'}</p>
                      <ul className={`list-disc pl-4 space-y-1 text-slate-600 text-xs mt-1 ${bodyTextClass}`}>
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
                      {p.tech && <p className={`text-[10px] text-teal-600 font-bold mt-2 uppercase tracking-wide ${bodyTextClass}`}>{p.tech}</p>}
                      <ul className={`list-disc pl-4 space-y-1 text-slate-600 text-xs mt-1.5 leading-relaxed ${bodyTextClass}`}>
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
                    <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded bg-teal-50 text-teal-705 border border-teal-200 ${bodyTextClass}`}>{s}</span>
                  ))}
                </div>
              </TechSection>
            );
          }

          if (section.type === 'bullet-list') {
            return (
              <TechSection key={section.id} title={section.title} icon={<FileText className="w-3.5 h-3.5" />}>
                <ul className={`list-disc pl-5 space-y-1 text-slate-600 text-xs leading-relaxed ${bodyTextClass}`}>
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
                <p className={`text-xs text-slate-600 leading-relaxed ${bodyTextClass}`}>{section.items[0]}</p>
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
  const isUpdated = resume.layout_version === 'updated';
  const bodyTextClass = isUpdated ? 'resume-body-text' : '';

  return (
    <div className="bg-white text-black min-h-[1122px] font-serif p-8 md:p-12 leading-relaxed" style={{ fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>
      <div className={`max-w-3xl mx-auto ${isUpdated ? 'space-y-3.5' : 'space-y-6'}`}>
        
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
            <p className={`text-xs text-black/90 leading-relaxed font-serif ${bodyTextClass}`}>{resume.summary}</p>
          </div>
        )}

        {/* Dynamic Sections */}
        {resume.sections && resume.sections.filter(sec => !sec.title.toLowerCase().includes('summary')).map((section) => {
          if (section.items.length === 0) return null;

          if (section.type === 'education') {
            return (
              <div key={section.id}>
                <h2 className="text-sm font-bold tracking-wider text-black uppercase">{section.title}</h2>
                <hr className="border-t border-black/80 my-1.5" />
                <div className={isUpdated ? "space-y-1.5" : "space-y-2.5"}>
                  {section.items.map((e: EducationItem) => {
                    const datesStr = e.is_current ? `${e.startYear || 'N/A'} — Present` : `${e.startYear || 'N/A'} — ${e.endYear || 'N/A'}`;
                    const instName = e.institution || 'University/College Name';
                    const commaIdx = instName.indexOf(',');
                    let primaryInst = instName;
                    let locationInst = '';
                    if (commaIdx > -1) {
                      primaryInst = instName.substring(0, commaIdx).trim();
                      locationInst = instName.substring(commaIdx + 1).trim();
                    }

                    return (
                      <div key={e.id} className={isUpdated ? "text-[11px] font-serif text-black/90 leading-tight" : "text-[11px] font-serif text-black/90"}>
                        <div className="flex justify-between items-start text-[11px]">
                          <div>
                            <h3 className="font-bold text-black">{primaryInst}</h3>
                            {locationInst && <p className={`text-[10px] text-black/60 font-normal mt-0.5 leading-normal ${bodyTextClass}`}>{locationInst}</p>}
                          </div>
                          <span className={`shrink-0 ml-4 font-bold text-black ${bodyTextClass}`}>{datesStr}</span>
                        </div>
                        <div className={`flex justify-between items-start text-[10px] text-black/85 italic mt-0.5 ${bodyTextClass}`}>
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
                        <div className={isUpdated ? "text-[11px] font-serif text-black/90 mt-1.5 pt-1 border-t border-dashed border-black/15 " + bodyTextClass : "text-[11px] font-serif text-black/90 mt-2 pt-1.5 border-t border-dashed border-black/15 " + bodyTextClass}>
                          <div className="flex justify-between items-start text-[11px]">
                            <div>
                              <h4 className="font-bold text-black">Class XII: {resume.twelfth_school || 'School Name'}</h4>
                              {(resume.twelfth_city || resume.twelfth_board) && (
                                <p className={`text-[10px] text-black/60 font-normal mt-0.5 leading-normal ${bodyTextClass}`}>
                                  {resume.twelfth_city || 'City'}{resume.twelfth_board ? ` (${resume.twelfth_board})` : ''}
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 ml-4 font-bold text-black ${bodyTextClass}`}>{resume.twelfth_year}</span>
                          </div>
                          <div className={`flex justify-between items-start text-[10px] text-black/85 italic mt-0.5 ${bodyTextClass}`}>
                            <p>Higher Secondary Education</p>
                            <span className="font-bold not-italic">Marks: {resume.twelfth_marks}%</span>
                          </div>
                        </div>
                      )}
                      
                      {resume.tenth_marks && (
                        <div className={isUpdated ? "text-[11px] font-serif text-black/90 mt-1 " + bodyTextClass : "text-[11px] font-serif text-black/90 mt-1.5 " + bodyTextClass}>
                          <div className="flex justify-between items-start text-[11px]">
                            <div>
                              <h4 className="font-bold text-black">Class X: {resume.tenth_school || 'School Name'}</h4>
                              {(resume.tenth_city || resume.tenth_board) && (
                                <p className={`text-[10px] text-black/60 font-normal mt-0.5 leading-normal ${bodyTextClass}`}>
                                  {resume.tenth_city || 'City'}{resume.tenth_board ? ` (${resume.tenth_board})` : ''}
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 ml-4 font-bold text-black ${bodyTextClass}`}>{resume.tenth_year}</span>
                          </div>
                          <div className={`flex justify-between items-start text-[10px] text-black/85 italic mt-0.5 ${bodyTextClass}`}>
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
                        <p className={`font-medium text-black/85 ${bodyTextClass}`}>
                          {e.startDate} — {e.endDate || 'Present'}
                        </p>
                      </div>
                      <ul className={`list-disc pl-5 mt-1 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px] ${bodyTextClass}`}>
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
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <h3 className="font-bold text-black text-[11px] truncate">{p.name || 'Project'}</h3>
                          {p.tech && <span className={`text-[10px] font-normal text-black/70 truncate ${bodyTextClass}`}>| {p.tech}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-4">
                          {p.github_link && (
                            <a 
                              href={p.github_link.startsWith('http') ? p.github_link : `https://${p.github_link}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-black/60 hover:text-black transition-colors"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(p.live_link || p.link) && (
                            <a 
                              href={(p.live_link || p.link)!.startsWith('http') ? (p.live_link || p.link) : `https://${p.live_link || p.link}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-black/60 hover:text-black transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <ul className={`list-disc pl-5 mt-1 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px] ${bodyTextClass}`}>
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
                        <p key={idx} className={`text-black/90 leading-relaxed text-[11px] ${bodyTextClass}`}>
                          <span className="font-bold">{heading}:</span> {details}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className={`text-black/90 leading-relaxed text-[11px] ${bodyTextClass}`}>
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
                <ul className={`list-disc pl-5 space-y-0.5 text-black/90 leading-relaxed font-serif text-[11px] ${bodyTextClass}`}>
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
                <p className={`text-xs text-black/90 leading-relaxed font-serif ${bodyTextClass}`}>{section.items[0]}</p>
              </div>
            );
          }

          return null;
        })}

      </div>
    </div>
  );
}
