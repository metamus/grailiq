import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Lock, Loader2, Check, AlertCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

/** Dark, focused sign-in / sign-up / password reset for GrailIQ. */
export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate('/app');
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setError({
          type: 'success',
          msg: 'Check your email to confirm your account.',
        });
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/sign-in`,
        });
        if (err) throw err;
        setError({
          type: 'success',
          msg: "Check your email for a password reset link.",
        });
      }
    } catch (err) {
      setError({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Authentication failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setIsLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (err) throw err;
    } catch (err) {
      setError({
        type: 'error',
        msg: err instanceof Error ? err.message : 'OAuth failed',
      });
      setIsLoading(false);
    }
  };

  const tabs: { id: AuthMode; label: string }[] = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-grailiq-ink text-white px-4 relative">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-grailiq-purple/15 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[400px] rounded-full bg-grailiq-gold/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {mode === 'reset'
              ? 'Reset your password'
              : mode === 'signup'
              ? 'Create your account'
              : 'Welcome back'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-grailiq-dark p-6">
          {/* Mode tabs (hidden on reset mode) */}
          {mode !== 'reset' && (
            <div className="flex gap-1 mb-6 rounded-xl bg-white/5 p-1 border border-white/5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMode(t.id);
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                    mode === t.id
                      ? 'bg-grailiq-purple text-white shadow-lg shadow-grailiq-purple/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* OAuth */}
          {mode !== 'reset' && (
            <div className="space-y-2 mb-5">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.6-5.6A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.4-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.5 4.8C14.5 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.6-5.6A20 20 0 0 0 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2a12 12 0 0 1-18.5-5.5l-6.5 5A20 20 0 0 0 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12.1 12.1 0 0 1-4 5.5l6.2 5.2c-.4.4 6.5-4.7 6.5-14.7 0-1.3-.1-2.4-.4-3.5z"/>
                  </svg>
                </span>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white hover:border-white/20 hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.7 17.3c-.3.8-.8 1.5-1.2 2.2-.7 1-1.2 1.7-1.6 2-.5.6-1.1.9-1.7.9-.4 0-1-.1-1.7-.4-.7-.3-1.3-.4-1.9-.4-.6 0-1.3.1-2 .4-.7.3-1.3.4-1.7.4-.6 0-1.2-.3-1.8-.9-.3-.3-.9-1-1.6-2.1C3.7 18 3 16.4 2.5 14.8c-.5-1.7-.7-3.3-.7-4.9 0-1.8.4-3.4 1.2-4.8A7 7 0 0 1 9 2a5 5 0 0 1 1.8.4c.6.3 1 .3 1.1.3l.9-.3c.5-.2 1-.4 1.5-.5.7-.2 1.5-.3 2.2-.2a6 6 0 0 1 4.4 2.4c-2 1.2-3 2.8-3 4.9 0 1.7.6 3 1.7 4.1.6.5 1.2.9 1.8 1.1a13 13 0 0 1-1 2zM16.7 0c0 1.2-.5 2.3-1.4 3.4-1 1.2-2.3 1.9-3.7 1.8 0-.1 0-.3 0-.4 0-1.1.5-2.3 1.4-3.4A5.2 5.2 0 0 1 14.3.4a5 5 0 0 1 1.7-.4c0 0 0 0 0 0 0 0 0 0 0 0z"/>
                  </svg>
                </span>
                Continue with Apple
              </button>
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  or email
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </span>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-grailiq-purple/50 focus:bg-white/[0.05] focus:outline-none disabled:opacity-50"
                />
              </div>
            </label>

            {mode !== 'reset' && (
              <label className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setError(null);
                      }}
                      className="text-[10px] font-semibold normal-case tracking-normal text-grailiq-purple-light hover:text-white"
                    >
                      Forgot?
                    </button>
                  )}
                </span>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-grailiq-purple/50 focus:bg-white/[0.05] focus:outline-none disabled:opacity-50"
                  />
                </div>
              </label>
            )}

            {error && (
              <div
                className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  error.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-400/30 text-rose-300'
                }`}
              >
                {error.type === 'success' ? (
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{error.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || (mode !== 'reset' && !password)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:shadow-grailiq-purple/50 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                ? 'Create account'
                : 'Send reset link'}
            </button>
          </form>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="mt-4 w-full text-xs text-gray-400 hover:text-white transition-colors text-center"
            >
              ← Back to sign in
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
          By signing in you agree to our{' '}
          <Link to="/terms" className="text-gray-400 hover:text-white">Terms</Link> and{' '}
          <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
