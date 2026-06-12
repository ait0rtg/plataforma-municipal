import Link from 'next/link'
import {
  AlertTriangle, Clock, FileText, Target,
  TrendingUp, Euro, Calendar, Eye
} from 'lucide-react'

interface Stats {
  total_documents: number
  urgents_pendents: number
  nous_7dies: number
  urgents_7dies: number
  venciments_7dies: number
  venciments_30dies: number
  import_30dies: number
  pendents_sense_analisi: number
  compromisos_pendents: number
  compromisos_pct: number
  juntes_30dies: number
  contractes_top: { titol: string; import_detectat: number; tema_principal?: string }[]
}

function formatImport(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M€'
  if (n >= 1000) return Math.round(n / 1000) + 'k€'
  return n + '€'
}

export default function StatsCards({ stats: s }: { stats: Stats }) {
  const cards = [
    {
      label: 'Urgents pendents',
      value: s.urgents_pendents,
      sub: s.urgents_7dies > 0 ? s.urgents_7dies + ' nous aquesta setmana' : 'Cap nou aquesta setmana',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: s.urgents_pendents > 0 ? 'border-red-300' : 'border-red-100',
      href: '/documents?classificacio=URGENT',
      alert: s.urgents_pendents > 0,
    },
    {
      label: 'Venciments propers',
      value: s.venciments_7dies,
      sub: s.venciments_30dies + ' en els propers 30 dies',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: s.venciments_7dies > 0 ? 'border-orange-300' : 'border-orange-100',
      href: '/calendari',
      alert: s.venciments_7dies > 0,
    },
    {
      label: 'Contractació 30 dies',
      value: formatImport(s.import_30dies),
      sub: 'import total detectat',
      icon: Euro,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      href: '/documents?tema=contractacio',
      alert: false,
    },
    {
      label: 'Sense analitzar',
      value: s.pendents_sense_analisi,
      sub: 'documents pendents de revisió IA',
      icon: Eye,
      color: s.pendents_sense_analisi > 5 ? 'text-amber-600' : 'text-slate-500',
      bg: s.pendents_sense_analisi > 5 ? 'bg-amber-50' : 'bg-slate-50',
      border: s.pendents_sense_analisi > 5 ? 'border-amber-200' : 'border-slate-200',
      href: '/documents?estat=pendent',
      alert: s.pendents_sense_analisi > 10,
    },
    {
      label: 'Compromisos',
      value: s.compromisos_pct + '%',
      sub: s.compromisos_pendents + ' pendents de compliment',
      icon: Target,
      color: s.compromisos_pct >= 50 ? 'text-green-600' : 'text-purple-600',
      bg: s.compromisos_pct >= 50 ? 'bg-green-50' : 'bg-purple-50',
      border: s.compromisos_pct >= 50 ? 'border-green-100' : 'border-purple-100',
      href: '/compromisos',
      alert: false,
    },
    {
      label: 'Nous documents',
      value: s.nous_7dies,
      sub: s.total_documents + ' total acumulats',
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      href: '/documents',
      alert: false,
    },
    {
      label: 'Juntes de Govern',
      value: s.juntes_30dies,
      sub: 'darrers 30 dies',
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      href: '/documents?font=Junta',
      alert: false,
    },
    {
      label: 'Total documents',
      value: s.total_documents,
      sub: 'en seguiment',
      icon: FileText,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      href: '/documents',
      alert: false,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={'bg-white rounded-xl border ' + c.border + ' p-4 hover:shadow-sm transition-shadow relative overflow-hidden group'}
          >
            {c.alert && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            <div className={'w-9 h-9 rounded-lg ' + c.bg + ' flex items-center justify-center mb-3 group-hover:scale-105 transition-transform'}>
              <c.icon className={'w-4 h-4 ' + c.color} />
            </div>
            <div className={'text-2xl font-bold ' + (c.alert ? c.color : 'text-slate-800') + ' leading-none mb-1'}>
              {c.value}
            </div>
            <div className="text-xs font-medium text-slate-600 leading-tight">{c.label}</div>
            {c.sub && <div className="text-xs text-slate-400 mt-0.5 leading-tight">{c.sub}</div>}
          </Link>
        ))}
      </div>

      {s.contractes_top.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Top contractes darrers 30 dies
          </div>
          <div className="space-y-2">
            {s.contractes_top.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{c.titol}</p>
                  {c.tema_principal && (
                    <p className="text-xs text-slate-400 capitalize">{c.tema_principal}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-blue-700 flex-shrink-0">
                  {formatImport(c.import_detectat)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
