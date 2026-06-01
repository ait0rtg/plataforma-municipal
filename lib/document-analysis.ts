import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

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
  terminis_addicionals: { descripcio: string; data: string }[]
  nivell_confianca: 'ALTA' | 'MITJA' | 'BAIXA'
}

function safeJson(content: string): DocumentAnalysis {
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
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
    terminis_addicionals: Array.isArray(parsed.terminis_addicionals)
      ? parsed.terminis_addicionals.filter((t: any) => t.data && t.descripcio)
      : [],
    nivell_confianca: ['ALTA', 'MITJA', 'BAIXA'].includes(parsed.nivell_confianca)
      ? parsed.nivell_confianca
      : 'MITJA',
  }
}

const SYSTEM_PROMPT = `Ets un assessor polític municipal per a un regidor de l'oposició de Castell-Platja d'Aro.
Has d'analitzar documents administratius amb rigor. No inventis dades. Si no hi ha una dada, posa null.
Respon NOMÉS amb JSON vàlid, sense cap text addicional ni markdown.`

const USER_PROMPT = (titol: string, font: string, url: string) => `Analitza aquest document municipal.

Títol: ${titol}
Font: ${font}
URL: ${url}

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
  "venciment": "YYYY-MM-DD o null (el termini o data límit principal)",
  "terminis_addicionals": [{"descripcio": "nom del termini", "data": "YYYY-MM-DD"}],
  "nivell_confianca": "ALTA | MITJA | BAIXA"
}`

export async function analyseMunicipalDocumentFromUrl(
  url: string,
  titol: string,
  font: string = 'Documents'
): Promise<DocumentAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  // Descarregar el PDF com a bytes per passar-lo directament a Gemini
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 MonitorPolitic/1.0' },
  })

  if (!res.ok) {
    throw new Error(`No s'ha pogut descarregar el document (${res.status})`)
  }

  const contentType = res.headers.get('content-type') || ''
  const arrayBuffer = await res.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString('base64')

  const isPdf = contentType.includes('pdf') || url.toLowerCase().includes('.pdf')

  let result
  if (isPdf) {
    result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      },
      { text: USER_PROMPT(titol, font, url) },
    ])
  } else {
    // Document de text pla
    const text = Buffer.from(arrayBuffer).toString('utf8').slice(0, 120000)
    result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `TEXT DEL DOCUMENT:\n${text}` },
      { text: USER_PROMPT(titol, font, url) },
    ])
  }

  return safeJson(result.response.text())
}

export async function analyseMunicipalDocumentFromText(
  contingut: string,
  titol: string,
  font: string = 'Documents',
  url: string = ''
): Promise<DocumentAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `TEXT DEL DOCUMENT:\n${contingut.slice(0, 120000)}` },
    { text: USER_PROMPT(titol, font, url) },
  ])

  return safeJson(result.response.text())
}
