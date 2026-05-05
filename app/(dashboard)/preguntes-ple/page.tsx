import { createClient } from '@/lib/supabase/server'
import PreguntesClient from '@/components/preguntes/PreguntesClient'

export default async function PreguntesPlePage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from('monitoratge')
    .select('id, titol, resum, font, classificacio, data_deteccio, tema_principal')
    .order('data_deteccio', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Preguntes pel Ple</h1>
        <p className="text-sm text-slate-500">Selecciona els temes i genera preguntes per al plenari</p>
      </div>
      <PreguntesClient documents={documents || []} />
    </div>
  )
}
