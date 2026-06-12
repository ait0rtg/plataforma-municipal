'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

type Llei = {
  id: string
  titol: string
  descripcio?: string
  contingut: string
  activa: boolean
  created_at: string
}

export default function LleisClient({ lleis: initial }: { lleis: Llei[] }) {
  const [lleis, setLleis] = useState<Llei[]>(initial)
  const [editant, setEditant] = useState<string | null>(null)
  const [creant, setCreant] = useState(false)
  const [form, setForm] = useState({ titol: '', descripcio: '', contingut: '' })
  const [guardant, setGuardant] = useState(false)

  function iniciarCreacio() {
    setForm({ titol: '', descripcio: '', contingut: '' })
    setCreant(true)
    setEditant(null)
  }

  function iniciarEdicio(l: Llei) {
    setForm({ titol: l.titol, descripcio: l.descripcio || '', contingut: l.contingut })
    setEditant(l.id)
    setCreant(false)
  }

  async function desar() {
    if (!form.titol.trim() || !form.contingut.trim()) {
      toast.error('El títol i el contingut són obligatoris')
      return
    }
    setGuardant(true)
    try {
      if (creant) {
        const res = await fetch('/api/admin/lleis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setLleis(prev => [...prev, data.llei])
        setCreant(false)
        toast.success('Llei afegida')
      } else if (editant) {
        const res = await fetch('/api/admin/lleis', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editant, ...form }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setLleis(prev => prev.map(l => l.id === editant ? { ...l, ...form } : l))
        setEditant(null)
        toast.success('Llei actualitzada')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGuardant(false)
    }
  }

  async function toggleActiva(l: Llei) {
    const nouValor = !l.activa
    setLleis(prev => prev.map(x => x.id === l.id ? { ...x, activa: nouValor } : x))
    await fetch('/api/admin/lleis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: l.id, titol: l.titol, contingut: l.contingut, activa: nouValor }),
    })
    toast.success(nouValor ? 'Llei activada' : 'Llei desactivada')
  }

  async function eliminar(id: string) {
    if (!confirm('Segur que vols eliminar aquesta llei?')) return
    await fetch('/api/admin/lleis?id=' + id, { method: 'DELETE' })
    setLleis(prev => prev.filter(l => l.id !== id))
    toast.success('Llei eliminada')
  }

  const FormCard = () => (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-indigo-800 text-sm">
        {creant ? 'Nova llei o normativa' : 'Editar llei'}
      </h3>
      <input
        type="text"
        placeholder="Títol (ex: LBRL, TRLCSP...)"
        value={form.titol}
        onChange={e => setForm(p => ({ ...p, titol: e.target.value }))}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      />
      <input
        type="text"
        placeholder="Descripció breu (opcional)"
        value={form.descripcio}
        onChange={e => setForm(p => ({ ...p, descripcio: e.target.value }))}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      />
      <textarea
        placeholder="Contingut legal — articles rellevants, punts clau, extractes que l'IA ha de conèixer..."
        value={form.contingut}
        onChange={e => setForm(p => ({ ...p, contingut: e.target.value }))}
        rows={8}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none font-mono"
      />
      <p className="text-xs text-indigo-500">
        Afegeix els articles i punts clau que vols que l&apos;assessor IA tingui en compte. No cal incloure el text íntegre — només els fragments rellevants.
      </p>
      <div className="flex gap-2">
        <button
          onClick={desar}
          disabled={guardant}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Check className="w-4 h-4" />
          {guardant ? 'Guardant...' : 'Desar'}
        </button>
        <button
          onClick={() => { setCreant(false); setEditant(null) }}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel·lar
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {lleis.filter(l => l.activa).length} de {lleis.length} lleis actives a l&apos;assessor
        </p>
        <button
          onClick={iniciarCreacio}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Afegir llei
        </button>
      </div>

      {creant && <FormCard />}

      <div className="space-y-3">
        {lleis.map(l => (
          <div key={l.id}>
            {editant === l.id ? (
              <FormCard />
            ) : (
              <div className={'bg-white rounded-xl border p-4 transition-all ' + (l.activa ? 'border-slate-200' : 'border-slate-100 opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <BookOpen className={'w-4 h-4 flex-shrink-0 mt-0.5 ' + (l.activa ? 'text-indigo-500' : 'text-slate-300')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-slate-800 text-sm">{l.titol}</h4>
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (l.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                          {l.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      {l.descripcio && <p className="text-xs text-slate-500 mb-1">{l.descripcio}</p>}
                      <p className="text-xs text-slate-400 line-clamp-2 font-mono">{l.contingut}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActiva(l)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title={l.activa ? 'Desactivar' : 'Activar'}
                    >
                      {l.activa
                        ? <ToggleRight className="w-5 h-5 text-indigo-500" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => iniciarEdicio(l)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminar(l.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {lleis.length === 0 && !creant && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Cap llei configurada</p>
            <p className="text-xs text-slate-300 mt-1">Afegeix lleis per millorar les respostes de l&apos;assessor IA</p>
          </div>
        )}
      </div>
    </div>
  )
}
