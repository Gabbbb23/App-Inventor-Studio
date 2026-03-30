import { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { signIn, signUp } from '../lib/supabase';

export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConfirmMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const data = await signUp(email, password);
        if (data.user && !data.session) {
          setConfirmMsg('Check your email to confirm your account, then sign in.');
          setMode('signin');
        } else {
          onAuth(data.user);
          onClose();
        }
      } else {
        const data = await signIn(email, password);
        onAuth(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface-light)] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors">
            <X className="w-4 h-4 text-[var(--color-text-dim)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {confirmMsg && (
            <div className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg p-3">
              {confirmMsg}
            </div>
          )}
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-[var(--color-text-dim)] mb-1 block">Email <span className="opacity-60">— must be a real email you can access</span></label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--color-text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-10 pr-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="your.real.email@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-dim)] mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--color-text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-10 pr-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Password'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? (
              'Loading...'
            ) : mode === 'signin' ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-xs text-[var(--color-primary-light)] hover:underline"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
