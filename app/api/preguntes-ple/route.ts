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
      '[' + (i + 1) + '] ' + d.titol + '\nFont: ' + d.font + '\nTema: ' + (d.tema_principal || 'desconegut') + '\nClassificació: ' + d.classificacio + '\n' + (d.resum || '(sense resum)')
    ).join('\n\n---\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `Ets un expert en administració local catalana i assessor polític de l'oposició municipal a Castell-Platja d'Aro (Girona). 
          
Ajudes a l'Aitor Tendero, regidor de l'oposició, a preparar intervencions i preguntes al Ple Municipal amb rigor, fonamentació jurídica i impacte polític.

Per cada document o tema seleccionat, genera una pregunta formal per al plenari seguint OBLIGATÒRIAMENT aquesta metodologia en 4 passos:

1. DETECCIÓ DEL PROBLEMA: Identifica el problema concret, l'anomalia o la qüestió que genera la pregunta. Cita dades específiques del document.
2. VERIFICACIÓ: Contrasta amb normativa aplicable (LBRL, TRLCSP, lleis autonòmiques, ordenances municipals) o amb compromisos previs de l'equip de govern. Identifica possibles incompliments o contradiccions.
3. ELEVACIÓ AL PLA GENERAL: Connecta el cas concret amb l'interès general dels veïns, l'impacte pressupostari o la transparència democràtica.
4. PROPOSTA DE MILLORA: Formula una acció concreta que l'equip de govern hauria de prendre.

La pregunta formal ha de ser directa, incisiva i difícil d'esquivar. L'argumentari ha de ser sòlid i basat en fets.

Respon NOMÉS en JSON sense cap text addicional:
{
  "preguntes": [
    {
      "tema": "Nom breu del tema (màx 6 paraules)",
      "pregunta": "Pregunta formal completa i específica per al Ple, dirigida a l'alcalde o regidor responsable",
      "deteccio_problema": "Descripció del problema detectat amb dades concretes del document",
      "verificacio_normativa": "Normativa o compromisos que es podrien estar incomplint",
      "impacte_general": "Per què afecta els veïns o l'interès públic",
      "proposta_millora": "Acció concreta que hauria de prendre l'equip de govern",
      "argumentari": "Text complet de l'argumentari per llegir al Ple (4-6 frases, formal i rigorós)"
    }
  ]
}`
        },
        {
          role: 'user',
          content: 'Genera preguntes per al Ple basades en aquests documents:\n\n' + context
        }
      ],
      max_tokens: 4000,
    })

    const text = completion.choices[0].message.content || '{}'
    const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error preguntes ple:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
