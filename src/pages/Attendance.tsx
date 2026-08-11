import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, CalendarCheck, Undo2, Award, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SubjectAttendance {
  id: string;
  user_id: string;
  subject: string;
  attended: number;
  total: number;
  created_at: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function loadAttendance() {
      if (!user) return;
      const { data } = await supabase
        .from('subject_attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setSubjects((data as SubjectAttendance[]) ?? []);
      setLoading(false);
    }
    loadAttendance();
  }, [user]);

  // Helper to sync overall percentage to student_metrics table
  async function syncOverallMetrics(currentSubjects: SubjectAttendance[]) {
    if (!user) return;
    const totalAttended = currentSubjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = currentSubjects.reduce((sum, s) => sum + s.total, 0);
    const overallPct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : null;

    await supabase
      .from('student_metrics')
      .upsert(
        { user_id: user.id, attendance_pct: overallPct, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }

  async function addSubject(e: FormEvent) {
    e.preventDefault();
    if (!user || !newSubjectName.trim()) return;
    setAdding(true);
    const { data: created } = await supabase
      .from('subject_attendance')
      .insert({
        user_id: user.id,
        subject: newSubjectName.trim(),
        attended: 0,
        total: 0,
      })
      .select('*')
      .maybeSingle();

    if (created) {
      const updatedList = [...subjects, created as SubjectAttendance];
      setSubjects(updatedList);
      setNewSubjectName('');
      await syncOverallMetrics(updatedList);
    }
    setAdding(false);
  }

  async function syncFromTimetable() {
    if (!user) return;
    setSyncing(true);
    try {
      // 1. Fetch unique subjects from timetable
      const { data: timetableData } = await supabase
        .from('timetable')
        .select('subject')
        .eq('user_id', user.id);

      if (!timetableData || timetableData.length === 0) {
        alert("No subjects found in your timetable. Please configure or scan your timetable first.");
        return;
      }

      // Get unique subject names
      const uniqueTimetableSubjects = Array.from(
        new Set(timetableData.map((t) => t.subject.trim()))
      );

      // 2. Filter out subjects already in the attendance list
      const existingNames = new Set(subjects.map((s) => s.subject.toLowerCase().trim()));
      const subjectsToAdd = uniqueTimetableSubjects.filter(
        (name) => !existingNames.has(name.toLowerCase().trim())
      );

      if (subjectsToAdd.length === 0) {
        alert("All subjects from your timetable are already added to your attendance tracker!");
        return;
      }

      // 3. Bulk insert missing subjects
      const inserts = subjectsToAdd.map((name) => ({
        user_id: user.id,
        subject: name,
        attended: 0,
        total: 0,
      }));

      const { data: created, error } = await supabase
        .from('subject_attendance')
        .insert(inserts)
        .select('*');

      if (error) throw error;

      if (created) {
        const updatedList = [...subjects, ...(created as SubjectAttendance[])];
        setSubjects(updatedList);
        await syncOverallMetrics(updatedList);
        alert(`Successfully imported ${subjectsToAdd.length} subjects from your timetable!`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to sync subjects.");
    } finally {
      setSyncing(false);
    }
  }

  async function updateAttendance(id: string, attendedDelta: number, totalDelta: number) {
    const updated = subjects.map((sub) => {
      if (sub.id === id) {
        const nextAttended = Math.max(0, sub.attended + attendedDelta);
        const nextTotal = Math.max(nextAttended, sub.total + totalDelta);
        return { ...sub, attended: nextAttended, total: nextTotal };
      }
      return sub;
    });

    setSubjects(updated);
    const target = updated.find((s) => s.id === id);
    if (target) {
      await supabase
        .from('subject_attendance')
        .update({ attended: target.attended, total: target.total })
        .eq('id', id);
      await syncOverallMetrics(updated);
    }
  }

  async function deleteSubject(id: string) {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    await supabase.from('subject_attendance').delete().eq('id', id);
    await syncOverallMetrics(updated);
  }

  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
  const isBelowThreshold = overallPct < 75 && totalClasses > 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-emerald-400" /> Attendance Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Keep track of your classes to maintain at least 75% attendance.
          </p>
        </div>

        {/* Overall Percentage Badge */}
        {totalClasses > 0 && (
          <div className={`flex items-center gap-3 glass px-5 py-3 rounded-2xl border ${
            isBelowThreshold ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'
          }`}>
            <div>
              <p className="text-xs text-slate-400 font-medium">Overall Attendance</p>
              <h2 className={`text-2xl font-bold mt-0.5 ${isBelowThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overallPct.toFixed(1)}%
              </h2>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isBelowThreshold ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {isBelowThreshold ? <AlertTriangle className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
          </div>
        )}
      </div>

      {/* Add New Subject & Sync */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={addSubject} className="flex-1 glass rounded-2xl p-5 border border-ink-700/50 flex flex-col sm:flex-row gap-3">
          <input
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Enter subject name (e.g. Data Structures)..."
            className="flex-1 bg-ink-800 border border-ink-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={adding || !newSubjectName.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </form>

        <button
          type="button"
          onClick={syncFromTimetable}
          disabled={syncing}
          className="glass hover:bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 px-5 py-4 rounded-2xl flex items-center justify-center gap-2 font-medium transition-colors shrink-0"
        >
          {syncing ? (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CalendarCheck className="w-4 h-4" />
          )}
          Import from Timetable
        </button>
      </div>

      {/* Subject List Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-ink-700/50">
          <CalendarCheck className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No subjects added yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Get started by adding subjects manually above, or click **Import from Timetable** to pull subjects from your scanned schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const subPct = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
            const subBelowThreshold = subPct < 75 && sub.total > 0;
            
            // Calculate minimum classes required to achieve 75%
            let statusMessage = '';
            if (sub.total === 0) {
              statusMessage = 'No classes attended yet';
            } else if (subBelowThreshold) {
              const reqAttended = Math.ceil(0.75 * sub.total);
              const deficit = reqAttended - sub.attended;
              statusMessage = `Attend next ${deficit} class${deficit > 1 ? 'es' : ''} to reach 75%`;
            } else {
              // Calculate how many classes can be missed before falling below 75%
              const maxMissable = Math.floor((sub.attended - 0.75 * sub.total) / 0.75);
              statusMessage = maxMissable > 0 
                ? `You can miss next ${maxMissable} class${maxMissable > 1 ? 'es' : ''}`
                : 'Maintain perfect attendance to stay above 75%';
            }

            return (
              <div
                key={sub.id}
                className={`glass rounded-2xl p-5 border transition-all ${
                  subBelowThreshold ? 'border-rose-500/20 bg-rose-500/5' : 'border-ink-700/50 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight">{sub.subject}</h3>
                    <p className={`text-xs mt-1.5 font-medium ${
                      subBelowThreshold ? 'text-rose-400/80' : sub.total === 0 ? 'text-slate-500' : 'text-emerald-400/80'
                    }`}>
                      {statusMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSubject(sub.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-ink-800/50 transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Stats */}
                <div className="flex items-end justify-between mt-5">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Classes Attended</p>
                    <p className="text-xl font-bold text-white mt-0.5">
                      {sub.attended} <span className="text-sm font-medium text-slate-500">/ {sub.total}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Percentage</p>
                    <p className={`text-xl font-bold mt-0.5 ${
                      subBelowThreshold ? 'text-rose-400' : sub.total === 0 ? 'text-slate-400' : 'text-emerald-400'
                    }`}>
                      {sub.total > 0 ? `${subPct.toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-ink-800 rounded-full overflow-hidden mt-3.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      subBelowThreshold ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, subPct)}%` }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3.5 border-t border-ink-800/40">
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateAttendance(sub.id, 1, 1)}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-semibold rounded-lg transition-colors border border-emerald-500/20"
                    >
                      + Attended
                    </button>
                    {sub.attended > 0 && (
                      <button
                        onClick={() => updateAttendance(sub.id, -1, -1)}
                        className="px-2 py-2 bg-ink-800 hover:bg-ink-700 text-slate-400 rounded-lg transition-colors border border-ink-700"
                        title="Undo Attended"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => updateAttendance(sub.id, 0, 1)}
                      className="flex-1 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold rounded-lg transition-colors border border-rose-500/20"
                    >
                      + Missed
                    </button>
                    {sub.total > sub.attended && (
                      <button
                        onClick={() => updateAttendance(sub.id, 0, -1)}
                        className="px-2 py-2 bg-ink-800 hover:bg-ink-700 text-slate-400 rounded-lg transition-colors border border-ink-700"
                        title="Undo Missed"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
