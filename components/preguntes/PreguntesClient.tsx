'use client'

import { useState } from 'react'
import { MessageSquarePlus, Sparkles, Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Doc = {
  id: string
  titol: string
  resum?: string
  font: string
  classificacio: string
  data_deteccio: string
  tema_principal?: string
}

type Pregunta = {
  tema: string
  pregunta: string
  argumentari: string
}

const classifVariant = (c?: string) =>
  (c === 'URGENT' ? 'urgent' : c === 'IMPORTANT' ? 'important' : 'informatiu') as 'urgent' | 'important' | 'informatiu'

export default function PreguntesClient({ documents }: { documents: Doc[] }) {
  const [seleccionats, setSeleccionats] = useState<string[]>([])
  const [preguntes, setPreguntes] = useState<Pregunta[]>([])
  const [loading, setLoading] = useState(false)
  const [copiat, setCopiat] = useState<number | null>(null)
  const [cerca, setCerca] = useState('')

  const filtrats = documents.filter(d =>
    d.titol.toLowerCase().includes(cerca.toLowerCase()) ||
    d.tema_principal?.toLowerCase().includes(cerca.toLowerCase())
  )

  function toggleSeleccio(id: string) {
    setSeleccionats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function generarPreguntes() {
    if (seleccionats.length === 0) return
    setLoading(true)
    setPreguntes([])

    const docsSeleccionats = documents.filter(d => seleccionats.includes(d.id))

    try {
      const res = await fetch('/api/preguntes-ple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: docsSeleccionats }),
      })
      const data = await res.json()
      if (data.preguntes) setPreguntes(data.preguntes)
    } catch {
      console.error('Error generant preguntes')
    } finally {
      setLoading(false)
    }
  }

  async function copiar(text: string, idx: number) {
    await navigator.clipboard.writeText(text)
    setCopiat(idx)
    setTimeout(() => setCopiat(null), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna esquerra — selecció de documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Selecciona els temes ({seleccionats.length} seleccionats)
          </h2>
          {seleccionats.length > 0 && (
            <button
              onClick={() => setSeleccionats([])}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Desseleccionar tot
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Cercar documents..."
          value={cerca}
          onChange={e => setCerca(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {filtrats.map(doc => (
            <div
              key={doc.id}
              onClick={() => toggleSeleccio(doc.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                seleccionats.includes(doc.id)
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 transition-colors ${
                  seleccionats.includes(doc.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300'
                }`}>
                  {seleccionats.includes(doc.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant={classifVariant(doc.classificacio)}>{doc.classificacio}</Badge>
                    <span className="text-xs text-slate-400">{doc.font}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{doc.titol}</p>
                  {doc.resum && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{doc.resum}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={generarPreguntes}
          disabled={loading || seleccionats.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Generant preguntes...' : `Generar preguntes (${seleccionats.length})`}
        </button>
      </div>

      {/* Columna dreta — preguntes generades */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Preguntes generades</h2>

        {preguntes.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <MessageSquarePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Selecciona documents i clica "Generar preguntes"</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="flex gap-1 justify-center mb-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-slate-400 text-sm">Generant preguntes amb IA...</p>
          </div>
        )}

        {preguntes.map((p, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-600 mb-1">{p.tema}</div>
                <p className="text-sm font-medium text-slate-800 leading-snug">{p.pregunta}</p>
              </div>
              <button
                onClick={() => copiar(`${p.pregunta}\n\n${p.argumentari}`, i)}
                className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {copiat === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {p.argumentari && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 mb-1">Argumentari</div>
                <p className="text-xs text-slate-600 leading-relaxed">{p.argumentari}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
