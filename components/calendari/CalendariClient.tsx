'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, FileText, Target, AlertCircle } from 'lucide-react'

type DocEvent = {
  id: string
  titol: string
  font: string
  classificacio: string
  data_publicacio?: string
  venciment?: string
  data_deteccio?: string
  url_original?: string
  tema_principal?: string
}

type Compromis = {
  id: string
  titol: string
  data_limit?: string
  estat: string
  prioritat: string
}

type Event = {
  id: string
  titol: string
  data: Date
  tipus: 'document' | 'venciment' | 'compromis'
  classificacio?: string
  font?: string
  url?: string
  color: string
}

function getColor(tipus: string, classificacio?: string) {
  if (tipus === 'compromis') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (tipus === 'venciment') return 'bg-red-100 text-red-700 border-red-200'
  if (classificacio === 'URGENT') return 'bg-red-100 text-red-700 border-red-200'
  if (classificacio === 'IMPORTANT') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-blue-100 text-blue-700 border-blue-200'
}

const MESOS = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']
const DIES = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']

export default function CalendariClient({ documents, compromisos }: {
  documents: DocEvent[]
  compromisos: Compromis[]
}) {
  const avui = new Date()
  const [any, setAny] = useState(avui.getFullYear())
  const [mes, setMes] = useState(avui.getMonth())
  const [diaSeleccionat, setDiaSeleccionat] = useState<Date | null>(null)

  const events = useMemo(() => {
    const llista: Event[] = []

    documents.forEach(doc => {
      if (doc.data_publicacio) {
        const d = new Date(doc.data_publicacio)
        if (!isNaN(d.getTime())) {
          llista.push({
            id: `doc-${doc.id}`,
            titol: doc.titol,
            data: d,
            tipus: 'document',
            classificacio: doc.classificacio,
            font: doc.font,
            url: doc.url_original,
            color: getColor('document', doc.classificacio),
          })
        }
      }
      if (doc.venciment) {
        const d = new Date(doc.venciment)
        if (!isNaN(d.getTime())) {
          llista.push({
            id: `venc-${doc.id}`,
            titol: `⚠️ Venciment: ${doc.titol}`,
            data: d,
            tipus: 'venciment',
            classificacio: doc.classificacio,
            url: doc.url_original,
            color: getColor('venciment'),
          })
        }
      }
    })

    compromisos.forEach(c => {
      if (c.data_limit) {
        const d = new Date(c.data_limit)
        if (!isNaN(d.getTime())) {
          llista.push({
            id: `comp-${c.id}`,
            titol: c.titol,
            data: d,
            tipus: 'compromis',
            color: getColor('compromis'),
          })
        }
      }
    })

    return llista
  }, [documents, compromisos])

  function eventsDia(dia: Date) {
    return events.filter(e =>
      e.data.getFullYear() === dia.getFullYear() &&
      e.data.getMonth() === dia.getMonth() &&
      e.data.getDate() === dia.getDate()
    )
  }

  function diesDelMes() {
    const primer = new Date(any, mes, 1)
    const ultim = new Date(any, mes + 1, 0)
    const dies: (Date | null)[] = []

    let diaSetmana = primer.getDay()
    diaSetmana = diaSetmana === 0 ? 6 : diaSetmana - 1
    for (let i = 0; i < diaSetmana; i++) dies.push(null)
    for (let d = 1; d <= ultim.getDate(); d++) dies.push(new Date(any, mes, d))

    return dies
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAny(any - 1) }
    else setMes(mes - 1)
    setDiaSeleccionat(null)
  }

  function mesSeguent() {
    if (mes === 11) { setMes(0); setAny(any + 1) }
    else setMes(mes + 1)
    setDiaSeleccionat(null)
  }

  const dies = diesDelMes()
  const eventsDiaSeleccionat = diaSeleccionat ? eventsDia(diaSeleccionat) : []

  const esAvui = (d: Date) =>
    d.getDate() === avui.getDate() &&
    d.getMonth() === avui.getMonth() &&
    d.getFullYear() === avui.getFullYear()

  const esSeleccionat = (d: Date) =>
    diaSeleccionat &&
    d.getDate() === diaSeleccionat.getDate() &&
    d.getMonth() === diaSeleccionat.getMonth() &&
    d.getFullYear() === diaSeleccionat.getFullYear()

  // Propers events (30 dies)
  const propersEvents = events
    .filter(e => {
      const diff = e.data.getTime() - avui.getTime()
      return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000
    })
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .slice(0, 10)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendari */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Capçalera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button onClick={mesAnterior} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-800">{MESOS[mes]} {any}</h2>
            <button onClick={mesSeguent} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dies de la setmana */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DIES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">{d}</div>
            ))}
          </div>

          {/* Dies */}
          <div className="grid grid-cols-7">
            {dies.map((dia, i) => {
              if (!dia) return <div key={`null-${i}`} className="h-20 border-b border-r border-slate-50" />
              const evDia = eventsDia(dia)
              return (
                <div
                  key={dia.toISOString()}
                  onClick={() => setDiaSeleccionat(esSeleccionat(dia) ? null : dia)}
                  className={`h-20 border-b border-r border-slate-100 p-1 cursor-pointer transition-colors ${
                    esSeleccionat(dia) ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    esAvui(dia) ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}>
                    {dia.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {evDia.slice(0, 2).map(e => (
                      <div key={e.id} className={`text-xs px-1 py-0.5 rounded truncate border ${e.color}`}>
                        {e.titol.slice(0, 15)}
                      </div>
                    ))}
                    {evDia.length > 2 && (
                      <div className="text-xs text-slate-400 px-1">+{evDia.length - 2} més</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Events del dia seleccionat */}
        {diaSeleccionat && (
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-3">
              {diaSeleccionat.getDate()} {MESOS[diaSeleccionat.getMonth()]} {diaSeleccionat.getFullYear()}
            </h3>
            {eventsDiaSeleccionat.length === 0 ? (
              <p className="text-sm text-slate-400">Cap event aquest dia.</p>
            ) : (
              <div className="space-y-2">
                {eventsDiaSeleccionat.map(e => (
                  <div key={e.id} className={`flex items-start gap-2 p-3 rounded-lg border ${e.color}`}>
                    {e.tipus === 'compromis' ? <Target className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                     e.tipus === 'venciment' ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                     <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.titol}</p>
                      {e.font && <p className="text-xs opacity-70">{e.font}</p>}
                    </div>
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0">
                        Veure
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna dreta — propers events */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Propers 30 dies</h2>
        {propersEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-400">Cap event pròxim.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {propersEvents.map(e => (
              <div key={e.id} className={`p-3 rounded-xl border ${e.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">
                    {e.data.getDate()} {MESOS[e.data.getMonth()]}
                  </span>
                  <span className="text-xs opacity-60 capitalize">{e.tipus}</span>
                </div>
                <p className="text-xs font-medium leading-snug">{e.titol}</p>
                {e.font && <p className="text-xs opacity-60 mt-0.5">{e.font}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Llegenda */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase">Llegenda</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300 flex-shrink-0" />
              <span className="text-xs text-slate-600">Document nou</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300 flex-shrink-0" />
              <span className="text-xs text-slate-600">Document important</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300 flex-shrink-0" />
              <span className="text-xs text-slate-600">Urgent / Venciment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300 flex-shrink-0" />
              <span className="text-xs text-slate-600">Compromís</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
