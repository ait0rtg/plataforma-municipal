import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PROMPTS: Record<string, string> = {
  intervencio: `Genera una intervenció oral per al ple municipal. Ha de tenir:
- Salutació protocol·lària breu
- Introducció al tema (2-3 frases)
- Cos argumentatiu amb 3-4 punts sòlids
- Pregunta o petició concreta al govern
- Tancament
Durada aproximada: 3-4 minuts de lectura. Tona: formal però directe.`,

  pregunta_escrita: `Genera una pregunta escrita formal per a l'Ajuntament. Ha de tenir:
- Referència al document o acord que motiva la pregunta
- Antecedents rellevants (1-2 paràgrafs)
- La pregunta concreta (màxim 3 preguntes relacionades)
- Peu: "Castell-Platja d'Aro, [data]" i espai per signatura
Format oficial, tona formal.`,

  alegacio: `Genera una al·legació formal contra la decisió municipal. Ha de tenir:
- Encapçalament: "Al/A la [càrrec], l'infrascrit/a..."
- Exposició dels fets
- Fonamentació jurídica si escau (menciona genèricament la Llei de Bases de Règim Local)
- Al·legació concreta
- Sol·licitud expressa
- Peu amb data i signatura
Tona: formal jurídic.`,

  moció: `Genera una moció per al ple municipal. Ha de tenir:
- Títol: "MOCIÓ QUE PRESENTA [GRUP MUNICIPAL] SOBRE..."
- Exposició de motius (3-4 paràgrafs)
- Part dispositiva amb punts numerats (acords que es proposen)
- Peu: data, grup municipal i espai per signatures
Tona: formal parlamentari.`,
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { document: doc, tipus, instruccions } = await req.json()
    if (!doc || !tipus) return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 })

    const promptTipus = PROMPTS[tipus] || PROMPTS.intervencio

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: `Ets un assessor polític expert en administració local catalana. Redactes documents polítics per a Aitor Tendero, regidor de l'oposició de l'Ajuntament de Castell-Platja d'Aro. Respon sempre en català formal.`,
        },
        {
          role: 'user',
          content: `DOCUMENT BASE:
Font: ${doc.font}
Data: ${doc.data_deteccio?.split('T')[0]}
Títol: ${doc.titol}
Resum: ${doc.resum || '(sense resum)'}
${doc.import_detectat ? `Import: ${Number(doc.import_detectat).toLocaleString('ca-ES')}€` : ''}
${doc.per_a_l_oposicio ? `Rellevància política: ${doc.per_a_l_oposicio}` : ''}
URL: ${doc.url_original}

TIPUS DE DOCUMENT: ${tipus}
${instruccions ? `INSTRUCCIONS ADDICIONALS: ${instruccions}` : ''}

${promptTipus}`,
        },
      ],
    })

    return NextResponse.json({ text: completion.choices[0].message.content || '' })
  } catch (error) {
    console.error('Error alegacions:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
