'use client'
import { useState } from 'react'
import { X, ExternalLink, Sparkles, Archive } from 'lucide-react'
import { formatData, formatImport, colorVenciment } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Document } from '@/types'

const classifVariant = (c?: string) =>
  (c === 'URGENT' ? 'urgent' : c === 'IMPORTANT' ? 'important' : 'informatiu') as 'urgent' | 'important' | 'informatiu'

const ESTATS = [
  { value: 'pendent', label: 'Pendent', color: 'bg-orange-100 text-orange-700' },
  { value: 'en_curs', label: 'En curs', color: 'bg-blue-100 text-blue-700' },
  { value: 'tancat', label: 'Tancat', color: 'bg-green-100 text-green-700' },
  { value: 'arxivat', label: 'Arxivat', color: 'bg-slate-100 text-slate-500' },
]

export default function DocumentModal({ doc, isAdmin, onClose }: {
  doc: Document; isAdmin: boolean; onClose: () => void
}) {
  const [observacions, setObservacions] = useState(doc.observacions || '')
  const [saving, setSaving] = useState(false)
  const [resum, setResum] = useState(doc.resum || '')
  const [loadingResum, setLoadingResum] = useState(false)
  const [estat, setEstat] = useState<string>(doc.estat_seguiment || 'pendent')
  const [savingEstat, setSavingEstat] = useState(false)

  async function generarResum() {
    setLoadingResum(true)
    try {
      const res = await fetch('/api/documents/resum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          titol: doc.titol,
          contingut: doc.contingut_complet || doc.resum || '',
          url: doc.url_original,
        }),
      })
      const data = await res.json()
      if (data.resum) {
        setResum(data.resum)
        toast.success('Resum generat correctament.')
      } else {
        toast.error('Error generant el resum.')
      }
    } catch {
      toast.error('Error de connexió.')
    } finally {
      setLoadingResum(false)
    }
  }

  async function handleEstat(nouEstat: string) {
    setSavingEstat(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('monitoratge')
      .update({ estat_seguiment: nouEstat })
      .eq('id', doc.id)
    setSavingEstat(false)
    if (error) {
      toast.error('Error guardant l\'estat.')
    } else {
      setEstat(nouEstat)
      toast.success('Estat actualitzat.')
      if (nouEstat === 'arxivat') {
        setTimeout(() => onClose(), 800)
      }
    }
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('monitoratge')
      .update({ observacions })
      .eq('id', doc.id)
    setSaving(false)
    if (error) toast.error('Error guardant les observacions.')
    else toast.success('Observacions guardades.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={classifVariant(doc.classificacio)}>{doc.classificacio}</Badge>
              <span className="text-xs text-slate-400">{doc.font}</span>
            </div>
            <h2 className="font-semibold text-slate-800 leading-snug">{doc.titol}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Estat */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Estat del document</h4>
            <div className="flex gap-2 flex-wrap">
              {ESTATS.map(e => (
                <button
                  key={e.value}
                  onClick={() => handleEstat(e.value)}
                  disabled={savingEstat}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                    estat === e.value
                      ? `${e.color} border-current scale-105`
                      : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'
                  }`}
                >
                  {e.value === 'arxivat' && <Archive className="w-3 h-3" />}
                  {e.label}
                </button>
              ))}
            </div>
            {estat === 'arxivat' && (
              <p className="text-xs text-slate-400 mt-1.5">
                Aquest document s'arxivarà i no apareixerà a la llista principal.
              </p>
            )}
          </div>

          {/* Resum IA */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Anàlisi IA</h4>
              <button
                onClick={generarResum}
                disabled={loadingResum}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {loadingResum ? 'Analitzant...' : 'Analitzar amb IA'}
              </button>
            </div>
            {resum ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{resum}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                Clica "Analitzar amb IA" per obtenir un resum, dates, imports i punts clau del document.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-0.5">Data detecció</div>
              <div className="font-medium">{formatData(doc.data_deteccio)}</div>
            </div>
            {doc.venciment && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-0.5">Venciment</div>
                <div className={`font-medium ${colorVenciment(doc.venciment)}`}>{formatData(doc.venciment)}</div>
              </div>
            )}
            {doc.import_detectat && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-0.5">Import</div>
                <div className="font-medium">{formatImport(doc.import_detectat)}</div>
              </div>
            )}
            {doc.tema_principal && (
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-0.5">Tema</div>
                <div className="font-medium capitalize">{doc.tema_principal}</div>
              </div>
            )}
          </div>

          {doc.proposta_accio && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-600 mb-1">Proposta d'acció</div>
              <p className="text-sm text-blue-900">{doc.proposta_accio}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Observacions
              <span className="text-green-600 font-normal normal-case ml-1">(editable per tots)</span>
            </h4>
            <textarea
              value={observacions}
              onChange={e => setObservacions(e.target.value)}
              rows={3}
              placeholder="Afegeix notes, seguiment o qualsevol observació..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button onClick={save} disabled={saving}
              className="mt-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Guardant...' : 'Guardar observacions'}
            </button>
          </div>

          <a href={doc.url_original} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            <ExternalLink className="w-4 h-4" />
            Veure document original
          </a>
        </div>
      </div>
    </div>
  )
}
