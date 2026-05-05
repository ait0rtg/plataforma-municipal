import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const res = await fetch('https://tauler.seu-e.cat/rss?idEns=1704860009', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const xml = await res.text()

    const regex = /<item>([\s\S]*?)<\/item>/g
    let match
    let nous = 0

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

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error RSS:', error)
    return NextResponse.json({ error: 'Error scraping RSS' }, { status: 500 })
  }
}
