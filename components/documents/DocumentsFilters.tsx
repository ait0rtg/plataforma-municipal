'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { FONTS, TEMES } from '@/lib/constants'

export default function DocumentsFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [expanded, setExpanded] = useState(false)

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    router.push(`?${p.toString()}`)
  }, [params, router])

  function resetFilters() {
    router.push('/documents')
  }

  const activeFilters = ['classificacio', 'font', 'tema', 'estat', 'cerca', 'dataInici', 'dataFi']
    .filter(k => params.get(k))

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Fila principal: cerca + botó filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cercar per títol o resum..."
            defaultValue={params.get('cerca') || ''}
            onChange={e => update('cerca', e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
            expanded || activeFilters.length > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {activeFilters.length > 0 && (
            <span className="bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
              {activeFilters.length}
            </span>
          )}
        </button>

        {activeFilters.length > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Netejar
          </button>
        )}
      </div>

      {/* Filtres expandits */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
          <select
            onChange={e => update('classificacio', e.target.value)}
            value={params.get('classificacio') || ''}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Totes les urgències</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="IMPORTANT">🟠 Important</option>
            <option value="INFORMATIU">🟢 Informatiu</option>
          </select>

          <select
            onChange={e => update('font', e.target.value)}
            value={params.get('font') || ''}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Totes les fonts</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select
            onChange={e => update('tema', e.target.value)}
            value={params.get('tema') || ''}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tots els temes</option>
            {TEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            onChange={e => update('estat', e.target.value)}
            value={params.get('estat') || ''}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tots els estats</option>
            <option value="pendent">Pendent</option>
            <option value="en_curs">En curs</option>
            <option value="tancat">Tancat</option>
          </select>

          <select
            onChange={e => update('tipus', e.target.value)}
            value={params.get('tipus') || ''}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Tots els tipus</option>
            <option value="DECRET">Decret</option>
            <option value="ACORD">Acord</option>
            <option value="CONTRACTE">Contracte</option>
            <option value="ANUNCI">Anunci</option>
          </select>

          <div className="col-span-2 md:col-span-3 lg:col-span-2 flex gap-2">
            <input
              type="date"
              onChange={e => update('dataInici', e.target.value)}
              value={params.get('dataInici') || ''}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Data inici"
            />
            <input
              type="date"
              onChange={e => update('dataFi', e.target.value)}
              value={params.get('dataFi') || ''}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Data fi"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Import mínim €"
              onChange={e => update('importMin', e.target.value)}
              value={params.get('importMin') || ''}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Filtres actius com a pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeFilters.map(k => (
            <span key={k} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {k}: {params.get(k)}
              <button onClick={() => update(k, '')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
