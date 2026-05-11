'use client'

import { useState, useMemo } from 'react'
import { Search, Calendar, FileText, Target, ExternalLink, Brain } from 'lucide-react'
import { formatData, formatImport } from '@/lib/utils'

type Doc = {
  id: string; titol: string; resum?: string; font: string
  classificacio: string; data_deteccio: string; tema_principal?: string
  import_detectat?: number; url_original: string
}
type Compromis = {
  id: string; titol: string; descripcio?: string; data_compromis: string
  termini_anunciat?: string; estat: string; tema?: string
}

const CLASSIF_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  IMPORTANT: 'bg-orange-100 text-orange-700 border-orange-200',
  INFORMATIU: 'bg-green-100 text-green-700 border-green-200',
}

const ESTAT_COLORS: Record<string, string> = {
  pendent: 'bg-yellow-100 text-yellow-700',
  en_curs: 'bg-blue-100 text-blue-700',
  complet: 'bg-green-100 text-green-700',
  incomplert: 'bg-red-100 text-red-700',
  abandonat: 'bg-slate-100 text-slate-500',
}

const TEMES_SUGGERTS = [
  'urbanisme', 'contractació', 'neteja', 'jardineria',
  'habitatge turístic', 'pressupost', 'personal', 'serveis'
]

export default function MemoriaClient({ documents, compromisos }: { documents: Doc[]; compromisos: Compromis[] }) {
  const [cerca, setCerca] = useState('')
  const [temaActiu, setTemaActiu] = useState('')
  const [loading, setLoading] = useState(false)
  const [iaAnalisi, setIaAnalisi] = useState('')

  const query = temaActiu || cerca

  const docsFiltrats = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return documents
      .filter(d =>
        d.titol?.toLowerCase().includes(q) ||
        d.resum?.toLowerCase().includes(q) ||
        d.tema_principal?.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.data_deteccio).getTime() - new Date(a.data_deteccio).getTime())
  }, [query, documents])

  const compromisosFiltrats = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return compromisos.filter(c =>
      c.titol?.toLowerCase().includes(q) ||
      c.descripcio?.toLowerCase().includes(q) ||
      c.tema?.toLowerCase().includes(q)
    )
  }, [query, compromisos])

  // Combinar i ordenar cronològicament
  const linia = useMemo(() => {
    const items: { data: string; tipus: 'doc' | 'compromis'; item: Doc | Compromis }[] = [
      ...docsFiltrats.map(d => ({ data: d.data_deteccio, tipus: 'doc' as const, item: d })),
      ...compromisosFiltrats.map(c => ({ data: c.data_compromis, tipus: 'compromis' as const, item: c })),
    ]
    return items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [docsFiltrats, compromisosFiltrats])

  async function analitzarIa() {
    if (!query || linia.length === 0) return
    setLoading(true)
    setIaAnalisi('')

    try {
      const res = await fetch('/api/memoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: query,
          documents: docsFiltrats.slice(0, 10),
          compromisos: compromisosFiltrats,
        }),
      })
      const data = await res.json()
      setIaAnalisi(data.analisi || '')
    } catch {
      setIaAnalisi('Error en l\'anàlisi. Torna-ho a intentar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Cerca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={cerca}
            onChange={e => { setCerca(e.target.value); setTemaActiu(''); setIaAnalisi('') }}
            placeholder="Cerca un tema: neteja, Can Bas, urbanisme, habitatge turístic..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMES_SUGGERTS.map(t => (
            <button key={t} onClick={() => { setTemaActiu(t); setCerca(''); setIaAnalisi('') }}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                temaActiu === t
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-blue-50'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resultats */}
      {query && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-700">{linia.length}</strong> registres sobre "{query}"
              {docsFiltrats.length > 0 && ` · ${docsFiltrats.length} documents`}
              {compromisosFiltrats.length > 0 && ` · ${compromisosFiltrats.length} compromisos`}
            </p>
            {linia.length > 0 && (
              <button
                onClick={analitzarIa}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Brain className="w-3.5 h-3.5" />
                {loading ? 'Analitzant...' : 'Anàlisi IA'}
              </button>
            )}
          </div>

          {/* Anàlisi IA */}
          {iaAnalisi && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4" />
                Síntesi política sobre "{query}"
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{iaAnalisi}</p>
            </div>
          )}

          {/* Línia del temps */}
          {linia.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <p className="text-slate-400 text-sm">Cap resultat per a "{query}"</p>
            </div>
          ) : (
            <div className="relative">
              {/* Línia vertical */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="space-y-3">
                {linia.map((entry, i) => {
                  if (entry.tipus === 'doc') {
                    const d = entry.item as Doc
                    return (
                      <div key={`doc-${d.id}`} className="flex gap-4 pl-12 relative">
                        <div className="absolute left-3.5 top-3 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CLASSIF_COLORS[d.classificacio] || ''}`}>
                                {d.classificacio}
                              </span>
                              <span className="text-xs text-slate-400">{d.font}</span>
                              {d.tema_principal && (
                                <span className="text-xs text-slate-400">· {d.tema_principal}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatData(d.data_deteccio)}
                              </span>
                              <a href={d.url_original} target="_blank" rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-600" onClick={e => e.stopPropagation()}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-slate-800 leading-snug">{d.titol}</p>
                          {d.resum && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{d.resum}</p>
                          )}
                          {d.import_detectat && (
                            <p className="text-xs font-medium text-blue-600 mt-1.5">
                              💰 {formatImport(d.import_detectat)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  } else {
                    const c = entry.item as Compromis
                    return (
                      <div key={`comp-${c.id}`} className="flex gap-4 pl-12 relative">
                        <div className="absolute left-3.5 top-3 w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm" />
                        <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Target className="w-3.5 h-3.5 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700">Compromís</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTAT_COLORS[c.estat] || ''}`}>
                                {c.estat}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">{formatData(c.data_compromis)}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800">{c.titol}</p>
                          {c.descripcio && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.descripcio}</p>
                          )}
                          {c.termini_anunciat && (
                            <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Termini: {formatData(c.termini_anunciat)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Cerca un tema per veure la seva línia del temps</p>
          <p className="text-slate-400 text-sm mt-1">
            Combina documents, decrets, contractes i compromisos en una sola vista cronològica
          </p>
        </div>
      )}
    </div>
  )
}
