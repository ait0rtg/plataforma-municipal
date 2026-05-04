'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ActualitzarButton() {
  const [loading, setLoading] = useState(false)
  const [resultat, setResultat] = useState<string | null>(null)

  async function handleActualitzar() {
    setLoading(true)
    setResultat(null)
    try {
      const res = await fetch('/api/scrapers', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResultat(`✓ ${data.nous || 0} documents nous`)
      } else {
        setResultat('Error en actualitzar')
      }
    } catch {
      setResultat('Error de connexió')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {resultat && <span className="text-xs text-slate-500">{resultat}</span>}
      <button
        onClick={handleActualitzar}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Actualitzant...' : 'Actualitzar'}
      </button>
    </div>
  )
}
