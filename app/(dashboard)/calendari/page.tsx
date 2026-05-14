import { createClient } from '@/lib/supabase/server'
import CalendariClient from '@/components/calendari/CalendariClient'

export default async function CalendariPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('monitoratge')
    .select(
      'id, titol, font, classificacio, data_publicacio, venciment, data_deteccio, url_original, tema_principal'
    )
    .neq('estat_seguiment', 'arxivat')
    .order('data_publicacio', { ascending: true })

  const { data: compromisosRaw } = await supabase
    .from('compromisos')
    .select('id, titol, data_limit, estat, prioritat')
    .neq('estat', 'FET')

  const { data: eventsProis } = await supabase
    .from('calendari_events')
    .select(
      'id, titol, descripcio, data_inici, data_fi, tot_dia, color, tipus_cita, assistents, recordatori_actiu, recordatori_minuts'
    )
    .order('data_inici', { ascending: true })

  const { data: usuaris } = await supabase
    .from('usuaris')
    .select('id, nom, email')
    .order('nom', { ascending: true })

  const compromisos =
    compromisosRaw?.map((c) => ({
      ...c,
      termini_anunciat: c.data_limit,
    })) || []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Calendari</h1>
        <p className="text-sm text-slate-500">
          Tots els events, venciments i recordatoris
        </p>
      </div>

      <CalendariClient
        documents={documents || []}
        compromisos={compromisos}
        eventsProis={eventsProis || []}
        usuaris={usuaris || []}
      />
    </div>
  )
}
