import { createClient } from '@/lib/supabase/server'
import AlegacionsClient from '@/components/alegacions/AlegacionsClient'

export default async function AlegacionsPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('monitoratge')
    .select('id, titol, resum, font, classificacio, data_deteccio, tema_principal, import_detectat, url_original, per_a_l_oposicio')
    .in('classificacio', ['URGENT', 'IMPORTANT'])
    .order('data_deteccio', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Generador d'Al·legacions</h1>
        <p className="text-sm text-slate-500">
          Selecciona un document i genera un esborrany d'intervenció, al·legació o pregunta formal per al ple.
        </p>
      </div>
      <AlegacionsClient documents={documents || []} />
    </div>
  )
}
