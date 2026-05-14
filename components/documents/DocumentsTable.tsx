'use client'

import { useState } from 'react'
import { formatData, isAdmin, truncate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ChevronFirst, ChevronLast, FileCheck, FileWarning, EyeOff } from 'lucide-react'
import DocumentModal from './DocumentModal'
import type { Document } from '@/types'

const classifVariant = (c?: string) =>
  (c === 'URGENT' ? 'urgent' : c === 'IMPORTANT' ? 'important' : 'informatiu') as 'urgent' | 'important' | 'informatiu'

function Paginacio({ page, totalPages }: { page: number; totalPages: number }) {
  const pages: (number | string)[] = []

  pages.push(1)
  if (page > 3) pages.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i)
  }
  if (page < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  return (
    <div className="flex items-center gap-1">
      <a
        href="?page=1"
        className={`p-1.5 rounded bg-slate-100 hover:bg-slate-200 ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
      >
        <ChevronFirst className="w-3.5 h-3.5" />
      </a>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">...</span>
        ) : (
          <a
            key={p}
            href={`?page=${p}`}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              page === p
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {p}
          </a>
        )
      )}

      <a
        href={`?page=${totalPages}`}
        className={`p-1.5 rounded bg-slate-100 hover:bg-slate-200 ${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
      >
        <ChevronLast className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

export default function DocumentsTable({
  documents,
  total,
  page,
  limit,
  userEmail,
}: {
  documents: Document[]
  total: number
  page: number
  limit: number
  userEmail?: string
}) {
  const [selected, setSelected] = useState<Document | null>(null)
  const admin = isAdmin(userEmail)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-400">
            {total} documents · pàg. {page}/{totalPages}
          </span>
          <Paginacio page={page} totalPages={totalPages} />
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Títol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Font</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nivell</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No hi ha documents.
                </td>
              </tr>
            )}

            {documents.map(doc => (
              <tr
                key={doc.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelected(doc)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 truncate max-w-xs">
                    {doc.titol || '(sense títol)'}
                  </div>

                  {doc.resum && (
                    <div className="text-xs text-slate-400 truncate max-w-xs">
                      {truncate(doc.resum, 80)}
                    </div>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    {doc.estat_lectura_pdf === 'llegit' ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <FileCheck className="h-3 w-3" />
                        PDF llegit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <FileWarning className="h-3 w-3" />
                        Pendent de lectura
                      </span>
                    )}

                    {doc.ocult && admin && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <EyeOff className="h-3 w-3" />
                        Ocult
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                  {doc.font}
                </td>

                <td className="px-4 py-3">
                  <Badge variant={classifVariant(doc.classificacio)}>
                    {doc.classificacio}
                  </Badge>
                </td>

                <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                  {formatData(doc.data_deteccio)}
                </td>

                <td className="px-4 py-3">
                  {doc.url_original && !doc.url_original.startsWith('upload://') && (
                    <a
                      href={doc.url_original}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-400">{total} documents</span>
          <Paginacio page={page} totalPages={totalPages} />
        </div>
      </div>

      {selected && (
        <DocumentModal
          doc={selected}
          isAdmin={admin}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
