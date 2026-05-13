import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Només l\'admin' }, { status: 403 })
    }

    const formData = await req.formData()
    const arxiu = formData.get('arxiu') as File
    const partit = formData.get('partit') as string || 'Programa electoral'

    if (!arxiu) return NextResponse.json({ error: 'Falta el fitxer' }, { status: 400 })

    // Pujar PDF a OpenAI
    const uploadedFile = await openai.files.create({
      file: arxiu,
      purpose: 'assistants',
    })

    // Extreure compromisos del programa electoral
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Analitza aquest programa electoral de "${partit}" de Castell-Platja d'Aro i extreu totes les promeses i compromisos concrets.

Per a cada compromís, identifica:
- Títol concís (màxim 80 caràcters)
- Descripció del compromís
- Tema (urbanisme/contractació/personal/serveis/pressupost/educació/esports/cultura/medi ambient/altres)
- Si té termini explícit

Respon NOMÉS en JSON:
{
  "compromisos": [
    {
      "titol": "...",
      "descripcio": "...",
      "tema": "...",
      "termini_anunciat": "YYYY-MM-DD o null"
    }
  ],
  "total": número,
  "resum_programa": "2-3 línies del programa"
}

File ID: ${uploadedFile.id}`,
      }],
    })

    await openai.files.del(uploadedFile.id).catch(() => {})

    const resultat = JSON.parse(response.choices[0].message.content || '{}')
    const compromisos = resultat.compromisos || []

    // Inserir a la BD
    let inserits = 0
    for (const c of compromisos) {
      const { error } = await supabase.from('compromisos').insert({
        titol: c.titol?.slice(0, 300),
        descripcio: c.descripcio,
        font_compromis: partit,
        font_programa: partit,
        data_compromis: new Date().toISOString().split('T')[0],
        termini_anunciat: c.termini_anunciat || null,
        tema: c.tema || 'altres',
        estat: 'pendent',
        created_by: user.id,
      })
      if (!error) inserits++
    }

    return NextResponse.json({
      ok: true,
      inserits,
      total: compromisos.length,
      resum_programa: resultat.resum_programa,
    })
  } catch (error: any) {
    console.error('Error importar programa:', error)
    return NextResponse.json({ error: error.message || 'Error intern' }, { status: 500 })
  }
}
