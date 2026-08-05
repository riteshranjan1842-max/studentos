import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import {
  NotesGen, AssignmentGen, Attendance, CGPA, Timetable,
  Resume, Portfolio, InternshipFinder, DSATracker, CodingRoadmap, Trackers,
} from './pages/RoutePages';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai/notes" element={<NotesGen />} />
        <Route path="/ai/assignments" element={<AssignmentGen />} />
        <Route path="/academic/attendance" element={<Attendance />} />
        <Route path="/academic/cgpa" element={<CGPA />} />
        <Route path="/academic/timetable" element={<Timetable />} />
        <Route path="/career/resume" element={<Resume />} />
        <Route path="/career/portfolio" element={<Portfolio />} />
        <Route path="/career/internships" element={<InternshipFinder />} />
        <Route path="/tech/dsa" element={<DSATracker />} />
        <Route path="/tech/applications" element={<Trackers />} />
        <Route path="/tech/roadmap" element={<CodingRoadmap />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
