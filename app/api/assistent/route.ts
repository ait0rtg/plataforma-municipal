import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { consulta } = await request.json()
    if (!consulta) return NextResponse.json({ error: 'Consulta buida' }, { status: 400 })

    const { data: documents } = await supabase
      .from('monitoratge')
      .select('titol, tipus_document, resum, contingut_text, data_publicacio, import_economic, font, url_original')
      .order('data_publicacio', { ascending: false })
      .limit(20)

    const context = (documents || [])
      .map((d, i) => `[${i + 1}] ${d.tipus_document} - ${d.titol} (${d.data_publicacio})\n${d.resum || d.contingut_text?.slice(0, 300) || ''}`)
      .join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Ets un assistent polític especialitzat en l'Ajuntament de Castell-Platja d'Aro. Analitzes documents municipals i ajudes a un regidor de l'oposició. Respon sempre en català. Sigues concís i pràctic.`
        },
        {
          role: 'user',
          content: `Consulta: ${consulta}\n\nDocuments recents:\n${context}`
        }
      ],
      max_tokens: 1000
    })

    return NextResponse.json({ resposta: completion.choices[0].message.content })
  } catch (error) {
    console.error('Error assistent:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
