'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credencials incorrectes. Comprova el teu email i contrasenya.')
      setLoading(false)
      return
    }

    const redirectTo = searchParams.get('redirectTo') || '/dashboard'
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="el-teu@email.com"
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contrasenya</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Entrant...' : 'Entrar'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Inicia sessió</h2>
      <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-10 bg-slate-100 rounded-lg"/><div className="h-10 bg-slate-100 rounded-lg"/><div className="h-10 bg-blue-100 rounded-lg"/></div>}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-slate-500 mt-4">
        No tens compte?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Sol·licita accés
        </Link>
      </p>
    </div>
  )
}
