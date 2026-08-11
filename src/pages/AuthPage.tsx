import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = isSignup
      ? await signUp(email, password, fullName)
      : await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left brand panel */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-ink-950 transition-transform duration-700 ease-in-out transform ${isSignup ? 'lg:translate-x-full' : 'translate-x-0'}`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(52,122,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(93,157,255,0.3) 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold tracking-tight">StudentOS</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Your entire student life,<br />organized in one place.
            </h1>
            <p className="text-brand-100/80 text-lg leading-relaxed max-w-md">
              Track attendance, manage your CGPA, generate notes with AI, prep for placements, and build your career — all from a single dashboard.
            </p>
            <div className="flex gap-6 pt-4">
              <Stat value="10+" label="Tools" />
              <Stat value="AI" label="Powered" />
              <Stat value="100%" label="Yours" />
            </div>
          </div>
          <p className="text-brand-200/50 text-sm">Built for the modern student.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-12 bg-ink-950 transition-transform duration-700 ease-in-out transform ${isSignup ? 'lg:-translate-x-full' : 'translate-x-0'}`}>
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">StudentOS</span>
          </div>

          <h2 className="text-2xl font-semibold text-white tracking-tight">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-slate-400 mt-2">
            {isSignup ? 'Start managing your student life today.' : 'Sign in to continue to your dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {isSignup && (
              <Field
                icon={<User className="w-4 h-4" />}
                label="Full name"
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Alex Johnson"
                required
              />
            )}
            <Field
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@university.edu"
              required
            />
            <Field
              icon={<Lock className="w-4 h-4" />}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/20"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Read Google Client ID from environment variables and offer Google OAuth option */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-ink-950 px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    const res = await signInWithGoogle();
                    if (res?.error) setError(res.error);
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-ink-800 text-slate-200 font-medium py-3 rounded-xl transition-all duration-200 hover:border-ink-700"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
              </>
            )}
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            {isSignup ? (
              <>Already have an account?{' '}
                <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
              </>
            ) : (
              <>Don't have an account?{' '}
                <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">Sign up</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-brand-200/60">{label}</div>
    </div>
  );
}

function Field({
  icon, label, type, value, onChange, placeholder, required, minLength,
}: {
  icon: React.ReactNode; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean; minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full bg-ink-850 border border-ink-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
        />
      </div>
    </div>
  );
}
