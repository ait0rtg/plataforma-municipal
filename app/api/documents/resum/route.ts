import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { id, titol, contingut } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ets un assistent polític. Fes un resum concís en màxim 10 línies del document municipal. Respon en català. Destaca els punts clau i les implicacions polítiques si n\'hi ha.'
        },
        {
          role: 'user',
          content: `Títol: ${titol}\n\nContingut: ${contingut || 'No disponible'}`
        }
      ],
      max_tokens: 500,
    })

    const resum = completion.choices[0].message.content || ''
    await supabase.from('monitoratge').update({ resum }).eq('id', id)
    return NextResponse.json({ resum })
  } catch (error) {
    console.error('Error resum:', error)
    return NextResponse.json({ error: 'Error generant resum' }, { status: 500 })
  }
}
