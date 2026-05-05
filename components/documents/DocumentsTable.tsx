'use client'
import { useState } from 'react'
import { formatData, colorVenciment, isAdmin, truncate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Archive, ChevronFirst, ChevronLast } from 'lucide-react'
import DocumentModal from './DocumentModal'
import type { Document } from '@/types'

const classifVariant = (c?: string) =>
  (c === 'URGENT' ? 'urgent' : c === 'IMPORTANT' ? 'important' : 'informatiu') as 'urgent' | 'important' | 'informatiu'

export default function DocumentsTable({ documents, total, page, limit, userEmail }: {
  documents: Document[]; total: number; page: number; limit: number; userEmail?: string
}) {
  const [selected, setSelected] = useState<Document | null>(null)
  const [arxivats, setArxivats] = useState<string[]>([])
  const [confirmArxiu, setConfirmArxiu] = useState<string | null>(null)
  const admin = isAdmin(userEmail)
  const totalPages = Math.ceil(total / limit)

  async function handleArxivar(id: string) {
    const res = await fetch('/api/documents/arxivar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setArxivats(prev => [...prev, id])
      setConfirmArxiu(null)
    }
  }

  const visibles = documents.filter(d => !arxivats.includes(d.id))

  const Paginacio = () => (
    <div className="flex items-center gap-1">
      <a href="?page=1"
        className={`p-1.5 text-xs rounded hover:bg-slate-200 ${page === 1 ? 'opacity-30 pointer-events-none' : 'bg-slate-100'}`}>
        <ChevronFirst className="w-3.5 h-3.5" />
      </a>
      {page > 2 && <a href={`?page=${page - 2}`} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">{page - 2}</a>}
      {page > 1 && <a href={`?page=${page - 1}`} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">{page - 1}</a>}
      <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium">{page}</span>
      {page < totalPages && <a href={`?page=${page + 1}`} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">{page + 1}</a>}
      {page < totalPages - 1 && <a href={`?page=${page + 2}`} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">{page + 2}</a>}
      {totalPages > 3 && page < totalPages - 2 && <span className="text-xs text-slate-400">...</span>}
      {page < totalPages - 2 && <a href={`?page=${totalPages}`} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">{totalPages}</a>}
      <a href={`?page=${totalPages}`}
        className={`p-1.5 text-xs rounded hover:bg-slate-200 ${page === totalPages ? 'opacity-30 pointer-events-none' : 'bg-slate-100'}`}>
        <ChevronLast className="w-3.5 h-3.5" />
      </a>
    </div>
  )

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Paginació DALT */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{total} documents · pàgina {page} de {totalPages}</span>
          <Paginacio />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Títol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Font</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nivell</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
              {admin && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Arxiu</th>}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(doc)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 truncate max-w-xs">{doc.titol || '(sense títol)'}</div>
                  {doc.resum && <div className="text-xs text-slate-400 truncate max-w-xs">{truncate(doc.resum, 80)}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{doc.font}</td>
                <td className="px-4 py-3">
                  <Badge variant={classifVariant(doc.classificacio)}>{doc.classificacio}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                  {formatData(doc.data_deteccio)}
                </td>
                {admin && (
                  <td className="px-4 py-3 hidden lg:table-cell" onClick={e => e.stopPropagation()}>
                    {confirmArxiu === doc.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleArxivar(doc.id)}
                          className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600">
                          Confirmar
                        </button>
                        <button onClick={() => setConfirmArxiu(null)}
                          className="px-2 py-0.5 text-xs bg-slate-100 rounded hover:bg-slate-200">
                          Cancel·lar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmArxiu(doc.id)}
                        className="flex items-center gap-1 px-2 py-0.5 text-xs text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors">
                        <Archive className="w-3.5 h-3.5" />
                        Arxivar
                      </button>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <a href={doc.url_original} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-500 hover:text-blue-700">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginació BAIX */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{total} documents</span>
          <Paginacio />
        </div>
      </div>

      {selected && <DocumentModal doc={selected} isAdmin={admin} onClose={() => setSelected(null)} />}
    </>
  )
}
