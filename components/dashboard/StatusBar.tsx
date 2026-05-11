'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SyncStatus {
  font: string
  estat: 'ok' | 'error' | 'desconegut'
  nous_docs: number
  created_at: string | null
}

const FONTS_ESPERADES = [
  'E-Tauler',
  'Perfil Contractant',
  'Junta de Govern',
  'BPM Decrets',
]

function minutsDesde(data: string | null): number {
  if (!data) return Infinity
  return Math.floor((Date.now() - new Date(data).getTime()) / 60000)
}

function formatTemps(minuts: number): string {
  if (minuts === Infinity) return 'mai sincronitzat'
  if (minuts < 60) return `fa ${minuts}m`
  if (minuts < 1440) return `fa ${Math.floor(minuts / 60)}h`
  return `fa ${Math.floor(minuts / 1440)}d`
}

function semaforo(estat: string, minuts: number): 'verd' | 'taronja' | 'vermell' {
  if (estat === 'error') return 'vermell'
  if (minuts > 2880) return 'vermell'   // +48h sense dades
  if (minuts > 1440) return 'taronja'   // +24h
  return 'verd'
}

const DOT_COLORS = {
  verd: 'bg-green-500',
  taronja: 'bg-orange-400',
  vermell: 'bg-red-500',
}

const TEXT_COLORS = {
  verd: 'text-green-700',
  taronja: 'text-orange-600',
  vermell: 'text-red-600',
}

export default function StatusBar() {
  const [statuses, setStatuses] = useState<SyncStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        // Intentar llegir de la vista darrera_sync
        const { data, error } = await supabase
          .from('darrera_sync')
          .select('font, estat, nous_docs, created_at')

        if (error) {
          // La vista pot no existir encara — mostrar estat desconegut
          setStatuses(FONTS_ESPERADES.map(font => ({
            font, estat: 'desconegut', nous_docs: 0, created_at: null,
          })))
          return
        }

        const mapa: Record<string, SyncStatus> = {}
        data?.forEach(row => { mapa[row.font] = row })

        setStatuses(
          FONTS_ESPERADES.map(font => mapa[font] || {
            font,
            estat: 'desconegut',
            nous_docs: 0,
            created_at: null,
          })
        )
      } finally {
        setLoading(false)
      }
    }

    load()
    // Refresc automàtic cada 5 minuts
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null

  const totVermells = statuses.filter(s =>
    semaforo(s.estat, minutsDesde(s.created_at)) === 'vermell'
  ).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Estat de les fonts</h3>
        {totVermells > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            {totVermells} amb error
          </span>
        )}
        {totVermells === 0 && statuses.some(s => s.estat === 'ok') && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Tot correcte
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map(s => {
          const minuts = minutsDesde(s.created_at)
          const color = semaforo(s.estat, minuts)

          return (
            <div key={s.font} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLORS[color]}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 leading-tight truncate">{s.font}</p>
                <p className={`text-xs ${TEXT_COLORS[color]}`}>
                  {s.estat === 'error' ? 'Error' : formatTemps(minuts)}
                </p>
                {s.nous_docs > 0 && (
                  <p className="text-xs text-slate-400">{s.nous_docs} nous</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
