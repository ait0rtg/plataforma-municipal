import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  return ''
}

async function scrapeRSS(url: string, font: string, tipus: string, adminSupabase: any) {
  let nous = 0
  const res = await fetch(url, { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(15000) })
  const xml = await res.text()
  const regex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    const content = match[1]
    const titol = extractTag(content, 'title')
    const url_original = extractTag(content, 'link') || extractTag(content, 'guid')
    const dataStr = extractTag(content, 'pubDate')
    const descripcio = extractTag(content, 'description').replace(/<[^>]*>/g, '').trim()

    if (!url_original || !titol) continue

    const { error } = await adminSupabase.from('monitoratge').insert({
      titol: titol.slice(0, 300),
      resum: descripcio.slice(0, 500),
      font,
      tipus_document: tipus,
      classificacio: 'INFORMATIU',
      url_original: url_original.trim(),
      data_deteccio: new Date().toISOString(),
      data_publicacio: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
    })
    if (!error) nous++
  }
  return nous
}

export async function POST() {
  try {
    // Verificar que l'usuari està autenticat
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const adminSupabase = getAdminClient()
    let nous = 0

    // E-Tauler RSS
    try {
      nous += await scrapeRSS(
        'https://tauler.seu-e.cat/api/rss?ens=1704860009&locale=ca&page=1',
        'E-Tauler', 'ANUNCI', adminSupabase
      )
    } catch (e) { console.error('Error E-Tauler:', e) }

    // Junta de Govern (WordPress API)
    try {
      const res = await fetch(
        'https://ciutada.platjadaro.com/wp-json/wp/v2/media?search=ACTA-JGL&per_page=10&mime_type=application/pdf&orderby=date&order=desc',
        { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(15000) }
      )
      if (res.ok) {
        const items = await res.json()
        for (const item of items) {
          if (!item.source_url) continue
          const { error } = await adminSupabase.from('monitoratge').insert({
            titol: (item.title?.rendered || 'Acta JGL').slice(0, 300),
            resum: `Acta de la Junta de Govern Local del ${new Date(item.date).toLocaleDateString('ca-ES')}`,
            font: 'Junta de Govern',
            tipus_document: 'ACORD',
            classificacio: 'IMPORTANT',
            url_original: item.source_url,
            data_deteccio: new Date().toISOString(),
            data_publicacio: new Date(item.date).toISOString(),
            tema_principal: 'govern',
          })
          if (!error) nous++
        }
      }
    } catch (e) { console.error('Error Junta Govern:', e) }

    // Perfil Contractant (Open Data API)
    try {
      const url = 'https://analisi.transparenciacatalunya.cat/resource/ybgg-dgi6.json?codi_ine=17034&$limit=20&$order=data_adjudicacio DESC'
      const res = await fetch(url, { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const data = await res.json()
        for (const item of data) {
          const titol = (item.descripcio_contracte || 'Contracte').slice(0, 300)
          const importVal = parseFloat(item.import_adjudicacio || '0') || null
          const classificacio = importVal && importVal > 50000 ? 'URGENT' : importVal && importVal > 10000 ? 'IMPORTANT' : 'INFORMATIU'
          const { error } = await adminSupabase.from('monitoratge').insert({
            titol,
            resum: `Import: ${importVal ? importVal.toLocaleString('ca') + '€' : 'pendent'} | Empresa: ${item.nom_adjudicatari || 'pendent'}`,
            font: 'Perfil Contractant',
            tipus_document: 'CONTRACTE',
            classificacio,
            import_detectat: importVal,
            url_original: item.url_publicacio || 'https://contractaciopublica.cat',
            data_deteccio: new Date().toISOString(),
            data_publicacio: item.data_adjudicacio ? new Date(item.data_adjudicacio).toISOString() : new Date().toISOString(),
            tema_principal: 'contractació',
          })
          if (!error) nous++
        }
      }
    } catch (e) { console.error('Error Contractant:', e) }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error scrapers:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
