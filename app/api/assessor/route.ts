import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { consulta, historial } = await request.json()
    if (!consulta) return NextResponse.json({ error: 'Consulta buida' }, { status: 400 })

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Ets un assessor polític expert especialitzat en administració local catalana. Ajudes a Aitor Tendero, regidor de l'oposició a l'Ajuntament de Castell-Platja d'Aro (Girona). 
        
Pots ajudar amb: normativa municipal i autonòmica, estratègies polítiques, redacció de preguntes i mocions per al ple, interpretació de documents administratius, contractació pública, urbanisme, i qualsevol tema d'interès municipal.

Respon sempre en català. Sigues directe, pràctic i útil. Quan sigui rellevant, cita normativa específica.`
      },
      ...(historial || []).map((m: { rol: string; text: string }) => ({
        role: m.rol === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      })),
      { role: 'user', content: consulta }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1500,
    })

    return NextResponse.json({ resposta: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error assessor:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
