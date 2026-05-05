import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  return ''
}

async function scrapeRSS(url: string, font: string, tipus: string, adminSupabase: any) {
  let nous = 0
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const xml = await res.text()
  const regex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    const content = match[1]
    const titol = extractTag(content, 'title')
    const url_original = extractTag(content, 'link') || extractTag(content, 'guid')
    const dataStr = extractTag(content, 'pubDate')
    const descripcio = extractTag(content, 'description')

    if (!url_original || !titol) continue

    const { error } = await adminSupabase.from('monitoratge').insert({
      titol: titol.slice(0, 300),
      resum: descripcio.replace(/<[^>]*>/g, '').trim().slice(0, 500),
      font,
      tipus_document: tipus,
      classificacio: 'INFORMATIU',
      url_original: url_original.trim(),
      data_publicacio: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
    })

    if (!error) nous++
  }
  return nous
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const adminSupabase = await createAdminClient()
    let nous = 0

    // E-Tauler
    try {
      nous += await scrapeRSS(
        'https://tauler.seu-e.cat/api/rss?ens=1704860009&locale=ca&page=1',
        'E-Tauler', 'ANUNCI', adminSupabase
      )
    } catch (e) { console.error('Error E-Tauler:', e) }

    // Ajuntament
    try {
      nous += await scrapeRSS(
        'https://ciutada.platjadaro.com/feed/',
        'Ajuntament', 'NOTÍCIA', adminSupabase
      )
    } catch (e) { console.error('Error Ajuntament:', e) }

    // Perfil Contractant
    try {
      const res = await fetch('https://contractaciopublica.cat/ca/perfils-contractant/detall/3156875?categoria=0', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const html = await res.text()
      const regex = /<tr[^>]*>([\s\S]*?)<\/tr>/g
      let match

      while ((match = regex.exec(html)) !== null) {
        const row = match[1]
        if (!row.includes('<td')) continue

        const cols = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((m: RegExpExecArray) =>
          m[1].replace(/<[^>]*>/g, '').trim()
        )

        if (cols.length < 2 || !cols[0]) continue

        const titol = cols[0].slice(0, 300)
        const importStr = cols.find((c: string) => /\d+[\.,]\d+/.test(c)) || ''
        const importVal = parseFloat(importStr.replace(/[^\d,.]/g, '').replace(',', '.')) || 0
        const urlMatch = row.match(/href="([^"]+)"/)
        const urlDoc = urlMatch
          ? `https://contractaciopublica.cat${urlMatch[1]}`
          : 'https://contractaciopublica.cat/ca/perfils-contractant/detall/3156875'

        const classificacio = importVal > 50000 ? 'URGENT' : importVal > 10000 ? 'IMPORTANT' : 'INFORMATIU'

        const { error } = await adminSupabase.from('monitoratge').insert({
          titol,
          resum: `Import: ${importVal}€`,
          font: 'Perfil Contractant',
          tipus_document: 'CONTRACTE',
          classificacio,
          import_detectat: importVal || null,
          url_original: urlDoc,
          data_publicacio: new Date().toISOString(),
          tema_principal: 'CONTRACTACIÓ',
        })

        if (!error) nous++
      }
    } catch (e) { console.error('Error Contractant:', e) }

    // Acords Junta de Govern — via WordPress API
    try {
      let page = 1
      let continuar = true

      while (continuar) {
        const res = await fetch(
          `https://ciutada.platjadaro.com/wp-json/wp/v2/media?search=ACTA-JGL&per_page=100&page=${page}&mime_type=application/pdf&orderby=date&order=desc`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )

        if (!res.ok) break
        const items = await res.json()
        if (!items.length) break

        for (const item of items) {
          const titol = item.title?.rendered || 'Acord JGL'
          const url = item.source_url
          const data = item.date || new Date().toISOString()

          if (!url) continue

          const { error } = await adminSupabase.from('monitoratge').insert({
            titol: titol.slice(0, 300),
            resum: `Acta de la Junta de Govern Local de ${new Date(data).toLocaleDateString('ca-ES')}`,
            font: 'Junta de Govern',
            tipus_document: 'ACORD',
            classificacio: 'IMPORTANT',
            url_original: url,
            data_publicacio: new Date(data).toISOString(),
            tema_principal: 'GOVERN',
          })

          if (!error) nous++
        }

        if (items.length < 100) continuar = false
        else page++
      }
    } catch (e) { console.error('Error Junta Govern:', e) }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error scrapers:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
