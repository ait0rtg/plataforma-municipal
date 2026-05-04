import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const url = 'https://analisi.transparenciacatalunya.cat/resource/ybgg-dgi6.json?codi_ine=17034&$limit=50&$order=data_adjudicacio DESC'
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()

    let nous = 0

    for (const item of data) {
      const titol = item.descripcio_contracte || item.objecte_contracte || 'Contracte sense títol'
      const importVal = parseFloat(item.import_adjudicacio || item.pressupost_licitacio || '0')
      const urlDoc = item.url_publicacio || `https://contractaciopublica.cat`

      const classificacio = importVal > 50000 ? 'URGENT' : importVal > 10000 ? 'IMPORTANT' : 'INFORMATIU'

      const { error } = await supabase.from('monitoratge').insert({
        titol: titol.trim().slice(0, 300),
        resum: `Contracte: ${item.tipus_contracte || ''}. Import: ${importVal}€. Adjudicatari: ${item.nom_adjudicatari || 'pendent'}`,
        font: 'Perfil Contractant',
        tipus_document: 'CONTRACTE',
        classificacio,
        import_detectat: importVal || null,
        url_original: urlDoc,
        data_publicacio: item.data_adjudicacio ? new Date(item.data_adjudicacio).toISOString() : new Date().toISOString(),
        tema_principal: 'CONTRACTACIÓ',
      }).select()

      if (!error) nous++
    }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error contractant:', error)
    return NextResponse.json({ error: 'Error scraping contractant' }, { status: 500 })
  }
}
