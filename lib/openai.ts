import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ── Analitza un document i retorna el resum estructurat ────────
export async function analitzaDocument(params: {
  font: string
  titol: string
  tipus: string
  contingut: string
  idioma?: string
}) {
  const { font, titol, tipus, contingut, idioma = 'ca' } = params
  const lang = idioma === 'es' ? 'castellà' : 'català'

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Ets l'assistent d'un regidor de l'oposició de l'Ajuntament de Castell-Platja d'Aro (Catalunya).

NORMA FONAMENTAL: Basa't EXCLUSIVAMENT en el text proporcionat. NO afegeixis informació que no aparegui al text. Respon SEMPRE en ${lang}.

FONT: ${font}
TÍTOL: ${titol}
TIPUS: ${tipus}

TEXT COMPLET:
${contingut.substring(0, 6000)}

Respon EXACTAMENT en aquest format JSON (sense cap text addicional fora del JSON):
{
  "urgencia": "URGENT" | "IMPORTANT" | "INFORMATIU",
  "resum": "3-4 línies basades exclusivament en el text",
  "venciment": "DD/MM/YYYY o null",
  "import_detectat": number o null,
  "tema_principal": "urbanisme" | "contractació" | "personal" | "serveis" | "pressupost" | "registre" | "govern" | "altres",
  "tipus_document": "acord" | "licitació" | "adjudicació" | "edicte" | "decret" | "inscripció" | "sol·licitud" | "altres",
  "confianca": "ALTA" | "MITJA" | "BAIXA",
  "per_a_l_oposicio": "una frase basada en fets del text",
  "proposta_accio": "opcional - si hi ha acció política clara, sinó null",
  "pregunta_ple_suggerida": "opcional - si es justifica, sinó null"
}`
    }],
    max_tokens: 600,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

// ── Assistent de preparació (RAG sobre documents de la BD) ─────
export async function assistentPreparacio(params: {
  query: string
  documents: Array<{
    titol: string
    font: string
    resum?: string
    data_deteccio: string
    venciment?: string
    import_detectat?: number
    url_original: string
    tema_principal?: string
  }>
  idioma?: string
}) {
  const { query, documents, idioma = 'ca' } = params
  const lang = idioma === 'es' ? 'castellà' : 'català'

  const contextDocs = documents.slice(0, 15).map((d, i) =>
    `[${i + 1}] FONT: ${d.font} | DATA: ${d.data_deteccio?.split('T')[0]}\nTÍTOL: ${d.titol}\n${d.resum || '(sense resum)'}${d.import_detectat ? `\nIMPORT: ${d.import_detectat.toLocaleString('ca')}€` : ''}${d.venciment ? `\nVENCIMENT: ${d.venciment}` : ''}\nURL: ${d.url_original}`
  ).join('\n\n---\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Ets un assessor polític expert en fiscalització municipal per a un regidor de l'oposició de l'Ajuntament de Castell-Platja d'Aro.

El regidor pregunta: "${query}"

Aquí tens ${documents.length} documents rellevants de la base de dades municipal:

${contextDocs}

Genera un informe de preparació en ${lang} en format JSON:
{
  "resum_executiu": "3-4 línies amb el més important per al regidor",
  "antecedents": "Cronologia de decisions i acords rellevants trobats als documents",
  "acords_vigents": "Decisions del govern que segueixen en vigor",
  "imports_contractes": "Quantitats, empreses i terminis actius detectats",
  "vulnerabilitats": "On pot ser més feble el govern o inconsistències detectades",
  "preguntes_suggerides": ["pregunta formal 1", "pregunta formal 2", "pregunta formal 3"],
  "documents_font": [{"titol": "...", "url": "...", "data": "..."}]
}`
    }],
    max_tokens: 1500,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}
