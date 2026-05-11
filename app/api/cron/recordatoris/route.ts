import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function sendTelegram(missatge: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: missatge, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const supabase = getAdminClient()
  const avui = new Date().toISOString().split('T')[0]
  const en7dies = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const { data: venciments } = await supabase
    .from('monitoratge')
    .select('titol, venciment, classificacio, url_original')
    .gte('venciment', avui)
    .lte('venciment', en7dies)
    .eq('estat_seguiment', 'pendent')
    .order('venciment', { ascending: true })

  const { data: compromisos } = await supabase
    .from('compromisos')
    .select('titol, termini_anunciat, estat')
    .gte('termini_anunciat', avui)
    .lte('termini_anunciat', en7dies)
    .in('estat', ['pendent', 'en_curs'])
    .order('termini_anunciat', { ascending: true })

  const total = (venciments?.length || 0) + (compromisos?.length || 0)
  if (total === 0) return NextResponse.json({ ok: true, alertes: 0 })

  let missatge = `📅 <b>Recordatoris del dia ${new Date().toLocaleDateString('ca-ES')}</b>\n\n`

  if (venciments && venciments.length > 0) {
    missatge += `⏰ <b>Venciments en 7 dies (${venciments.length})</b>\n`
    venciments.forEach(v => {
      const icon = v.classificacio === 'URGENT' ? '🔴' : v.classificacio === 'IMPORTANT' ? '🟠' : '🟡'
      missatge += `${icon} ${v.titol?.slice(0, 60)} — <b>${v.venciment}</b>\n`
    })
    missatge += '\n'
  }

  if (compromisos && compromisos.length > 0) {
    missatge += `📋 <b>Compromisos a revisar (${compromisos.length})</b>\n`
    compromisos.forEach(c => {
      missatge += `• ${c.titol?.slice(0, 60)} — <b>${c.termini_anunciat}</b>\n`
    })
  }

  await sendTelegram(missatge)
  return NextResponse.json({ ok: true, alertes: total })
}
