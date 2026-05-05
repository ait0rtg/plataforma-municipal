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
      const res = await fetch('https://tauler.seu-e.cat/api/rss?ens=1704860009&locale=ca&page=1', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const xml = await res.text()
      const regex = /<item>([\s\S]*?)<\/item>/g
      let match

      while ((match = regex.exec(xml)) !== null) {
        const content = match[1]
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
      console.error('Error E-Tauler:', e)
    }

    // --- SCRAPER 2: Web Ajuntament RSS ---
    try {
      const res = await fetch('https://ciutada.platjadaro.com/feed/', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const xml = await res.text()
      const regex = /<item>([\s\S]*?)<\/item>/g
      let match

      while ((match = regex.exec(xml)) !== null) {
        const content = match[1]
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
          font: 'Ajuntament',
          tipus_document: 'NOTÍCIA',
          classificacio: 'INFORMATIU',
          url_original: url.trim(),
          data_publicacio: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
        })

        if (!error) nous++
      }
    } catch (e) {
      console.error('Error Ajuntament RSS:', e)
    }

    // --- SCRAPER 3: Perfil Contractant ---
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

        const cols = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map(m =>
          m[1].replace(/<[^>]*>/g, '').trim()
        )

        if (cols.length < 2 || !cols[0]) continue

        const titol = cols[0].slice(0, 300)
        const importStr = cols.find(c => /\d+[\.,]\d+/.test(c)) || ''
        const importVal = parseFloat(importStr.replace(/[^\d,.]/g, '').replace(',', '.')) || 0
        const urlMatch = row.match(/href="([^"]+)"/)
        const urlDoc = urlMatch
          ? `https://contractaciopublica.cat${urlMatch[1]}`
          : 'https://contractaciopublica.cat/ca/perfils-contractant/detall/3156875'

        const classificacio = importVal > 50000 ? 'URGENT' : importVal > 10000 ? 'IMPORTANT' : 'INFORMATIU'

        const { error } = await supabase.from('monitoratge').insert({
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
    } catch (e) {
      console.error('Error Contractant:', e)
    }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error scrapers:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
