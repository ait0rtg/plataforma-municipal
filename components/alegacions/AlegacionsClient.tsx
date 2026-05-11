'use client'

import { useState } from 'react'
import { FileEdit, Copy, Check, Download, Search, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatData, formatImport } from '@/lib/utils'

type Doc = {
  id: string; titol: string; resum?: string; font: string
  classificacio: string; data_deteccio: string; tema_principal?: string
  import_detectat?: number; url_original: string; per_a_l_oposicio?: string
}

type TipusDocument = 'intervencio' | 'pregunta_escrita' | 'alegacio' | 'moció'

const TIPUS_OPTIONS: { value: TipusDocument; label: string; desc: string }[] = [
  { value: 'intervencio', label: 'Intervenció al ple', desc: 'Discurs oral estructurat per al plenari' },
  { value: 'pregunta_escrita', label: 'Pregunta escrita', desc: 'Pregunta formal per escrit amb termini de resposta' },
  { value: 'alegacio', label: 'Al·legació', desc: 'Escrit formal d\'oposició a una decisió municipal' },
  { value: 'moció', label: 'Moció', desc: 'Proposta per a debat i votació al ple' },
]

const CLASSIF_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  IMPORTANT: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function AlegacionsClient({ documents }: { documents: Doc[] }) {
  const [cerca, setCerca] = useState('')
  const [docSeleccionat, setDocSeleccionat] = useState<Doc | null>(null)
  const [tipus, setTipus] = useState<TipusDocument>('intervencio')
  const [instruccions, setInstruccions] = useState('')
  const [resultat, setResultat] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiat, setCopiat] = useState(false)

  const docsFiltrats = documents.filter(d =>
    !cerca ||
    d.titol?.toLowerCase().includes(cerca.toLowerCase()) ||
    d.tema_principal?.toLowerCase().includes(cerca.toLowerCase())
  )

  async function generar() {
    if (!docSeleccionat) return
    setLoading(true)
    setResultat('')

    try {
      const res = await fetch('/api/alegacions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: docSeleccionat, tipus, instruccions }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResultat(data.text || '')
    } catch (err: any) {
      toast.error(err.message || 'Error generant el document')
    } finally {
      setLoading(false)
    }
  }

  function copiar() {
    navigator.clipboard.writeText(resultat)
    setCopiat(true)
    setTimeout(() => setCopiat(false), 2000)
    toast.success('Text copiat')
  }

  function descarregar() {
    const blob = new Blob([resultat], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tipus}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Columna esquerra: selecció de document */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">1. Selecciona el document</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={cerca}
              onChange={e => setCerca(e.target.value)}
              placeholder="Cercar document..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {docsFiltrats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Cap document trobat</p>
            ) : (
              docsFiltrats.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDocSeleccionat(d); setResultat('') }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    docSeleccionat?.id === d.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${CLASSIF_COLORS[d.classificacio] || ''}`}>
                      {d.classificacio}
                    </span>
                    <span className="text-xs text-slate-400">{formatData(d.data_deteccio)}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">{d.titol}</p>
                  {d.import_detectat && (
                    <p className="text-xs text-blue-600 mt-1">💰 {formatImport(d.import_detectat)}</p>
                  )}
                  {d.per_a_l_oposicio && (
                    <p className="text-xs text-orange-600 mt-1 line-clamp-1">⚡ {d.per_a_l_oposicio}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tipus de document */}
        {docSeleccionat && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">2. Tipus de document</h3>
            <div className="space-y-2">
              {TIPUS_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTipus(t.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                    tipus === t.value
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{t.label}</span>
                    {tipus === t.value && <ChevronRight className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Instruccions addicionals (opcional)
              </label>
              <textarea
                value={instruccions}
                onChange={e => setInstruccions(e.target.value)}
                placeholder="Ex: Emfatitza la manca de transparència. Menciona el precedent de 2023. Tona enèrgic."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={generar}
              disabled={loading}
              className="w-full mt-3 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FileEdit className="w-4 h-4" />
              {loading ? 'Generant...' : 'Generar esborrany'}
            </button>
          </div>
        )}
      </div>

      {/* Columna dreta: resultat */}
      <div>
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-600">Generant l'esborrany...</p>
          </div>
        )}

        {!loading && !resultat && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center">
            <FileEdit className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">
              {docSeleccionat
                ? 'Selecciona el tipus de document i prem "Generar"'
                : 'Selecciona un document per generar l\'esborrany'}
            </p>
          </div>
        )}

        {!loading && resultat && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">
                {TIPUS_OPTIONS.find(t => t.value === tipus)?.label}
              </span>
              <div className="flex gap-2">
                <button onClick={copiar}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-white rounded">
                  {copiat ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiat ? 'Copiat' : 'Copiar'}
                </button>
                <button onClick={descarregar}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 hover:bg-white rounded">
                  <Download className="w-3.5 h-3.5" />
                  Descarregar
                </button>
              </div>
            </div>
            <textarea
              value={resultat}
              onChange={e => setResultat(e.target.value)}
              className="w-full p-5 text-sm text-slate-700 leading-relaxed focus:outline-none resize-none min-h-[500px]"
            />
          </div>
        )}
      </div>
    </div>
  )
}
