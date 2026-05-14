'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UploadDocumentButton({ isAdmin }: { isAdmin: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!isAdmin) return null

  async function handleFile(file?: File) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Només es poden pujar PDFs.')
      return
    }

    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('titol', file.name.replace(/\.pdf$/i, ''))
      form.append('font', 'PDF intern')

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error pujant el PDF.')

      toast.success('PDF llegit i analitzat correctament.')
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Llegint PDF...' : 'Pujar PDF'}
      </button>
    </>
  )
}
