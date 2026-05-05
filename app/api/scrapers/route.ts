import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    let nous = 0

    // --- SCRAPER 1: E-Tauler RSS ---
    try {
      const res = await fetch('https://tauler.seu-e.cat/rss?idEns=1704860009', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const xml = await res.text()
      const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))

      for (const item of items) {
        const content = item[1]
        const titol = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
          || content.match(/<title>(.*?)<\/title>/)?.[1] || 'Sense títol'
        const url = content.match(/<link>(.*?)<\/link>/)?.[1]
          || content.match(/<guid>(.*?)<\/guid>/)?.[1] || ''
        const dataStr = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const descripcio = content.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
          || content.match(/<description>(.*?)<\/description>/)?.[1] || ''

        if (!url) continue

        const { error } = await supabase.from('monitoratge').insert({
          titol: titol.trim().slice(0, 300),
          resum: descripcio.replace(/<[^>]*>/g, '').trim().slice(0, 500),
          font: 'E-Tauler',
          tipus_document: 'ANUNCI',
          classificacio: 'INFORMATIU',
          url_original: url.trim(),
          data_publicacio: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
        })

        if (!error) nous++
      }
    } catch (e) {
      console.error('Error RSS:', e)
    }

    // --- SCRAPER 2: Perfil Contractant ---
    try {
      const url = 'https://analisi.transparenciacatalunya.cat/resource/ybgg-dgi6.json?codi_ine=17048&$limit=50&$order=data_adjudicacio DESC'
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const data = await res.json()

      for (const item of data) {
        const titol = item.descripcio_contracte || item.objecte_contracte || 'Contracte sense títol'
        const importVal = parseFloat(item.import_adjudicacio || item.pressupost_licitacio || '0')
        const urlDoc = item.url_publicacio || 'https://contractaciopublica.cat'
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
        })

        if (!error) nous++
      }
    } catch (e) {
      console.error('Error contractant:', e)
    }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error scrapers:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
