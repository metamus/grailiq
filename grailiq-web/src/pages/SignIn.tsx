import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

/** Sign in / Sign up page using Supabase direct email/password auth */
export default function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        setError('Check your email to confirm your account!');
      }

      // Redirect on successful sign in
      if (mode === 'signin') {
        navigate('/app');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grailiq-dark px-4 relative">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-grailiq-purple/8 blur-[120px]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Grail<span className="text-grailiq-purple">IQ</span>
          </h1>
          <p className="text-gray-400 mt-2">Know what your grails are worth</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
          <CardBody className="p-6">
            {/* Mode Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-lg">
              <button
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-md font-medium text-sm transition-colors ${
                  mode === 'signin'
                    ? 'bg-white text-grailiq-purple shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-md font-medium text-sm transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-grailiq-purple shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />

              {/* Error message */}
              {error && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    error.includes('Check your email')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={!email || !password || isLoading}
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Info text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              {mode === 'signin'
                ? "Don't have an account? Click Sign Up above."
                : 'Already have an account? Click Sign In above.'}
            </p>
          </CardBody>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
