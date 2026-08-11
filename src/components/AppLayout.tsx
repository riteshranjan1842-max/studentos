import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  GraduationCap, LayoutDashboard, Sparkles, CalendarCheck, TrendingUp, CalendarDays,
  FileText, Globe, Briefcase, Code2, Map, Menu, X, LogOut, ChevronRight, Target, Settings2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import ControlCenterModal from './ControlCenterModal';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, end: true }],
  },
  {
    title: 'AI Tools',
    items: [
      { label: 'Notes Generator', to: '/ai/notes', icon: <Sparkles className="w-[18px] h-[18px]" /> },
      { label: 'Assignment Gen', to: '/ai/assignments', icon: <FileText className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'Academic Trackers',
    items: [
      { label: 'Attendance', to: '/academic/attendance', icon: <CalendarCheck className="w-[18px] h-[18px]" /> },
      { label: 'CGPA', to: '/academic/cgpa', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
      { label: 'Timetable', to: '/academic/timetable', icon: <CalendarDays className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'Career',
    items: [
      { label: 'Resume', to: '/career/resume', icon: <FileText className="w-[18px] h-[18px]" /> },
      { label: 'Portfolio', to: '/career/portfolio', icon: <Globe className="w-[18px] h-[18px]" /> },
      { label: 'Internship Finder', to: '/career/internships', icon: <Briefcase className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'Tech Preparation',
    items: [
      { label: 'DSA Tracker', to: '/tech/dsa', icon: <Code2 className="w-[18px] h-[18px]" /> },
      { label: 'Application Tracker', to: '/tech/applications', icon: <Target className="w-[18px] h-[18px]" /> },
      { label: 'Coding Roadmap', to: '/tech/roadmap', icon: <Map className="w-[18px] h-[18px]" /> },
    ],
  },
];

export default function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [controlCenterTab, setControlCenterTab] = useState<'settings' | 'notifications' | 'analytics'>('settings');

  const displayName = profile?.full_name || 'Student';
  const initials = displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'S';

  function closeMobile() {
    setMobileOpen(false);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-ink-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-semibold text-white tracking-tight">StudentOS</span>
          <div className="text-[10px] text-slate-500 -mt-0.5 uppercase tracking-wider">v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-300 border border-brand-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-ink-800/60 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-400" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-ink-700/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ink-800/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">Student Account</p>
          </div>
          <button
            onClick={() => { setControlCenterTab('settings'); setControlCenterOpen(true); }}
            title="Settings"
            className="p-1.5 rounded-lg text-slate-550 hover:text-slate-200 hover:bg-ink-700/50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-550 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-center text-sm text-amber-200">
          Supabase is not configured. Add your project credentials to <code className="text-amber-100">.env</code> to enable auth and data sync.
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 glass z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={closeMobile} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 glass z-50 animate-slide-up">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 glass h-14 flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-slate-300 hover:bg-ink-800">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-400" />
            <span className="font-semibold text-white">StudentOS</span>
          </div>
          <div className="w-9" />
        </header>

        <main key={location.pathname} className="animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu close button overlay (when open) */}
      {mobileOpen && (
        <button
          onClick={closeMobile}
          className="lg:hidden fixed top-4 right-4 z-[60] p-2 rounded-lg bg-ink-800 text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Account Settings & Analytics Control Center */}
      <ControlCenterModal
        isOpen={controlCenterOpen}
        onClose={() => setControlCenterOpen(false)}
        initialTab={controlCenterTab}
      />
    </div>
  );
}
