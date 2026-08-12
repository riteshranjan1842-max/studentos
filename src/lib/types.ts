export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email_reminders?: boolean;
  class_reminder_mins?: number;
  theme_color?: string;
  created_at: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  gpa: string;
  is_current?: boolean;
  current_year_sem?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
  github_link?: string;
  live_link?: string;
  tech: string;
}

export interface CustomSection {
  id: string;
  title: string;
  type: 'education' | 'experience' | 'projects' | 'skills' | 'bullet-list' | 'text';
  items: any[];
}

export interface ResumeData {
  id: string;
  user_id: string;
  title: string | null;
  sections: CustomSection[] | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  summary: string | null;
  is_fresher: boolean | null;
  tenth_marks: string | null;
  tenth_year: string | null;
  tenth_board: string | null;
  tenth_school: string | null;
  tenth_city: string | null;
  twelfth_marks: string | null;
  twelfth_year: string | null;
  twelfth_board: string | null;
  twelfth_school: string | null;
  twelfth_city: string | null;
  education: EducationItem[] | null;
  experience: ExperienceItem[] | null;
  skills: string[] | null;
  projects: ProjectItem[] | null;
  certifications: string[] | null;
  achievements: string[] | null;
  body_font_size?: string | null;
  layout_version?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickTask {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  color?: string | null;
  created_at: string;
}

export interface StudentMetrics {
  id: string;
  user_id: string;
  cgpa: number | null;
  attendance_pct: number | null;
  dsa_solved: number | null;
  updated_at: string;
  created_at: string;
}

export interface DsaProblem {
  id: string;
  user_id: string;
  problem_name: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Unsolved' | 'In Progress' | 'Solved';
  solution_link: string | null;
  problem_link: string | null;
  reattempt_at: string | null;
  reattempt_days: number | null;
  ai_judgment: string | null;
  email_sent?: boolean;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  date_applied: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  day: string;
  subject: string;
  start_time: string;
  end_time: string;
  professor?: string | null;
  room: string | null;
  color: string;
  created_at: string;
}

export interface TimetableClass {
  id: string;
  user_id: string;
  branch: string;
  subject: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  professor: string | null;
  room: string | null;
  color: string;
  created_at: string;
}
