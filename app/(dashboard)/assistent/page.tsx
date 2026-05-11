'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, FileText, AlertTriangle, HelpCircle, Zap, Download, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface AssistentResult {
  resum_executiu: string
  antecedents: string
  acords_vigents: string
  imports_contractes: string
  vulnerabilitats: string
  preguntes_suggerides: string[]
  documents_font: { titol: string; url: string; data?: string; font?: string }[]
  alertes?: string[]
  _meta?: {
    documents_consultats: number
    fonts_consultades: string[]
    data_consulta: string
  }
}

interface HistorialItem {
  role: 'user' | 'assistant'
  content: string
  result?: AssistentResult
  consulta?: string
}

const EXEMPLES = [
  "Quins antecedents hi ha sobre la contracta de neteja viaria?",
  "Tot el que saps sobre les ordenances de terrasses i veladors",
  "Historial complet de contractes de jardineria municipal",
  "Acords i decisions sobre l'habitatge turístic al municipi",
  "Quines licitacions estan actives o han vençut recentment?",
  "Documents urgents dels últims 30 dies",
]

function SeccioPlegable({ titol, icona, contingut, colorClass = '' }: {
  titol: string
  icona: React.ReactNode
  contingut: string
  colorClass?: string
}) {
  const [obert, setObert] = useState(true)
  const [copiat, setCopiat] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(contingut)
    setCopiat(true)
    setTimeout(() => setCopiat(false), 2000)
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${colorClass}`}>
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50"
        onClick={() => setObert(!obert)}
      >
        <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
          {icona}
          {titol}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); copiar() }}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            title="Copiar"
          >
            {copiat ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {obert ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {obert && (
        <div className="px-5 pb-4 border-t border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pt-3">{contingut}</p>
        </div>
      )}
    </div>
  )
}

function exportarPDF(result: AssistentResult, consulta: string) {
  const contingut = `INFORME DE PREPARACIÓ — MONITOR POLÍTIC MUNICIPAL
Castell-Platja d'Aro | ${new Date().toLocaleDateString('ca-ES')}

CONSULTA: ${consulta}
${'═'.repeat(60)}

RESUM EXECUTIU
${result.resum_executiu}

ANTECEDENTS I HISTORIAL
${result.antecedents}

ACORDS VIGENTS
${result.acords_vigents}

IMPORTS I CONTRACTES
${result.imports_contractes}

VULNERABILITATS DEL GOVERN
${result.vulnerabilitats}

PREGUNTES SUGGERIDES PER AL PLE
${result.preguntes_suggerides?.map((q, i) => `${i + 1}. ${q}`).join('\n')}

${result.alertes?.length ? `ALERTES URGENTS\n${result.alertes.map(a => `⚠️ ${a}`).join('\n')}\n` : ''}
DOCUMENTS CONSULTATS (${result.documents_font?.length || 0})
${result.documents_font?.map(d => `• ${d.titol} (${d.data || 'N/D'}) — ${d.url}`).join('\n')}

${'─'.repeat(60)}
Generat per Monitor Polític Municipal | ${new Date().toISOString()}
`

  const blob = new Blob([contingut], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informe-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Informe descarregat')
}

export default function AssistentPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssistentResult | null>(null)
  const [consultaActual, setConsultaActual] = useState('')
  const [idioma, setIdioma] = useState<'ca' | 'es'>('ca')
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  async function handleQuery(q?: string) {
    const pregunta = q || query
    if (!pregunta.trim()) return

    setLoading(true)
    setResult(null)
    setConsultaActual(pregunta)

    try {
      const res = await fetch('/api/assistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta: pregunta,
          idioma,
          historial: historial.slice(-4).map(h => ({
            role: h.role,
            content: h.role === 'user' ? h.consulta || h.content : h.content,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Error ${res.status}`)
      }

      const data: AssistentResult = await res.json()
      if (data.error) throw new Error((data as any).error)

      setResult(data)
      setHistorial(prev => [
        ...prev,
        { role: 'user', content: pregunta, consulta: pregunta },
        { role: 'assistant', content: data.resum_executiu, result: data },
      ])

      // Scroll suau al resultat
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

    } catch (err: any) {
      toast.error(err.message || 'Error en la consulta. Torna-ho a intentar.')
    } finally {
      setLoading(false)
      setQuery('')
    }
  }

  function novaConsulta() {
    setResult(null)
    setConsultaActual('')
    setQuery('')
  }

  function nettajarHistorial() {
    setHistorial([])
    novaConsulta()
    toast.success('Historial netejat')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Capçalera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Assistent de Preparació
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pregunta en llenguatge natural. Cerco a tota la base de dades i genero un informe complet.
          </p>
        </div>
        {historial.length > 0 && (
          <button
            onClick={nettajarHistorial}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nova sessió
          </button>
        )}
      </div>

      {/* Historial de consultes anteriors */}
      {historial.length > 2 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Consultes d'aquesta sessió</p>
          <div className="flex flex-wrap gap-2">
            {historial
              .filter(h => h.role === 'user')
              .map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleQuery(h.consulta)}
                  className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors truncate max-w-[200px]"
                  title={h.consulta}
                >
                  {h.consulta?.slice(0, 35)}{(h.consulta?.length || 0) > 35 ? '...' : ''}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Caixa de consulta */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex gap-2 mb-3">
          {(['ca', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setIdioma(lang)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                idioma === lang ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {lang === 'ca' ? 'Català' : 'Castellà'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleQuery()}
              placeholder="Exemple: 'Tot el que hi ha sobre la contracta de neteja viaria'"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analitzant...
              </span>
            ) : 'Consultar'}
          </button>
        </div>
      </div>

      {/* Exemples */}
      {!result && !loading && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Exemples de consultes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXEMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setQuery(ex); handleQuery(ex) }}
                className="text-left px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carregant */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Consultant la base de dades municipal...</p>
          <p className="text-xs text-slate-400 mt-1">Cercant documents rellevants i generant l'informe</p>
        </div>
      )}

      {/* Resultat */}
      {result && (
        <div ref={resultRef} className="space-y-4">

          {/* Alertes urgents */}
          {result.alertes && result.alertes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes urgents
              </h3>
              <ul className="space-y-1">
                {result.alertes.map((a, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resum executiu */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Resum executiu</h3>
              <div className="flex items-center gap-2">
                {result._meta && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {result._meta.documents_consultats} docs · {result._meta.fonts_consultades.join(', ')}
                  </span>
                )}
                <button
                  onClick={() => exportarPDF(result!, consultaActual)}
                  className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 px-2 py-1 hover:bg-blue-100 rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar
                </button>
              </div>
            </div>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{result.resum_executiu}</p>
          </div>

          {/* Seccions plegables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SeccioPlegable
              titol="Antecedents i historial"
              icona={<FileText className="w-4 h-4 text-slate-400" />}
              contingut={result.antecedents}
            />
            <SeccioPlegable
              titol="Acords vigents"
              icona={<FileText className="w-4 h-4 text-green-500" />}
              contingut={result.acords_vigents}
            />
            <SeccioPlegable
              titol="Imports i contractes"
              icona={<FileText className="w-4 h-4 text-orange-400" />}
              contingut={result.imports_contractes}
            />
            <SeccioPlegable
              titol="Vulnerabilitats del govern"
              icona={<AlertTriangle className="w-4 h-4 text-orange-500" />}
              contingut={result.vulnerabilitats}
              colorClass="border-orange-200 bg-orange-50/30"
            />
          </div>

          {/* Preguntes suggerides */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              Preguntes suggerides per al ple
            </h3>
            <ol className="space-y-3">
              {result.preguntes_suggerides?.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-bold text-blue-600 min-w-[24px] text-sm">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">{q}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(q); toast.success('Pregunta copiada') }}
                      className="text-xs text-slate-400 hover:text-slate-600 mt-1 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Documents font */}
          {result.documents_font?.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wide mb-3">
                Documents consultats ({result.documents_font.length})
              </h3>
              <ul className="space-y-2">
                {result.documents_font.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium truncate block">
                          {doc.titol}
                        </a>
                      ) : (
                        <span className="text-slate-600 font-medium">{doc.titol}</span>
                      )}
                      <span className="text-slate-400">
                        {doc.font && `${doc.font} · `}{doc.data}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botó nova consulta */}
          <div className="flex gap-3">
            <button
              onClick={novaConsulta}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Nova consulta
            </button>
            <button
              onClick={() => exportarPDF(result!, consultaActual)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              <Download className="w-4 h-4" />
              Descarregar informe
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
