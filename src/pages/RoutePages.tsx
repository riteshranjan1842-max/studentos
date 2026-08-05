import {
  FileText, CalendarCheck, TrendingUp, Briefcase, Map,
} from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import NotesGenerator from './NotesGenerator';
import TrackersPage from './Trackers';
import DsaTrackerPage from './DsaTracker';
import TimetablePage from './Timetable';
import ResumeBuilder from './ResumeBuilder';
import PortfolioGenerator from './PortfolioGenerator';

export function NotesGen() {
  return <NotesGenerator />;
}

export function AssignmentGen() {
  return (
    <PlaceholderPage
      title="AI Assignment Generator"
      description="Get AI-assisted drafts, outlines, and research pointers for your assignments. Provide the prompt, and let StudentOS structure your work."
      icon={<FileText className="w-8 h-8" />}
      accent="brand"
    />
  );
}

export function Attendance() {
  return (
    <PlaceholderPage
      title="Attendance Tracker"
      description="Track your subject-wise attendance, see your overall percentage, and get alerts when you're at risk of falling below the required threshold."
      icon={<CalendarCheck className="w-8 h-8" />}
      accent="emerald"
    />
  );
}

export function CGPA() {
  return (
    <PlaceholderPage
      title="CGPA Tracker"
      description="Log your semester SGPA, visualize your academic progress over time, and project your final CGPA based on upcoming semesters."
      icon={<TrendingUp className="w-8 h-8" />}
      accent="sky"
    />
  );
}

export function Timetable() {
  return <TimetablePage />;
}

export function Resume() {
  return <ResumeBuilder />;
}

export function Portfolio() {
  return <PortfolioGenerator />;
}

export function InternshipFinder() {
  return (
    <PlaceholderPage
      title="Internship Finder"
      description="Discover internships matched to your skills and interests. Track applications, deadlines, and interview prep in one place."
      icon={<Briefcase className="w-8 h-8" />}
      accent="emerald"
    />
  );
}

export function DSATracker() {
  return <DsaTrackerPage />;
}

export function CodingRoadmap() {
  return (
    <PlaceholderPage
      title="Coding Roadmap"
      description="Follow a structured learning path from foundations to advanced topics. Track each phase, check off milestones, and stay on course."
      icon={<Map className="w-8 h-8" />}
      accent="rose"
    />
  );
}

export function Trackers() {
  return <TrackersPage />;
}
