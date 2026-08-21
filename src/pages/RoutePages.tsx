import NotesGenerator from './NotesGenerator';
import CodeQuestionsPage from './CodeQuestions';
import TrackersPage from './Trackers';
import DsaTrackerPage from './DsaTracker';
import TimetablePage from './Timetable';
import ResumeBuilder from './ResumeBuilder';
import PortfolioGenerator from './PortfolioGenerator';
import AttendancePage from './Attendance';
import CgpaPage from './CGPA';
import AssignmentGenerator from './AssignmentGenerator';
import CodingRoadmapPage from './CodingRoadmap';
import InternshipFinderPage from './InternshipFinder';

export function NotesGen() {
  return <NotesGenerator />;
}

export function CodeQuestions() {
  return <CodeQuestionsPage />;
}

export function AssignmentGen() {
  return <AssignmentGenerator />;
}

export function Attendance() {
  return <AttendancePage />;
}

export function CGPA() {
  return <CgpaPage />;
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
  return <InternshipFinderPage />;
}

export function DSATracker() {
  return <DsaTrackerPage />;
}

export function CodingRoadmap() {
  return <CodingRoadmapPage />;
}

export function Trackers() {
  return <TrackersPage />;
}
