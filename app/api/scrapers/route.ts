import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://plataforma-municipal.vercel.app'

    const resultats = await Promise.allSettled([
      fetch(`${base}/api/scrapers/rss`, { method: 'POST', headers: { 'Cookie': req.headers.get('cookie') || '' } }),
      fetch(`${base}/api/scrapers/contractant`, { method: 'POST', headers: { 'Cookie': req.headers.get('cookie') || '' } }),
    ])

    let nous = 0
    for (const r of resultats) {
      if (r.status === 'fulfilled') {
        const data = await r.value.json()
        nous += data.nous || 0
      }
    }

    return NextResponse.json({ ok: true, nous })
  } catch (error) {
    console.error('Error scrapers:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
