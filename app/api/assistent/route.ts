import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { consulta, idioma = 'ca' } = await request.json()
    if (!consulta) return NextResponse.json({ error: 'Consulta buida' }, { status: 400 })

    const lang = idioma === 'es' ? 'castellà' : 'català'

    // Buscar documents rellevants usant full-text search i filtres
    const paraules = consulta.toLowerCase().split(' ').filter((p: string) => p.length > 3)

    let query = supabase
      .from('monitoratge')
      .select('titol, tipus_document, resum, contingut_complet, data_deteccio, data_publicacio, import_detectat, font, url_original, tema_principal, classificacio')
      .order('data_deteccio', { ascending: false })
      .limit(20)

    // Si hi ha paraules clau prou específiques, filtrar per tema
    if (consulta.toLowerCase().includes('contracte') || consulta.toLowerCase().includes('licitaci')) {
      query = supabase.from('monitoratge')
        .select('titol, tipus_document, resum, contingut_complet, data_deteccio, data_publicacio, import_detectat, font, url_original, tema_principal, classificacio')
        .eq('tema_principal', 'contractació')
        .order('data_deteccio', { ascending: false })
        .limit(20)
    }

    const { data: documents } = await query

    const context = (documents || [])
      .map((d, i) =>
        `[${i + 1}] ${d.tipus_document || 'DOCUMENT'} - ${d.titol} (${d.data_deteccio?.split('T')[0] || d.data_publicacio?.split('T')[0] || 'N/D'})\nFONT: ${d.font}\n${d.resum || d.contingut_complet?.slice(0, 300) || '(sense resum)'}${d.import_detectat ? `\nIMPORT: ${d.import_detectat.toLocaleString('ca')}€` : ''}\nURL: ${d.url_original}`
      )
      .join('\n\n---\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Ets un assessor polític expert en fiscalització municipal per a un regidor de l'oposició de l'Ajuntament de Castell-Platja d'Aro. Respon sempre en ${lang}.`,
        },
        {
          role: 'user',
          content: `El regidor pregunta: "${consulta}"

Aquí tens ${documents?.length || 0} documents rellevants de la base de dades:

${context}

Genera un informe de preparació en format JSON:
{
  "resum_executiu": "3-4 línies amb el més important",
  "antecedents": "Cronologia de decisions rellevants basada en els documents",
  "acords_vigents": "Decisions del govern que segueixen en vigor",
  "imports_contractes": "Quantitats, empreses i terminis detectats",
  "vulnerabilitats": "On pot ser més feble el govern o inconsistències detectades",
  "preguntes_suggerides": ["pregunta formal 1", "pregunta formal 2", "pregunta formal 3"],
  "documents_font": [{"titol": "...", "url": "...", "data": "..."}]
}`,
        },
      ],
    })

    const resultat = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(resultat)
  } catch (error) {
    console.error('Error assistent:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
