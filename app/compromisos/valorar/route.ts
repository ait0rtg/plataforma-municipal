import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { compromis, respostes } = await req.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Ets un analista polític. Valora el % d'execució d'aquest compromís municipal.

COMPROMÍS: ${compromis.titol}
DESCRIPCIÓ: ${compromis.descripcio || 'No especificada'}
ESTAT: ${compromis.estat}
DATA: ${compromis.data_compromis}
TERMINI: ${compromis.termini_anunciat || 'No especificat'}

RESPOSTES DE L'USUARI A LES PREGUNTES DE VALORACIÓ:
${respostes.map((r: any) => `Q: ${r.pregunta}\nR: ${r.resposta}`).join('\n\n')}

Respon en JSON:
{
  "percentatge": número 0-100,
  "analisi": "2-3 frases directes i crítiques basades en les respostes",
  "recomanacio": "Acció concreta que hauria de fer el regidor ara"
}`,
      }],
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const percentatge = Math.max(0, Math.min(100, result.percentatge || 0))

    // Guardar la valoració a la BD
    const admin = getAdminClient()
    await admin.from('compromisos').update({
      percentatge_execucio: percentatge,
      notes_valoracio: result.analisi,
    }).eq('id', compromis.id)

    return NextResponse.json({
      percentatge,
      analisi: result.analisi,
      recomanacio: result.recomanacio,
    })
  } catch (error) {
    console.error('Error valoració:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

// GET — obtenir les preguntes de valoració per a un compromís
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const titol = searchParams.get('titol') || ''
  const tema = searchParams.get('tema') || ''

  const preguntes = [
    { id: 1, pregunta: 'S\'ha iniciat alguna actuació concreta per complir aquest compromís?' },
    { id: 2, pregunta: 'Hi ha algun document oficial (decret, acord, licitació) relacionat?' },
    { id: 3, pregunta: 'S\'ha destinat pressupost específic per a aquest compromís?' },
    { id: 4, pregunta: 'El termini anunciat s\'ha complert, s\'ha ajornat o no s\'ha esmentat?' },
    { id: 5, pregunta: 'Hi ha evidència pública (premsa, web municipal) del seu avenç?' },
  ]

  return NextResponse.json({ preguntes })
}
