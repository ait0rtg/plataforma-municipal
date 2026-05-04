'use client'

import { useState } from 'react'
import { UserPlus, Check, X, Trash2 } from 'lucide-react'

type Usuari = {
  id: string
  email: string
  nom: string
  role: string
  aprovat: boolean
  created_at: string
}

export default function UsuarisClient({ usuaris: inicial }: { usuaris: Usuari[] }) {
  const [usuaris, setUsuaris] = useState<Usuari[]>(inicial)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  async function handleCrear() {
    if (!nom || !email || !password) return
    setLoading(true)
    setError('')
    setOk('')

    const res = await fetch('/api/admin/usuaris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error creant usuari')
    } else {
      setOk(`Usuari ${email} creat correctament`)
      setNom('')
      setEmail('')
      setPassword('')
      setMostrarForm(false)
      // Recarregar llista
      const res2 = await fetch('/api/admin/usuaris')
      const data2 = await res2.json()
      if (data2.usuaris) setUsuaris(data2.usuaris)
    }
    setLoading(false)
  }

  async function handleAprovar(id: string, aprovat: boolean) {
    await fetch('/api/admin/usuaris', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, aprovat }),
    })
    setUsuaris(prev => prev.map(u => u.id === id ? { ...u, aprovat } : u))
  }

  return (
    <div className="space-y-4">
      {/* Botó crear */}
      <div className="flex justify-between items-center">
        {ok && <p className="text-sm text-green-600">{ok}</p>}
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors ml-auto"
        >
          <UserPlus className="w-4 h-4" />
          Nou usuari
        </button>
      </div>

      {/* Formulari crear */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Crear nou usuari</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nom"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Contrasenya"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCrear}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creant...' : 'Crear usuari'}
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      )}

      {/* Llista usuaris */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nom</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aprovat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuaris.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nom}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleAprovar(u.id, !u.aprovat)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      u.aprovat
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {u.aprovat ? <><Check className="w-3 h-3" /> Aprovat</> : <><X className="w-3 h-3" /> Pendent</>}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'admin' && (
                    <span className="text-xs text-slate-300">·</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
