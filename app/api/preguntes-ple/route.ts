import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { documents } = await req.json()
    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'Cap document seleccionat' }, { status: 400 })
    }

    const context = documents.map((d: any, i: number) =>
      `[${i + 1}] ${d.titol}\nFont: ${d.font}\n${d.resum || ''}`
    ).join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Ets un assessor polític expert en administració local catalana. Ajudes a Aitor Tendero, regidor de l'oposició a l'Ajuntament de Castell-Platja d'Aro.

Per cada document o tema seleccionat, genera una pregunta formal per al plenari municipal i un argumentari de suport.

Respon NOMÉS en JSON amb aquest format exacte, sense cap text addicional:
{
  "preguntes": [
    {
      "tema": "Nom breu del tema",
      "pregunta": "Pregunta formal completa per al ple, dirigida a l'equip de govern",
      "argumentari": "Breu argumentari de 2-3 frases que justifica la pregunta i en destaca la importància"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Genera preguntes per al ple basades en aquests documents:\n\n${context}`
        }
      ],
      max_tokens: 2000,
    })

    const text = completion.choices[0].message.content || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error preguntes ple:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
