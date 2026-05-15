import { getAdminClient } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import IAClient from '@/components/ia/IAClient'

type SearchParams = {
  tab?: string
}

function normalitzarTab(tab?: string) {
  if (tab === 'assessor' || tab === 'memoria' || tab === 'alegacions') return tab
  return 'assistent'
}

export default async function IAPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('assessor_sessions')
    .select('id, titol, created_at, updated_at, missatges')
    .order('updated_at', { ascending: false })
    .limit(20)

  const admin = getAdminClient()
  const [{ data: documents }, { data: compromisos }] = await Promise.all([
    admin
      .from('monitoratge')
      .select('id, titol, resum, contingut_complet, font, classificacio, data_deteccio, tema_principal, import_detectat, url_original, per_a_l_oposicio, punts_clau, impacte_politic')
      .or('ocult.is.null,ocult.eq.false')
      .neq('estat_seguiment', 'tancat')
      .order('data_deteccio', { ascending: false })
      .limit(500),
    admin
      .from('compromisos')
      .select('id, titol, descripcio, data_compromis, termini_anunciat, estat, tema')
      .order('data_compromis', { ascending: false }),
  ])

  return (
    <IAClient
      initialTab={normalitzarTab(params.tab)}
      sessions={sessions || []}
      documents={documents || []}
      compromisos={compromisos || []}
    />
  )
}
