import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({
  title, description, icon, accent = 'brand',
}: {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: 'brand' | 'emerald' | 'amber' | 'violet' | 'rose' | 'sky';
}) {
  const accents: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-700/5 text-brand-400 border-brand-500/20',
    emerald: 'from-emerald-500/20 to-emerald-700/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-700/5 text-amber-400 border-amber-500/20',
    violet: 'from-violet-500/20 to-violet-700/5 text-violet-400 border-violet-500/20',
    rose: 'from-rose-500/20 to-rose-700/5 text-rose-400 border-rose-500/20',
    sky: 'from-sky-500/20 to-sky-700/5 text-sky-400 border-sky-500/20',
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="glass rounded-2xl p-8 lg:p-12 text-center">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${accents[accent]} border flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">{description}</p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-ink-800/60 border border-ink-700 text-sm text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />
          Coming soon
        </div>
      </div>
    </div>
  );
}
