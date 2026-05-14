'use client'

import { useState } from 'react'
import { X, ExternalLink, Sparkles, Archive, EyeOff, Eye } from 'lucide-react'
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
]

export default function DocumentModal({ doc, isAdmin, onClose }: {
  doc: Document
  isAdmin: boolean
  onClose: () => void
}) {
  const [observacions, setObservacions] = useState(doc.observacions || '')
  const [saving, setSaving] = useState(false)
  const [resum, setResum] = useState(doc.resum || '')
  const [puntsClau, setPuntsClau] = useState<string[]>(doc.punts_clau || [])
  const [impactePolitic, setImpactePolitic] = useState(doc.impacte_politic || '')
  const [loadingResum, setLoadingResum] = useState(false)
  const [estat, setEstat] = useState<string>(doc.estat_seguiment || 'pendent')
  const [ocult, setOcult] = useState(Boolean(doc.ocult))
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
          font: doc.font,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generant el resum.')

      setResum(data.resum || '')
      setPuntsClau(data.punts_clau || [])
      setImpactePolitic(data.impacte_politic || '')
      toast.success('Document llegit i analitzat correctament.')
    } catch (error: any) {
      toast.error(error.message || 'Error de connexió.')
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
      toast.error('Error guardant l’estat.')
    } else {
      setEstat(nouEstat)
      toast.success('Estat actualitzat.')
      if (nouEstat === 'tancat') setTimeout(() => onClose(), 800)
    }
  }

  async function toggleOcult() {
    if (!isAdmin) return

    const nouValor = !ocult
    setOcult(nouValor)

    const res = await fetch('/api/documents/editar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, ocult: nouValor }),
    })

    if (!res.ok) {
      setOcult(!nouValor)
      toast.error('No s’ha pogut actualitzar la visibilitat.')
      return
    }

    toast.success(nouValor ? 'Document ocultat.' : 'Document visible.')
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
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={classifVariant(doc.classificacio)}>{doc.classificacio}</Badge>
              <span className="text-xs text-slate-400">{doc.font}</span>
              {doc.estat_lectura_pdf === 'llegit' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">PDF llegit</span>
              )}
              {ocult && (
                <span className="text-xs bg-slate-200 text-slate-
