'use client'

import { useState } from 'react'
import { MessageSquarePlus, Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Scale, Users, Lightbulb } from 'lucide-react'
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
  deteccio_problema: string
  verificacio_normativa: string
  impacte_general: string
  proposta_millora: string
  argumentari: string
}

const classifVariant = (c?: string) =>
  (c === 'URGENT' ? 'urgent' : c === 'IMPORTANT' ? 'important' : 'informatiu') as 'urgent' | 'important' | 'informatiu'

function PreguntaCard({ p, idx, copiat, onCopiar }: {
  p: Pregunta
  idx: number
  copiat: number | null
  onCopiar: (text: string, idx: number) => void
}) {
  const [expandit, setExpandit] = useState(false)

  const textComplet = [
    'PREGUNTA AL PLE:',
    p.pregunta,
    '',
    'ARGUMENTARI:',
    p.argumentari,
    '',
    'PROBLEMA DETECTAT:',
    p.deteccio_problema,
    '',
    'FONAMENTACIÓ NORMATIVA:',
    p.verificacio_normativa,
    '',
    'IMPACTE PER ALS VEÏNS:',
    p.impacte_general,
    '',
    'PROPOSTA DE MILLORA:',
    p.proposta_millora,
  ].join('\n')

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{p.tema}</div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{p.pregunta}</p>
          </div>
          <button
            onClick={() => onCopiar(textComplet, idx)}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Copiar tot"
          >
            {copiat === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3">
          <div className="text-xs font-semibold text-indigo-600 mb-1">Argumentari per al Ple</div>
          <p className="text-xs text-indigo-900 leading-relaxed">{p.argumentari}</p>
        </div>

        <button
          onClick={() => setExpandit(!expandit)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expandit ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expandit ? 'Amagar metodologia' : 'Veure metodologia completa'}
        </button>
      </div>

      {expandit && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          <div className="p-4 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">1. Detecció del problema</div>
              <p className="text-xs text-slate-700 leading-relaxed">{p.deteccio_problema}</p>
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">2. Verificació normativa</div>
              <p className="text-xs text-slate-700 leading-relaxed">{p.verificacio_normativa}</p>
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">3. Impacte general</div>
              <p className="text-xs text-slate-700 leading-relaxed">{p.impacte_general}</p>
            </div>
          </div>
          <div className="p-4 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">4. Proposta de millora</div>
              <p className="text-xs text-slate-700 leading-relaxed">{p.proposta_millora}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Selecciona els temes ({seleccionats.length} seleccionats)
          </h2>
          {seleccionats.length > 0 && (
            <button onClick={() => setSeleccionats([])} className="text-xs text-slate-400 hover:text-slate-600">
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
              className={'p-3 rounded-xl border cursor-pointer transition-all ' + (
                seleccionats.includes(doc.id)
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={'w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 transition-colors ' + (
                  seleccionats.includes(doc.id) ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                )}>
                  {seleccionats.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
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
          {loading ? 'Generant preguntes...' : 'Generar preguntes (' + seleccionats.length + ')'}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Preguntes generades</h2>

        {preguntes.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <MessageSquarePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Selecciona documents i clica &quot;Generar preguntes&quot;</p>
            <p className="text-xs text-slate-300 mt-1">Metodologia: Detecció → Verificació → Impacte → Proposta</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="flex gap-1 justify-center mb-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-slate-400 text-sm">Elaborant preguntes amb metodologia estructurada...</p>
          </div>
        )}

        <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
          {preguntes.map((p, i) => (
            <PreguntaCard key={i} p={p} idx={i} copiat={copiat} onCopiar={copiar} />
          ))}
        </div>
      </div>
    </div>
  )
}
