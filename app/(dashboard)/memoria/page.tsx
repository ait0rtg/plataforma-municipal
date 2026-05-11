import { createClient } from '@/lib/supabase/server'
import MemoriaClient from '@/components/memoria/MemoriaClient'

export default async function MemoriaPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('monitoratge')
    .select('id, titol, resum, font, classificacio, data_deteccio, tema_principal, import_detectat, url_original')
    .order('data_deteccio', { ascending: false })
    .limit(200)

  const { data: compromisos } = await supabase
    .from('compromisos')
    .select('id, titol, descripcio, data_compromis, termini_anunciat, estat, tema')
    .order('data_compromis', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Memòria Política</h1>
        <p className="text-sm text-slate-500">
          Connecta decisions passades amb el present. Cerca un tema i veu tot l'historial relacionat.
        </p>
      </div>
      <MemoriaClient documents={documents || []} compromisos={compromisos || []} />
    </div>
  )
}
