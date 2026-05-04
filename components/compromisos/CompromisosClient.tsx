'use client'

import { useState } from 'react'
import { Plus, Check, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

type Compromis = {
  id: string
  titol: string
  descripcio?: string
  estat: string
  prioritat: string
  partit?: string
  percentatge?: number
  responsable?: string
  data_limit?: string
  created_at: string
}

const estatIcon = (estat: string) => {
  if (estat === 'FET') return <Check className="w-4 h-4 text-green-500" />
  if (estat === 'EN_CURS') return <Clock className="w-4 h-4 text-blue-500" />
  return <AlertCircle className="w-4 h-4 text-orange-500" />
}

const prioritatColor = (p: string) => {
  if (p === 'ALTA') return 'bg-red-100 text-red-700'
  if (p === 'NORMAL') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

const partitColor = (p?: string) => {
  if (!p) return 'bg-slate-100 text-slate-500'
  const colors: Record<string, string> = {
    'PSC': 'bg-red-100 text-red-700',
    'CiU': 'bg-blue-100 text-blue-700',
    'ERC': 'bg-yellow-100 text-yellow-700',
    'PP': 'bg-blue-200 text-blue-800',
    'Junts': 'bg-cyan-100 text-cyan-700',
    'CUP': 'bg-yellow-200 text-yellow-800',
  }
  return colors[p] || 'bg-purple-100 text-purple-700'
}

export default function CompromisosClient({ compromisos: inicial, isAdmin }: { compromisos: Compromis[], isAdmin: boolean }) {
  const [compromisos, setCompromisos] = useState(inicial)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandit, setExpandit] = useState<string | null>(null)
  const [titol, setTitol] = useState('')
  const [descripcio, setDescripcio] = useState('')
  const [prioritat, setPrioritat] = useState('NORMAL')
  const [partit, setPartit] = useState('')
  const [percentatge, setPercentatge] = useState(0)
  const [dataLimit, setDataLimit] = useState('')
  const [loading, setLoading] = useState(false)
  const [filtre, setFiltre] = useState('TOTS')

  async function handleCrear() {
    if (!titol) return
    setLoading(true)
    const res = await fetch('/api/compromisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titol, descripcio, prioritat, partit, percentatge, data_limit: dataLimit }),
    })
    const data = await res.json()
    if (data.compromis) {
      setCompromisos(prev => [data.compromis, ...prev])
      setTitol('')
      setDescripcio('')
      setDataLimit('')
      setPartit('')
      setPercentatge(0)
      setMostrarForm(false)
    }
    setLoading(false)
  }

  async function handleEstat(id: string, estat: string) {
    await fetch('/api/compromisos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estat }),
    })
    setCompromisos(prev => prev.map(c => c.id === id ? { ...c, estat } : c))
  }

  async function handlePercentatge(id: string, perc: number) {
    await fetch('/api/compromisos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, percentatge: perc }),
    })
    setCompromisos(prev => prev.map(c => c.id === id ? { ...c, percentatge: perc } : c))
  }

  const filtrats = compromisos.filter(c => {
    if (filtre === 'TOTS') return true
    return c.estat === filtre
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['TOTS', 'PENDENT', 'EN_CURS', 'FET'].map(f => (
            <button key={f}
              onClick={() => setFiltre(f)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filtre === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {f === 'TOTS' ? 'Tots' : f === 'PENDENT' ? 'Pendents' : f === 'EN_CURS' ? 'En curs' : 'Fets'}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nou compromís
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Nou compromís</h3>
          <input
            type="text"
            placeholder="Títol del compromís"
            value={titol}
            onChange={e => setTitol(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Descripció detallada (pots incloure info del programa electoral)"
            value={descripcio}
            onChange={e => setDescripcio(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Partit que ho portava al programa</label>
              <input
                type="text"
                placeholder="ex: PSC, ERC, Junts..."
                value={partit}
                onChange={e => setPartit(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">% Completat</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={percentatge}
                  onChange={e => setPercentatge(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slate-700 w-10">{percentatge}%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Prioritat</label>
              <select
                value={prioritat}
                onChange={e => setPrioritat(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Data límit</label>
              <input
                type="date"
                value={dataLimit}
                onChange={e => setDataLimit(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCrear} disabled={loading || !titol}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creant...' : 'Crear compromís'}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">
              Cancel·lar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtrats.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400">No hi ha compromisos en aquest estat.</p>
          </div>
        )}
        {filtrats.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpandit(expandit === c.id ? null : c.id)}
            >
              <div className="mt-0.5">{estatIcon(c.estat)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800">{c.titol}</span>
                  {c.partit && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${partitColor(c.partit)}`}>
                      {c.partit}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioritatColor(c.prioritat)}`}>
                    {c.prioritat}
                  </span>
                </div>
                {c.percentatge !== undefined && c.percentatge > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          c.percentatge === 100 ? 'bg-green-500' :
                          c.percentatge >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                        }`}
                        style={{ width: `${c.percentatge}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{c.percentatge}%</span>
                  </div>
                )}
                {c.data_limit && (
                  <div className="text-xs text-slate-400 mt-1">Límit: {c.data_limit}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <select
                    value={c.estat}
                    onChange={e => { e.stopPropagation(); handleEstat(c.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
                  >
                    <option value="PENDENT">Pendent</option>
                    <option value="EN_CURS">En curs</option>
                    <option value="FET">Fet</option>
                  </select>
                )}
                {expandit === c.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {expandit === c.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                {c.descripcio && <p className="text-sm text-slate-600">{c.descripcio}</p>}
                {isAdmin && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Actualitzar % completat</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        defaultValue={c.percentatge || 0}
                        onChange={e => handlePercentatge(c.id, parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-10">{c.percentatge || 0}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
