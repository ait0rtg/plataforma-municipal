import { createClient } from '@/lib/supabase/server'
import CalendariClient from '@/components/calendari/CalendariClient'

export default async function CalendariPage() {
  const supabase = await createClient()

  const avui = new Date().toISOString().split('T')[0]
  const en6mesos = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: documents },
    { data: compromisosRaw },
    { data: eventsProis },
    { data: usuaris },
  ] = await Promise.all([
    supabase
      .from('monitoratge')
      .select('id, titol, font, classificacio, data_publicacio, venciment, data_deteccio, url_original, tema_principal')
      .neq('estat_seguiment', 'arxivat')
      .order('data_deteccio', { ascending: false }),
    supabase
      .from('compromisos')
      .select('id, titol, data_limit, estat, prioritat')
      .neq('estat', 'complet'),
    supabase
      .from('calendari_events')
      .select('id, titol, descripcio, data_inici, data_fi, tot_dia, color, tipus_cita, assistents, recordatori_actiu, recordatori_minuts')
      .order('data_inici', { ascending: true }),
    supabase
      .from('usuaris')
      .select('id, nom, email')
      .order('nom', { ascending: true }),
  ])

  // Generar Juntes de Govern futures automàticament (cada dilluns)
  const juntesExistents = new Set(
    (eventsProis || [])
      .filter(e => e.titol.startsWith('Junta de Govern'))
      .map(e => e.data_inici.split('T')[0])
  )

  const juntesNoves: any[] = []
  const cursor = new Date()
  // Avançar fins al proper dilluns
  while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1)

  for (let i = 0; i < 26; i++) { // 6 mesos de dilluns
    const dataStr = cursor.toISOString().split('T')[0]
    if (!juntesExistents.has(dataStr)) {
      juntesNoves.push({
        titol: 'Junta de Govern',
        descripcio: 'Sessió ordinària setmanal de la Junta de Govern Local',
        data_inici: dataStr,
        data_fi: dataStr,
        tot_dia: true,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        tipus_cita: 'altres',
      })
    }
    cursor.setDate(cursor.getDate() + 7)
  }

  if (juntesNoves.length > 0) {
    // Inserir sense user_id (events globals visibles per a tothom)
    await supabase.from('calendari_events').insert(juntesNoves)
  }

  // Tornar a carregar events amb les juntes noves incloses
  const { data: eventsActualitzats } = await supabase
    .from('calendari_events')
    .select('id, titol, descripcio, data_inici, data_fi, tot_dia, color, tipus_cita, assistents, recordatori_actiu, recordatori_minuts')
    .order('data_inici', { ascending: true })

  const compromisos = (compromisosRaw || []).map((c) => ({
    ...c,
    termini_anunciat: c.data_limit,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Calendari</h1>
        <p className="text-sm text-slate-500">
          Tots els events, venciments i terminis detectats
        </p>
      </div>
      <CalendariClient
        documents={documents || []}
        compromisos={compromisos}
        eventsProis={eventsActualitzats || []}
        usuaris={usuaris || []}
      />
    </div>
  )
}
