'use client'

// components/auth-screen.tsx
// Login / Sign-up gate shown when no user session exists.
// Drop this into app/page.tsx: if (!user) return <AuthScreen />

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dumbbell, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'signup'

export function AuthScreen() {
  const [mode, setMode]         = useState<AuthMode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // After confirming email, user lands back on the app
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account, then come back to log in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // onAuthStateChange in app-context will pick up the new session automatically
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15">
          <Dumbbell className="h-8 w-8 text-orange-500" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Rise</h1>
          <p className="text-sm text-muted-foreground">Your AI-powered fitness coach</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Mode toggle */}
        <div className="flex rounded-xl bg-secondary/60 p-1">
          {(['login', 'signup'] as AuthMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors',
                mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-80 active:scale-[0.98]"
        >
          <Chrome className="h-4 w-4" />
          Continue with Google
        </button>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="mx-3 text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Email */}
        <div className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-500">{success}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={async () => {
              if (!email) { setError('Enter your email first'); return }
              setError(null)
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              })
              if (error) setError(error.message)
              else setSuccess('Password reset email sent.')
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        )}
      </div>

      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        By continuing you agree to Rise's Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}
