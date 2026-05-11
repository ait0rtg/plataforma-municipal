'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, FileText, Euro, Clock } from 'lucide-react'
import { useState } from 'react'

const COLORS = ['#1d6fa5', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899']

interface Props {
  stats: { total: number; urgents: number; importants: number; importTotal: number; pendents: number }
  evolucioMensual: { mes: string; total: number; urgents: number; imports: number }[]
  perTema: { tema: string; count: number; imports: number }[]
  perFont: { font: string; count: number }[]
  topImports: { titol: string; import_detectat: number; font?: string; tema_principal?: string; data?: string }[]
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  )
}

export default function AnalisiClient({ stats, evolucioMensual, perTema, perFont, topImports }: Props) {
  const [graficActiu, setGraficActiu] = useState<'documents' | 'imports'>('documents')

  const importFormatat = stats.importTotal > 1000000
    ? `${(stats.importTotal / 1000000).toFixed(1)}M€`
    : stats.importTotal > 1000
      ? `${(stats.importTotal / 1000).toFixed(0)}k€`
      : `${stats.importTotal}€`

  if (stats.total === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-400">Encara no hi ha documents. Activa els scrapers per importar dades.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total documents" value={stats.total} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Urgents" value={stats.urgents} icon={AlertTriangle} color="bg-red-50 text-red-600"
          sub={`${Math.round(stats.urgents / stats.total * 100)}% del total`} />
        <StatCard label="Importants" value={stats.importants} icon={TrendingUp} color="bg-orange-50 text-orange-600" />
        <StatCard label="Import total" value={importFormatat} icon={Euro} color="bg-green-50 text-green-600" />
        <StatCard label="Pendents revisió" value={stats.pendents} icon={Clock} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Evolució mensual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Evolució mensual</h3>
          <div className="flex gap-1">
            {(['documents', 'imports'] as const).map(g => (
              <button key={g} onClick={() => setGraficActiu(g)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  graficActiu === g ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-100'
                }`}>
                {g === 'documents' ? 'Documents' : 'Imports €'}
              </button>
            ))}
          </div>
        </div>
        {evolucioMensual.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Sense dades mensuals</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            {graficActiu === 'documents' ? (
              <BarChart data={evolucioMensual} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Total" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="urgents" name="Urgents" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={evolucioMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('ca-ES')} €`, 'Import']} />
                <Line type="monotone" dataKey="imports" name="Imports €" stroke="#1d6fa5" strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Per tema i per font */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Per tema */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Documents per tema</h3>
          {perTema.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Sense dades</p>
          ) : (
            <div className="space-y-2">
              {perTema.map((t, i) => (
                <div key={t.tema} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-700 capitalize truncate">{t.tema}</span>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{t.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round(t.count / perTema[0].count * 100)}%`,
                        background: COLORS[i % COLORS.length]
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per font */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Documents per font</h3>
          {perFont.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">Sense dades</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={perFont} dataKey="count" nameKey="font" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}>
                  {perFont.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => v.length > 20 ? v.slice(0, 20) + '…' : v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top imports */}
      {topImports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Top contractes per import</h3>
          <div className="space-y-2">
            {topImports.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{d.titol}</p>
                  <p className="text-xs text-slate-400">
                    {d.font}{d.tema_principal ? ` · ${d.tema_principal}` : ''}{d.data ? ` · ${d.data}` : ''}
                  </p>
                </div>
                <div className="text-sm font-bold text-blue-700 flex-shrink-0">
                  {Number(d.import_detectat).toLocaleString('ca-ES')} €
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
