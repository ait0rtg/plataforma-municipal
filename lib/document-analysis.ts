import { openai } from '@/lib/openai'

export type DocumentAnalysisInput = {
  titol: string
  font?: string
  url?: string
  contingut: string
}

export type DocumentAnalysis = {
  resum: string
  punts_clau: string[]
  impacte_politic: string
  proposta_accio: string | null
  pregunta_ple_suggerida: string | null
  classificacio: 'URGENT' | 'IMPORTANT' | 'INFORMATIU'
  tema_principal: string
  import_detectat: number | null
  venciment: string | null
  nivell_confianca: 'ALTA' | 'MITJA' | 'BAIXA'
}

function safeJson(content: string): DocumentAnalysis {
  const cleaned = content
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  return {
    resum: String(parsed.resum || ''),
    punts_clau: Array.isArray(parsed.punts_clau)
      ? parsed.punts_clau.map(String).slice(0, 8)
      : [],
    impacte_politic: String(parsed.impacte_politic || ''),
    proposta_accio: parsed.proposta_accio ? String(parsed.proposta_accio) : null,
    pregunta_ple_suggerida: parsed.pregunta_ple_suggerida
      ? String(parsed.pregunta_ple_suggerida)
      : null,
    classificacio: ['URGENT', 'IMPORTANT', 'INFORMATIU'].includes(parsed.classificacio)
      ? parsed.classificacio
      : 'INFORMATIU',
    tema_principal: String(parsed.tema_principal || 'altres'),
    import_detectat: typeof parsed.import_detectat === 'number' ? parsed.import_detectat : null,
    venciment: parsed.venciment ? String(parsed.venciment) : null,
    nivell_confianca: ['ALTA', 'MITJA', 'BAIXA'].includes(parsed.nivell_confianca)
      ? parsed.nivell_confianca
      : 'MITJA',
  }
}

export async function analyseMunicipalDocument(
  input: DocumentAnalysisInput
): Promise<DocumentAnalysis> {
  const content = input.contingut.slice(0, 45000)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.15,
    max_tokens: 1600,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Ets un assessor polític municipal per a un regidor de l'oposició de Castell-Platja d'Aro.
Has d'analitzar documents administratius amb rigor. No inventis dades. Si no hi ha una dada, posa null.
Respon només amb JSON vàlid.`,
      },
      {
        role: 'user',
        content: `Analitza aquest document municipal.

Títol: ${input.titol}
Font: ${input.font || 'desconeguda'}
URL: ${input.url || 'no disponible'}

TEXT DEL DOCUMENT:
${content}

Retorna exactament aquest JSON:
{
  "resum": "resum útil de 6-10 línies, concret i accionable",
  "punts_clau": ["punt clau 1", "punt clau 2", "punt clau 3"],
  "impacte_politic": "per què importa políticament o administrativament",
  "proposta_accio": "acció concreta recomanada o null",
  "pregunta_ple_suggerida": "pregunta formal per al Ple o null",
  "classificacio": "URGENT | IMPORTANT | INFORMATIU",
  "tema_principal": "urbanisme | contractacio | personal | serveis | pressupost | registre | govern | medi_ambient | seguretat | altres",
  "import_detectat": 1234.56 o null,
  "venciment": "YYYY-MM-DD o null",
  "nivell_confianca": "ALTA | MITJA | BAIXA"
}`,
      },
    ],
  })

  return safeJson(completion.choices[0].message.content || '{}')
}
