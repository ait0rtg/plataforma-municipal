'use client'

import { useState } from 'react'
import { Plus, Check, Clock, AlertCircle } from 'lucide-react'

type Compromis = {
  id: string
  titol: string
  descripcio?: string
  estat: string
  prioritat: string
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

export default function CompromisosClient({ compromisos: inicial, isAdmin }: { compromisos: Compromis[], isAdmin: boolean }) {
  const [compromisos, setCompromisos] = useState(inicial)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titol, setTitol] = useState('')
  const [descripcio, setDescripcio] = useState('')
  const [prioritat, setPrioritat] = useState('NORMAL')
  const [dataLimit, setDataLimit] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCrear() {
    if (!titol) return
    setLoading(true)
    const res = await fetch('/api/compromisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titol, descripcio, prioritat, data_limit: dataLimit }),
    })
    const data = await res.json()
    if (data.compromis) {
      setCompromisos(prev => [data.compromis, ...prev])
      setTitol('')
      setDescripcio('')
      setDataLimit('')
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

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nou compromís
          </button>
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Nou compromís</h3>
          <input
            type="text"
            placeholder="Títol"
            value={titol}
            onChange={e => setTitol(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="Descripció (opcional)"
            value={descripcio}
            onChange={e => setDescripcio(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={prioritat}
              onChange={e => setPrioritat(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
            </select>
            <input
              type="date"
              value={dataLimit}
              onChange={e => setDataLimit(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCrear} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creant...' : 'Crear'}
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">
              Cancel·lar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {compromisos.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400">No hi ha compromisos. Crea el primer!</p>
          </div>
        )}
        {compromisos.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <div className="mt-0.5">{estatIcon(c.estat)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800">{c.titol}</div>
              {c.descripcio && <div className="text-sm text-slate-500 mt-0.5">{c.descripcio}</div>}
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioritatColor(c.prioritat)}`}>
                  {c.prioritat}
                </span>
                {c.data_limit && (
                  <span className="text-xs text-slate-400">Límit: {c.data_limit}</span>
                )}
              </div>
            </div>
            {isAdmin && (
              <select
                value={c.estat}
                onChange={e => handleEstat(c.id, e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600"
              >
                <option value="PENDENT">Pendent</option>
                <option value="EN_CURS">En curs</option>
                <option value="FET">Fet</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
