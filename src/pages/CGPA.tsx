import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, TrendingUp, Award, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface SemesterSgpa {
  id: string;
  user_id: string;
  semester: string;
  sgpa: number;
  created_at: string;
}

export default function CGPA() {
  const { user } = useAuth();
  const [sgpas, setSgpas] = useState<SemesterSgpa[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [semesterInput, setSemesterInput] = useState('');
  const [sgpaInput, setSgpaInput] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSemester, setEditSemester] = useState('');
  const [editSgpa, setEditSgpa] = useState('');

  useEffect(() => {
    async function loadSgpa() {
      if (!user) return;
      const { data } = await supabase
        .from('semester_sgpa')
        .select('*')
        .eq('user_id', user.id)
        .order('semester', { ascending: true });
      setSgpas((data as SemesterSgpa[]) ?? []);
      setLoading(false);
    }
    loadSgpa();
  }, [user]);

  // Helper to sync overall average to student_metrics table
  async function syncOverallMetrics(currentSgpas: SemesterSgpa[]) {
    if (!user) return;
    const overallCgpa = currentSgpas.length > 0 
      ? currentSgpas.reduce((sum, s) => sum + Number(s.sgpa), 0) / currentSgpas.length 
      : null;

    await supabase
      .from('student_metrics')
      .upsert(
        { user_id: user.id, cgpa: overallCgpa, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }

  async function addSgpa(e: FormEvent) {
    e.preventDefault();
    const val = Number(sgpaInput);
    if (!user || !semesterInput.trim() || isNaN(val) || val < 0 || val > 10) return;
    
    setAdding(true);
    const { data: created } = await supabase
      .from('semester_sgpa')
      .insert({
        user_id: user.id,
        semester: semesterInput.trim(),
        sgpa: val,
      })
      .select('*')
      .maybeSingle();

    if (created) {
      const updatedList = [...sgpas, created as SemesterSgpa].sort((a, b) => a.semester.localeCompare(b.semester));
      setSgpas(updatedList);
      setSemesterInput('');
      setSgpaInput('');
      await syncOverallMetrics(updatedList);
    }
    setAdding(false);
  }

  async function saveEdit(id: string) {
    const val = Number(editSgpa);
    if (!editSemester.trim() || isNaN(val) || val < 0 || val > 10) return;

    const { data: updated } = await supabase
      .from('semester_sgpa')
      .update({ semester: editSemester.trim(), sgpa: val })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (updated) {
      const updatedList = sgpas.map((s) => (s.id === id ? (updated as SemesterSgpa) : s));
      setSgpas(updatedList);
      setEditingId(null);
      await syncOverallMetrics(updatedList);
    }
  }

  async function deleteSgpa(id: string) {
    const updated = sgpas.filter((s) => s.id !== id);
    setSgpas(updated);
    await supabase.from('semester_sgpa').delete().eq('id', id);
    await syncOverallMetrics(updated);
  }

  function startEdit(item: SemesterSgpa) {
    setEditingId(item.id);
    setEditSemester(item.semester);
    setEditSgpa(String(item.sgpa));
  }

  const overallCgpa = sgpas.length > 0 
    ? sgpas.reduce((sum, s) => sum + Number(s.sgpa), 0) / sgpas.length 
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-sky-400" /> CGPA Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Log your semester grades, view details, and track your overall academic progress.
          </p>
        </div>

        {/* Overall CGPA Badge */}
        {sgpas.length > 0 && (
          <div className="flex items-center gap-3 glass px-5 py-3 rounded-2xl border border-sky-500/30 bg-sky-500/5">
            <div>
              <p className="text-xs text-slate-400 font-medium">Cumulative CGPA</p>
              <h2 className="text-2xl font-bold mt-0.5 text-sky-400">
                {overallCgpa.toFixed(2)}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Form */}
        <div className="md:col-span-1 space-y-4">
          <form onSubmit={addSgpa} className="glass rounded-2xl p-5 border border-ink-700/50 space-y-4">
            <h3 className="text-base font-semibold text-white">Add Semester Grade</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Semester</label>
              <input
                value={semesterInput}
                onChange={(e) => setSemesterInput(e.target.value)}
                placeholder="e.g. Semester 1"
                className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SGPA</label>
              <input
                value={sgpaInput}
                onChange={(e) => setSgpaInput(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.75"
                className="w-full bg-ink-800 border border-ink-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={adding || !semesterInput.trim() || !sgpaInput}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </form>
        </div>

        {/* Right Side: Semester List / Chart */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sgpas.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-ink-700/50">
              <TrendingUp className="w-12 h-12 text-sky-500/40 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No grades logged yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Use the form on the left to start building your CGPA trajectory.
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-5 border border-ink-700/50 space-y-4">
              <h3 className="text-base font-semibold text-white">Semester Summary</h3>
              
              <div className="divide-y divide-ink-800/65">
                {sgpas.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    {editingId === item.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          value={editSemester}
                          onChange={(e) => setEditSemester(e.target.value)}
                          className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-sm text-white"
                          required
                        />
                        <input
                          value={editSgpa}
                          onChange={(e) => setEditSgpa(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          className="w-24 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-sm text-white"
                          required
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-ink-800 hover:bg-ink-700 text-slate-400 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-semibold text-white text-sm">{item.semester}</p>
                          <p className="text-xs text-slate-500 mt-0.5">GPA conversion metrics active</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3.5 py-1.5 rounded-lg text-sm font-bold">
                            {Number(item.sgpa).toFixed(2)}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-sky-400 rounded-lg hover:bg-ink-800/50 transition-colors"
                              title="Edit Record"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSgpa(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-ink-800/50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
