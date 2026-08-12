import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Loader2, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' | 'reset-password' }) {
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    resetPasswordForEmail, 
    updatePassword, 
    resendConfirmationEmail, 
    signOut,
    session 
  } = useAuth();
  
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password' | 'signup-confirm'>(mode);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setCurrentMode(mode);
    setError(null);
    setSuccessMessage(null);
    setDuplicateError(false);
  }, [mode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDuplicateError(false);
    setSubmitting(true);

    try {
      if (currentMode === 'signup') {
        const result = await signUp(email, password, fullName);
        if (result.error) {
          const errLower = result.error.toLowerCase();
          if (errLower.includes('email signups are disabled')) {
            setError("Email signups are disabled. Please log in to your Supabase Dashboard, navigate to Authentication -> Providers -> Email, and switch the 'Enable Email Signup' toggle ON.");
          } else if (errLower.includes('already registered') || errLower.includes('already exists')) {
            setDuplicateError(true);
          } else if (errLower.includes('error sending confirmation email')) {
            setError("We couldn't send your confirmation email right now. Please try again in a few minutes, or contact support if this persists.");
          } else {
            setError(result.error);
          }
        } else if (result.requiresConfirmation) {
          setCurrentMode('signup-confirm');
        } else {
          navigate('/');
        }
      } else if (currentMode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          navigate('/');
        }
      } else if (currentMode === 'forgot-password') {
        const result = await resetPasswordForEmail(email);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage("Password reset link sent! Check your inbox 📬 for a link to reset your password.");
        }
      } else if (currentMode === 'reset-password') {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setSubmitting(false);
          return;
        }
        const result = await updatePassword(password);
        if (result.error) {
          setError(result.error);
        } else {
          await signOut();
          setCurrentMode('login');
          setSuccessMessage("Password updated! You can now sign in with your new password.");
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    setResending(true);
    setError(null);
    setSuccessMessage(null);
    const result = await resendConfirmationEmail(email);
    setResending(false);
    if (result.error) {
      if (result.error.toLowerCase().includes('error sending confirmation email')) {
        setError("We couldn't send your confirmation email right now. Please try again in a few minutes, or contact support if this persists.");
      } else {
        setError(result.error);
      }
    } else {
      setSuccessMessage("Confirmation email resent successfully! Check your inbox.");
    }
  }

  const isSignup = currentMode === 'signup' || currentMode === 'signup-confirm';
  const hasRecoverySession = !!session;

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
            {currentMode === 'login' && 'Welcome back'}
            {currentMode === 'signup' && 'Create your account'}
            {currentMode === 'forgot-password' && 'Reset your password'}
            {currentMode === 'reset-password' && 'Set a new password'}
            {currentMode === 'signup-confirm' && 'Check your inbox 📬'}
          </h2>
          <p className="text-slate-400 mt-2">
            {currentMode === 'login' && 'Sign in to continue to your dashboard.'}
            {currentMode === 'signup' && 'Start managing your student life today.'}
            {currentMode === 'forgot-password' && "Enter your email address and we'll send you a link to reset your password."}
            {currentMode === 'reset-password' && 'Enter your new password below.'}
            {currentMode === 'signup-confirm' && "Confirm your email to activate your account."}
          </p>

          {currentMode === 'signup-confirm' && (
            <div className="mt-8 space-y-6 animate-fadeIn">
              <div className="flex items-start gap-3.5 text-sm text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 leading-relaxed">
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-brand-400" />
                <div>
                  We've sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account, then come back and sign in.
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 animate-fade-in" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resend confirmation email"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-ink-800 text-slate-200 font-medium py-3 rounded-xl transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {currentMode === 'reset-password' && !hasRecoverySession && (
            <div className="mt-8 space-y-6 animate-fadeIn">
              <div className="flex items-start gap-3.5 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 leading-relaxed">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
                <div>
                  No active password reset session. Your password reset link may have expired or is invalid.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentMode('forgot-password');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                Request a new reset link
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-ink-800 text-slate-200 font-medium py-3 rounded-xl transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {currentMode !== 'signup-confirm' && (currentMode !== 'reset-password' || hasRecoverySession) && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {currentMode === 'signup' && (
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

              {(currentMode === 'login' || currentMode === 'signup' || currentMode === 'forgot-password') && (
                <Field
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@university.edu"
                  required
                />
              )}

              {(currentMode === 'login' || currentMode === 'signup') && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    {currentMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentMode('forgot-password');
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Field
                    icon={<Lock className="w-4 h-4" />}
                    noLabel
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              )}

              {currentMode === 'reset-password' && (
                <>
                  <Field
                    icon={<Lock className="w-4 h-4" />}
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <Field
                    icon={<Lock className="w-4 h-4" />}
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {duplicateError && (
                <div className="flex flex-col gap-3 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>An account with this email already exists. Try signing in instead, or reset your password if you've forgotten it.</span>
                  </div>
                  <div className="flex gap-4 mt-1 border-t border-rose-500/10 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMode('login');
                        setDuplicateError(false);
                        setError(null);
                      }}
                      className="text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMode('forgot-password');
                        setDuplicateError(false);
                        setError(null);
                      }}
                      className="text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
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
                    {currentMode === 'login' && 'Sign in'}
                    {currentMode === 'signup' && 'Create account'}
                    {currentMode === 'forgot-password' && 'Send Reset Link'}
                    {currentMode === 'reset-password' && 'Update Password'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Read Google Client ID from environment variables and offer Google OAuth option */}
              {currentMode !== 'forgot-password' && currentMode !== 'reset-password' && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
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
                      setSuccessMessage(null);
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
          )}

          {currentMode !== 'signup-confirm' && (currentMode !== 'reset-password' || hasRecoverySession) && (
            <p className="text-center text-sm text-slate-400 mt-6">
              {currentMode === 'signup' && (
                <>Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMode('login');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
              {currentMode === 'login' && (
                <>Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMode('signup');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
              {currentMode === 'forgot-password' && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMode('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
              )}
            </p>
          )}
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
  icon, label, type, value, onChange, placeholder, required, minLength, noLabel
}: {
  icon: React.ReactNode; label?: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean; minLength?: number;
  noLabel?: boolean;
}) {
  return (
    <div>
      {!noLabel && label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
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
