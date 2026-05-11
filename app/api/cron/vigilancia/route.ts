import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client admin directe — no necessita cookies, bypassa RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── Telegram ──────────────────────────────────────────────────
async function sendTelegram(missatge: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: missatge,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
  } catch (e) {
    console.error('Error Telegram:', e)
  }
}

// ── Registrar sync a la BD ───────────────────────────────────
async function logSync(supabase: any, font: string, estat: 'ok' | 'error', nous: number, missatge?: string) {
  try {
    await supabase.from('sync_log').insert({ font, estat, nous_docs: nous, missatge })
  } catch {}
}

// ── Helper: extreu tag XML ────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (plainMatch) return plainMatch[1].trim()
  return ''
}

// ── Anàlisi IA ───────────────────────────────────────────────
async function analitzaAmbIA(titol: string, contingut: string, font: string) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey || !contingut) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: `Ets l'assistent d'un regidor de l'oposició de Castell-Platja d'Aro. Analitza aquest document i respon NOMÉS en JSON.

FONT: ${font}
TÍTOL: ${titol}
TEXT: ${contingut.substring(0, 2000)}

Respon exactament:
{
  "urgencia": "URGENT" | "IMPORTANT" | "INFORMATIU",
  "resum": "2-3 línies basades en el text",
  "venciment": "YYYY-MM-DD o null",
  "import_detectat": number o null,
  "tema_principal": "urbanisme" | "contractació" | "personal" | "serveis" | "pressupost" | "registre" | "govern" | "altres",
  "per_a_l_oposicio": "una frase sobre rellevància política",
  "pregunta_ple_suggerida": "pregunta o null"
}`,
        }],
      }),
    })
    const data = await res.json()
    return JSON.parse(data.choices?.[0]?.message?.content || '{}')
  } catch {
    return null
  }
}

// ── Scraper E-Tauler RSS ──────────────────────────────────────
async function scrapeETauler(supabase: any): Promise<{ nous: number; error?: string }> {
  try {
    const res = await fetch(
      'https://tauler.seu-e.cat/api/rss?ens=1704860009&locale=ca&page=1',
      { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(20000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()

    const regex = /<item>([\s\S]*?)<\/item>/g
    let match
    let nous = 0

    while ((match = regex.exec(xml)) !== null) {
      const content = match[1]
      const titol = extractTag(content, 'title')
      const url_original = extractTag(content, 'link') || extractTag(content, 'guid')
      const dataStr = extractTag(content, 'pubDate')
      const descripcio = extractTag(content, 'description').replace(/<[^>]*>/g, '').trim()

      if (!url_original || !titol) continue

      const ia = await analitzaAmbIA(titol, descripcio, 'E-Tauler')

      const { error } = await supabase.from('monitoratge').insert({
        titol: titol.slice(0, 300),
        resum: ia?.resum || descripcio.slice(0, 500),
        font: 'E-Tauler',
        tipus_document: 'ANUNCI',
        classificacio: ia?.urgencia || 'INFORMATIU',
        url_original: url_original.trim(),
        data_deteccio: new Date().toISOString(),
        data_publicacio: dataStr ? new Date(dataStr).toISOString() : new Date().toISOString(),
        tema_principal: ia?.tema_principal || null,
        import_detectat: ia?.import_detectat || null,
        pregunta_ple_suggerida: ia?.pregunta_ple_suggerida || null,
        per_a_l_oposicio: ia?.per_a_l_oposicio || null,
        venciment: ia?.venciment || null,
      })
      if (!error) nous++
    }

    await logSync(supabase, 'E-Tauler', 'ok', nous)
    return { nous }
  } catch (e: any) {
    await logSync(supabase, 'E-Tauler', 'error', 0, e.message)
    return { nous: 0, error: `E-Tauler: ${e.message}` }
  }
}

// ── Scraper Perfil Contractant ────────────────────────────────
async function scrapeContractant(supabase: any): Promise<{ nous: number; error?: string }> {
  try {
    const url = 'https://analisi.transparenciacatalunya.cat/resource/ybgg-dgi6.json?codi_ine=17034&$limit=50&$order=data_adjudicacio DESC'
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MonitorPolitic/1.0' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    let nous = 0
    for (const item of data) {
      const titol = (item.descripcio_contracte || item.objecte_contracte || 'Contracte sense títol').slice(0, 300)
      const importVal = parseFloat(item.import_adjudicacio || item.pressupost_licitacio || '0') || null
      const urlDoc = item.url_publicacio || 'https://contractaciopublica.cat'
      const empresa = item.nom_adjudicatari || 'pendent'
      const classificacio = importVal && importVal > 50000 ? 'URGENT' : importVal && importVal > 10000 ? 'IMPORTANT' : 'INFORMATIU'

      const { error } = await supabase.from('monitoratge').insert({
        titol,
        resum: `Tipus: ${item.tipus_contracte || 'N/D'} | Import: ${importVal ? importVal.toLocaleString('ca') + '€' : 'pendent'} | Empresa: ${empresa}`,
        font: 'Perfil Contractant',
        tipus_document: 'CONTRACTE',
        classificacio,
        import_detectat: importVal,
        url_original: urlDoc,
        data_deteccio: new Date().toISOString(),
        data_publicacio: item.data_adjudicacio ? new Date(item.data_adjudicacio).toISOString() : new Date().toISOString(),
        tema_principal: 'contractació',
      })
      if (!error) nous++
    }

    await logSync(supabase, 'Perfil Contractant', 'ok', nous)
    return { nous }
  } catch (e: any) {
    await logSync(supabase, 'Perfil Contractant', 'error', 0, e.message)
    return { nous: 0, error: `Contractant: ${e.message}` }
  }
}

// ── Scraper Junta de Govern ───────────────────────────────────
async function scrapeJuntaGovern(supabase: any): Promise<{ nous: number; error?: string }> {
  try {
    const res = await fetch(
      'https://ciutada.platjadaro.com/wp-json/wp/v2/media?search=ACTA-JGL&per_page=20&mime_type=application/pdf&orderby=date&order=desc',
      { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(20000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const items = await res.json()
    if (!Array.isArray(items)) throw new Error('Resposta no esperada')

    let nous = 0
    for (const item of items) {
      const titol = (item.title?.rendered || 'Acta JGL').slice(0, 300)
      const url = item.source_url
      const data = item.date || new Date().toISOString()
      if (!url) continue

      const { error } = await supabase.from('monitoratge').insert({
        titol,
        resum: `Acta de la Junta de Govern Local del ${new Date(data).toLocaleDateString('ca-ES')}`,
        font: 'Junta de Govern',
        tipus_document: 'ACORD',
        classificacio: 'IMPORTANT',
        url_original: url,
        data_deteccio: new Date().toISOString(),
        data_publicacio: new Date(data).toISOString(),
        tema_principal: 'govern',
      })
      if (!error) nous++
    }

    await logSync(supabase, 'Junta de Govern', 'ok', nous)
    return { nous }
  } catch (e: any) {
    await logSync(supabase, 'Junta de Govern', 'error', 0, e.message)
    return { nous: 0, error: `Junta Govern: ${e.message}` }
  }
}

// ── Scraper BPM Decrets d'Alcaldia ───────────────────────────
async function scrapeBPMDecrets(supabase: any): Promise<{ nous: number; error?: string }> {
  try {
    const avui = new Date()
    const any = avui.getFullYear()
    const mes = String(avui.getMonth() + 1).padStart(2, '0')

    const res = await fetch(
      `https://bpm.platjadaro.cat/OAC/exp/decrets/${any}/${mes}`,
      { headers: { 'User-Agent': 'MonitorPolitic/1.0' }, signal: AbortSignal.timeout(20000) }
    )

    if (!res.ok) {
      await logSync(supabase, 'BPM Decrets', 'error', 0, `HTTP ${res.status}`)
      return { nous: 0, error: `BPM: HTTP ${res.status}` }
    }

    const html = await res.text()
    const regex = /href="(\/OAC\/downloadR\/[a-f0-9-]{36})"[^>]*>([^<]+)</gi
    let match
    let nous = 0

    while ((match = regex.exec(html)) !== null) {
      const urlPath = match[1]
      const titol = match[2].trim().slice(0, 300)
      const urlDoc = `https://bpm.platjadaro.cat${urlPath}`

      if (!titol || titol.length < 3) continue

      const ia = await analitzaAmbIA(titol, '', 'BPM Decrets')

      const { error } = await supabase.from('monitoratge').insert({
        titol,
        resum: ia?.resum || `Decret d'Alcaldia: ${titol}`,
        font: 'BPM Decrets',
        tipus_document: 'DECRET',
        classificacio: ia?.urgencia || 'INFORMATIU',
        url_original: urlDoc,
        data_deteccio: new Date().toISOString(),
        data_publicacio: new Date().toISOString(),
        tema_principal: ia?.tema_principal || null,
        pregunta_ple_suggerida: ia?.pregunta_ple_suggerida || null,
      })
      if (!error) nous++
    }

    await logSync(supabase, 'BPM Decrets', 'ok', nous)
    return { nous }
  } catch (e: any) {
    await logSync(supabase, 'BPM Decrets', 'error', 0, e.message)
    return { nous: 0, error: `BPM: ${e.message}` }
  }
}

// ── Handler principal GET ─────────────────────────────────────
export async function GET(request: Request) {
  // Verificació de seguretat: Vercel envia CRON_SECRET com a Bearer token
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const inici = Date.now()
  const supabase = getAdminClient()

  console.log('[CRON] Iniciant vigilància municipal...')

  // Executar tots els scrapers en paral·lel
  const [etauler, contractant, juntagovern, bpm] = await Promise.all([
    scrapeETauler(supabase),
    scrapeContractant(supabase),
    scrapeJuntaGovern(supabase),
    scrapeBPMDecrets(supabase),
  ])

  const totalNous = etauler.nous + contractant.nous + juntagovern.nous + bpm.nous
  const errors = [etauler.error, contractant.error, juntagovern.error, bpm.error].filter(Boolean)
  const durada = ((Date.now() - inici) / 1000).toFixed(1)

  // Notificació Telegram
  if (totalNous > 0) {
    await sendTelegram(
      `✅ <b>Vigilància completada</b>\n\n` +
      `📊 <b>${totalNous} nous documents</b>\n` +
      `  • E-Tauler: ${etauler.nous}\n` +
      `  • Contractant: ${contractant.nous}\n` +
      `  • Junta Govern: ${juntagovern.nous}\n` +
      `  • BPM Decrets: ${bpm.nous}\n` +
      `⏱ ${durada}s`
    )
  }

  if (errors.length > 0) {
    await sendTelegram(
      `⚠️ <b>Errors en la vigilància</b>\n${errors.map(e => `  • ${e}`).join('\n')}`
    )
  }

  console.log(`[CRON] Completat: ${totalNous} nous documents en ${durada}s`)

  return NextResponse.json({
    ok: true,
    nous: totalNous,
    resum: { etauler: etauler.nous, contractant: contractant.nous, juntagovern: juntagovern.nous, bpm: bpm.nous },
    errors,
    durada_segons: parseFloat(durada),
  })
}
