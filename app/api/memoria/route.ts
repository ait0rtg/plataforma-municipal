import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { tema, documents, compromisos } = await req.json()

    const contextDocs = documents.slice(0, 10).map((d: any, i: number) =>
      `[DOC ${i + 1}] ${d.font} · ${d.data_deteccio?.split('T')[0]}\n${d.titol}\n${d.resum || ''}`
    ).join('\n\n')

    const contextCompromisos = compromisos.map((c: any) =>
      `[COMPROMÍS] ${c.titol} (estat: ${c.estat}, termini: ${c.termini_anunciat || 'N/D'})`
    ).join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Ets un assessor polític expert. Analitza l'historial polític sobre el tema "${tema}" a l'Ajuntament de Castell-Platja d'Aro.

DOCUMENTS TROBATS:
${contextDocs}

COMPROMISOS RELACIONATS:
${contextCompromisos || 'Cap compromís registrat'}

Genera una síntesi política concisa (màxim 300 paraules) que inclogui:
1. Cronologia de decisions clau
2. Patrons o tendències detectats
3. Compromisos incomplertes si n'hi ha
4. Punts de vulnerabilitat del govern sobre aquest tema
5. Recomanació estratègica per a l'oposició

Respon en català, directe i sense introducció.`,
      }],
    })

    return NextResponse.json({ analisi: completion.choices[0].message.content || '' })
  } catch (error) {
    console.error('Error memòria:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
