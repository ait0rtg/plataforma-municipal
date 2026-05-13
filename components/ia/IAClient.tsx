'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import MemoriaClient from '@/components/memoria/MemoriaClient'
import AlegacionsClient from '@/components/alegacions/AlegacionsClient'
import { MessageSquare, Brain, FileEdit } from 'lucide-react'

const AssessorClient = dynamic(() => import('@/components/assessor/AssessorClient'), { ssr: false })

type Tab = 'assessor' | 'memoria' | 'alegacions'

export default function IAClient({ sessions, documents, compromisos }: {
  sessions: any[]
  documents: any[]
  compromisos: any[]
}) {
  const [tab, setTab] = useState<Tab>('assessor')

  const TABS = [
    { key: 'assessor' as Tab, label: 'Assessor IA', icon: MessageSquare },
    { key: 'memoria' as Tab, label: 'Memòria Política', icon: Brain },
    { key: 'alegacions' as Tab, label: "Al·legacions", icon: FileEdit },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Intel·ligència IA</h1>
        <p className="text-sm text-slate-500">Assessor, memòria política i generador d'al·legacions</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {tab === 'assessor' && (
          <div className="h-[calc(100vh-220px)]">
            <AssessorClient sessions={sessions} />
          </div>
        )}
        {tab === 'memoria' && (
          <MemoriaClient documents={documents} compromisos={compromisos} />
        )}
        {tab === 'alegacions' && (
          <AlegacionsClient documents={documents.filter((d: any) =>
            d.classificacio === 'URGENT' || d.classificacio === 'IMPORTANT'
          )} />
        )}
      </div>
    </div>
  )
}
