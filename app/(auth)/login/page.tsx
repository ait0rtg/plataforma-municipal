'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const searchParams = useSearchParams()

  function addLog(msg: string) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLog([])

    try {
      addLog('Creant client Supabase...')
      const supabase = createClient()

      addLog(`Intentant login amb: ${email}`)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        addLog(`❌ Error Supabase: ${error.message} (status: ${error.status})`)
        setLoading(false)
        return
      }

      addLog(`✅ Login OK. User ID: ${data.user?.id}`)
      addLog(`Session expires: ${data.session?.expires_at}`)

      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      addLog(`Redirigint a: ${redirectTo}`)

      window.location.href = redirectTo

    } catch (err: any) {
      addLog(`❌ Excepció: ${err?.message || JSON.stringify(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
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

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Entrant...' : 'Entrar'}
      </button>

      {log.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono space-y-1">
          {log.map((line, i) => (
            <div key={i} className={line.includes('❌') ? 'text-red-400' : line.includes('✅') ? 'text-green-400' : 'text-slate-300'}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Inicia sessió</h2>
      <Suspense fallback={<div className="h-32 bg-slate-100 rounded-lg animate-pulse" />}>
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
