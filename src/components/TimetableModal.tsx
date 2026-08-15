import { useEffect, useState, type FormEvent } from 'react';
import { X, Loader2, Clock, MapPin, BookOpen, Palette } from 'lucide-react';
import type { TimetableEntry } from '../lib/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLORS = [
  { id: 'sky', label: 'Sky', class: 'bg-sky-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
];

export interface TimetableFormState {
  day: string;
  subject: string;
  start_time: string;
  end_time: string;
  room: string;
  color: string;
}

const emptyForm: TimetableFormState = {
  day: 'Monday',
  subject: '',
  start_time: '09:00',
  end_time: '10:30',
  room: '',
  color: 'sky',
};

export default function TimetableModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TimetableFormState, id?: string) => Promise<void>;
  editing: TimetableEntry | null;
}) {
  const [form, setForm] = useState<TimetableFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        day: editing.day,
        subject: editing.subject,
        start_time: editing.start_time,
        end_time: editing.end_time,
        room: editing.room ?? '',
        color: editing.color,
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [editing, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.subject.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    await onSave(form, editing?.id);
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold dark:text-white text-slate-900">
            {editing ? 'Edit Class' : 'Add Class'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-ink-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Day</label>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, day: d }))}
                  className={`text-xs font-medium py-2 rounded-lg transition-all ${
                    form.day === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-800 text-slate-400 hover:bg-ink-700'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Data Structures"
                autoFocus
                className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Start time</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-11 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">End time</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-11 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Room / Code</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                placeholder="e.g. CS-201"
                className="w-full bg-ink-800 border border-ink-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-1.5">
              <Palette className="w-3.5 h-3.5" /> Color tag
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.id }))}
                  className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                    form.color === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-850 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-slate-300 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-medium text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? 'Save changes' : 'Add class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
