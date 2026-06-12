import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 55000,
})

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { consulta, historial } = await request.json()
    if (!consulta) return NextResponse.json({ error: 'Consulta buida' }, { status: 400 })

    const adminSupabase = createAdminClient()
    const { data: lleis } = await adminSupabase
      .from('lleis_context')
      .select('titol, contingut')
      .eq('activa', true)
      .order('created_at', { ascending: true })

    const contextLleis = lleis && lleis.length > 0
      ? '\n\nMARCS LEGALS DE REFERÈNCIA:\n' + lleis.map(l => '--- ' + l.titol + ' ---\n' + l.contingut).join('\n\n')
      : ''

    const systemPrompt = 'Ets un assessor polític expert especialitzat en administració local catalana. Ajudes a Aitor Tendero, regidor de l\'oposició a l\'Ajuntament de Castell-Platja d\'Aro (Girona).\n\nPots ajudar amb: normativa municipal i autonòmica, estratègies polítiques, redacció de preguntes i mocions per al ple, interpretació de documents administratius, contractació pública, urbanisme, i qualsevol tema d\'interès municipal.\n\nRespon sempre en català. Sigues directe, pràctic i útil. Quan sigui rellevant, cita normativa específica amb articles concrets.' + contextLleis

    const missatgesHistorial = (historial || []).slice(-10)

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...missatgesHistorial.map((m: { rol: string; text: string }) => ({
        role: m.rol === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      })),
      { role: 'user', content: consulta }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.2,
    })

    return NextResponse.json({ resposta: completion.choices[0].message.content })
  } catch (error: any) {
    console.error('Error assessor:', error)
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      return NextResponse.json({ error: 'La consulta ha trigat massa. Prova de simplificar la pregunta.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
