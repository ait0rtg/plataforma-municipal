'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileEdit,
  FileText,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import AssessorClient from '@/components/assessor/AssessorClient'
import MemoriaClient from '@/components/memoria/MemoriaClient'
import AlegacionsClient from '@/components/alegacions/AlegacionsClient'

type Tab = 'assistent' | 'assessor' | 'memoria' | 'alegacions'

type AssistentResult = {
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

const EXEMPLES = [
  'Quins antecedents hi ha sobre la contracta de neteja viària?',
  'Tot el que saps sobre les ordenances de terrasses i veladors',
  'Historial complet de contractes de jardineria municipal',
  "Acords i decisions sobre l'habitatge turístic al municipi",
  'Quines licitacions estan actives o han vençut recentment?',
  'Documents urgents dels últims 30 dies',
]

function SeccioPlegable({
  titol,
  icona,
  contingut,
  colorClass = '',
}: {
  titol: string
  icona: React.ReactNode
  contingut: string
  colorClass?: string
}) {
  const [obert, setObert] = useState(true)
  const [copiat, setCopiat] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(contingut || '')
    setCopiat(true)
    setTimeout(() => setCopiat(false), 1600)
    toast.success('Text copiat')
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
            onClick={e => {
              e.stopPropagation()
              copiar()
            }}
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
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pt-3">
            {contingut || 'Sense informació disponible.'}
          </p>
        </div>
      )}
    </div>
  )
}

function descarregarInforme(result: AssistentResult, consulta: string) {
  const contingut = `INFORME DE PREPARACIÓ - MONITOR POLÍTIC MUNICIPAL
Castell-Platja d'Aro | ${new Date().toLocaleDateString('ca-ES')}

CONSULTA: ${consulta}
============================================================

RESUM EXECUTIU
${result.resum_executiu || ''}

ANTECEDENTS I HISTORIAL
${result.antecedents || ''}

ACORDS VIGENTS
${result.acords_vigents || ''}

IMPORTS I CONTRACTES
${result.imports_contractes || ''}

VULNERABILITATS DEL GOVERN
${result.vulnerabilitats || ''}

PREGUNTES SUGGERIDES PER AL PLE
${result.preguntes_suggerides?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}

DOCUMENTS CONSULTATS
${result.documents_font?.map(d => `- ${d.titol} (${d.data || 'N/D'}) ${d.url || ''}`).join('\n') || ''}

Generat per Monitor Polític Municipal | ${new Date().toISOString()}
`

  const blob = new Blob([contingut], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informe-ia-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Informe descarregat')
}

function AssistentPreparacio() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssistentResult | null>(null)
  const [consultaActual, setConsultaActual] = useState('')
  const [idioma, setIdioma] = useState<'ca' | 'es'>('ca')
  const [historial, setHistorial] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  async function handleQuery(q?: string) {
    const consulta = q || query
    if (!consulta.trim() || loading) return

    setLoading(true)
    setResult(null)
    setConsultaActual(consulta)

    try {
      const res = await fetch('/api/assistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta,
          idioma,
          historial: historial.slice(-4),
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Error en la consulta.')

      setResult(data)
      setHistorial(prev => [
        ...prev,
        { role: 'user', content: consulta },
        { role: 'assistant', content: data.resum_executiu || '' },
      ])
      setQuery('')
    } catch (error: any) {
      toast.error(error.message || 'Error en la consulta.')
    } finally {
      setLoading(false)
    }
  }

  function novaConsulta() {
    setQuery('')
    setResult(null)
    setConsultaActual('')
  }

  function netejarSessio() {
    setHistorial([])
    novaConsulta()
    toast.success('Sessió reiniciada')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Assistent de preparació
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cerca a la base documental i prepara un informe polític amb antecedents, acords, imports, vulnerabilitats i preguntes.
          </p>
        </div>
        {historial.length > 0 && (
          <button
            onClick={netejarSessio}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nova sessió
          </button>
        )}
      </div>

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
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder="Exemple: Tot el que hi ha sobre la contracta de neteja viària"
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Analitzant...' : 'Consultar'}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Exemples de consultes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXEMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleQuery(ex)}
                className="text-left px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Consultant la base de dades municipal...</p>
          <p className="text-xs text-slate-400 mt-1">Cercant documents rellevants i generant l'informe</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.alertes && result.alertes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes urgents
              </h3>
              <ul className="space-y-1">
                {result.alertes.map((alerta, index) => (
                  <li key={`${alerta}-${index}`} className="text-sm text-red-700">{alerta}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Resum executiu</h3>
              <button
                onClick={() => descarregarInforme(result, consultaActual)}
                className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 px-2 py-1 hover:bg-blue-100 rounded"
              >
                <Download className="w-3.5 h-3.5" />
                Descarregar
              </button>
            </div>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{result.resum_executiu}</p>
            {result._meta && (
              <p className="text-xs text-blue-700 mt-3">
                {result._meta.documents_consultats} documents consultats
                {result._meta.fonts_consultades?.length ? ` · ${result._meta.fonts_consultades.join(', ')}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SeccioPlegable titol="Antecedents i historial" icona={<FileText className="w-4 h-4 text-slate-400" />} contingut={result.antecedents} />
            <SeccioPlegable titol="Acords vigents" icona={<FileText className="w-4 h-4 text-green-500" />} contingut={result.acords_vigents} />
            <SeccioPlegable titol="Imports i contractes" icona={<FileText className="w-4 h-4 text-orange-400" />} contingut={result.imports_contractes} />
            <SeccioPlegable titol="Vulnerabilitats del govern" icona={<AlertTriangle className="w-4 h-4 text-orange-500" />} contingut={result.vulnerabilitats} colorClass="border-orange-200 bg-orange-50/30" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              Preguntes suggerides per al Ple
            </h3>
            <ol className="space-y-3">
              {result.preguntes_suggerides?.map((pregunta, index) => (
                <li key={`${pregunta}-${index}`} className="flex gap-3">
                  <span className="font-bold text-blue-600 min-w-[24px] text-sm">{index + 1}.</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{pregunta}</p>
                </li>
              ))}
            </ol>
          </div>

          {result.documents_font?.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wide mb-3">
                Documents consultats ({result.documents_font.length})
              </h3>
              <ul className="space-y-2">
                {result.documents_font.map((doc, index) => (
                  <li key={`${doc.titol}-${index}`} className="text-xs text-slate-600">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                        {doc.titol}
                      </a>
                    ) : (
                      <span className="font-medium">{doc.titol}</span>
                    )}
                    <span className="text-slate-400"> {doc.font ? `· ${doc.font}` : ''} {doc.data ? `· ${doc.data}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IAClient({
  initialTab = 'assistent',
  sessions,
  documents,
  compromisos,
}: {
  initialTab?: Tab
  sessions: any[]
  documents: any[]
  compromisos: any[]
}) {
  const [tab, setTab] = useState<Tab>(initialTab)

  const tabs = [
    { key: 'assistent' as Tab, label: 'Assistent', icon: Zap },
    { key: 'assessor' as Tab, label: 'Assessor IA', icon: MessageSquare },
    { key: 'memoria' as Tab, label: 'Memòria política', icon: Brain },
    { key: 'alegacions' as Tab, label: 'Alegacions', icon: FileEdit },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Intel·ligència IA
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Assistent, assessor, memòria política i alegacions en un únic espai.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === item.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {tab === 'assistent' && <AssistentPreparacio />}
        {tab === 'assessor' && <AssessorClient />}
        {tab === 'memoria' && <MemoriaClient documents={documents} compromisos={compromisos} />}
        {tab === 'alegacions' && (
          <AlegacionsClient
            documents={documents.filter((d: any) => d.classificacio === 'URGENT' || d.classificacio === 'IMPORTANT')}
          />
        )}
      </div>
    </div>
  )
}
