import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Cerca multi-estratègia a Supabase ────────────────────────
async function cercaDocuments(supabase: any, consulta: string) {
  const consultaLower = consulta.toLowerCase()
  const resultats: any[] = []
  const ids = new Set<string>()

  function afegir(docs: any[]) {
    for (const d of (docs || [])) {
      if (!ids.has(d.id)) {
        ids.add(d.id)
        resultats.push(d)
      }
    }
  }

  const SELECT = 'id, titol, tipus_document, resum, contingut_complet, data_deteccio, data_publicacio, import_detectat, font, url_original, tema_principal, classificacio, venciment, per_a_l_oposicio'

  // 1. Cerca per tema detectat automàticament
  const temaDetectat = detectaTema(consultaLower)
  if (temaDetectat) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .eq('tema_principal', temaDetectat)
      .order('data_deteccio', { ascending: false })
      .limit(15)
    afegir(data)
  }

  // 2. Cerca per similitud de títol (trigram)
  const paraules = consultaLower
    .split(/\s+/)
    .filter((p: string) => p.length > 3)
    .slice(0, 4)

  for (const paraula of paraules) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .ilike('titol', `%${paraula}%`)
      .order('data_deteccio', { ascending: false })
      .limit(8)
    afegir(data)
    if (resultats.length >= 20) break
  }

  // 3. Cerca per resum
  if (paraules.length > 0 && resultats.length < 15) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .ilike('resum', `%${paraules[0]}%`)
      .order('data_deteccio', { ascending: false })
      .limit(8)
    afegir(data)
  }

  // 4. Cerca per classificació si la consulta demana urgents
  if (consultaLower.includes('urgent') || consultaLower.includes('prioritari') || consultaLower.includes('important')) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .in('classificacio', ['URGENT', 'IMPORTANT'])
      .order('data_deteccio', { ascending: false })
      .limit(10)
    afegir(data)
  }

  // 5. Cerca per imports si la consulta és sobre diners/contractes
  if (consultaLower.includes('import') || consultaLower.includes('euro') || consultaLower.includes('contracte') || consultaLower.includes('licitaci')) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .not('import_detectat', 'is', null)
      .order('import_detectat', { ascending: false })
      .limit(10)
    afegir(data)
  }

  // 6. Si no hi ha res, retornar els més recents com a fallback
  if (resultats.length === 0) {
    const { data } = await supabase.from('monitoratge')
      .select(SELECT)
      .order('data_deteccio', { ascending: false })
      .limit(20)
    afegir(data)
  }

  // Ordenar per rellevància: URGENT primer, després més recents
  return resultats
    .sort((a, b) => {
      const scoreA = (a.classificacio === 'URGENT' ? 2 : a.classificacio === 'IMPORTANT' ? 1 : 0)
      const scoreB = (b.classificacio === 'URGENT' ? 2 : b.classificacio === 'IMPORTANT' ? 1 : 0)
      if (scoreA !== scoreB) return scoreB - scoreA
      return new Date(b.data_deteccio).getTime() - new Date(a.data_deteccio).getTime()
    })
    .slice(0, 20)
}

function detectaTema(consulta: string): string | null {
  if (consulta.match(/contract|licitaci|adjudic|concurs|proveïdor|empresa/)) return 'contractació'
  if (consulta.match(/urban|llicènci|obra|edifici|solar|pla parcial|pgou|zona/)) return 'urbanisme'
  if (consulta.match(/personal|treballador|funcionari|oposici|plaça|nomenament/)) return 'personal'
  if (consulta.match(/pressupost|recaptaci|impost|taxa|deute|ingrés|despesa/)) return 'pressupost'
  if (consulta.match(/servei|recollida|neteja|manteniment|jardineria|transport/)) return 'serveis'
  if (consulta.match(/habitatge turístic|appart|airbnb|llogu|turisme/)) return 'habitatge turístic'
  if (consulta.match(/medi ambient|residus|sostenib|energia|aigua/)) return 'medi ambient'
  if (consulta.match(/alcalde|regidor|junta|ple|govern|acord|decret/)) return 'govern'
  return null
}

function formatContextDoc(d: any, i: number): string {
  const data = d.data_deteccio?.split('T')[0] || d.data_publicacio?.split('T')[0] || 'N/D'
  const import_ = d.import_detectat ? `\nIMPORT: ${Number(d.import_detectat).toLocaleString('ca')}€` : ''
  const venc = d.venciment ? `\nVENCIMENT: ${d.venciment}` : ''
  const urgent = d.classificacio === 'URGENT' ? ' ⚠️ URGENT' : d.classificacio === 'IMPORTANT' ? ' ℹ️ IMPORTANT' : ''
  const oposicio = d.per_a_l_oposicio ? `\nRELLEVÀNCIA POLÍTICA: ${d.per_a_l_oposicio}` : ''
  const contingut = d.resum || d.contingut_complet?.slice(0, 400) || '(sense resum)'

  return `[DOC ${i + 1}]${urgent}
FONT: ${d.font} | TIPUS: ${d.tipus_document || 'N/D'} | DATA: ${data}
TÍTOL: ${d.titol}
CONTINGUT: ${contingut}${import_}${venc}${oposicio}
URL: ${d.url_original}`
}

// ── Handler principal ────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { consulta, idioma = 'ca', historial = [] } = await request.json()
    if (!consulta?.trim()) return NextResponse.json({ error: 'Consulta buida' }, { status: 400 })

    const lang = idioma === 'es' ? 'castellà' : 'català'

    // Cerca documents rellevants
    const documents = await cercaDocuments(supabase, consulta)

    const contextDocs = documents.map(formatContextDoc).join('\n\n' + '─'.repeat(60) + '\n\n')

    // Construir missatges amb historial de conversa
    const missatgesHistorial = historial.slice(-4).map((h: any) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Ets un assessor polític expert en fiscalització municipal per a Aitor, regidor de l'oposició de l'Ajuntament de Castell-Platja d'Aro (Catalunya).

El teu objectiu és ajudar-lo a preparar els plens municipals i fiscalitzar l'acció de govern.

INSTRUCCIONS:
- Basa't EXCLUSIVAMENT en els documents proporcionats
- Si no hi ha informació suficient, indica-ho clarament
- Detecta inconsistències, terminis incomplets o mancances d'informació
- Suggereix preguntes formals concretes i accionables
- Respon sempre en ${lang}
- Quantifica sempre que puguis (dates, imports, terminis)

CONTEXT MUNICIPAL: ${documents.length} documents trobats a la base de dades.`,
        },
        ...missatgesHistorial,
        {
          role: 'user',
          content: `CONSULTA: "${consulta}"

DOCUMENTS DE LA BASE DE DADES MUNICIPAL:
${contextDocs}

Genera un informe de preparació en format JSON (respon NOMÉS el JSON, sense text addicional):
{
  "resum_executiu": "3-4 línies amb el més important per al regidor. Quantifica: dates, imports, empreses.",
  "antecedents": "Cronologia clara de decisions i acords rellevants trobats als documents, ordenats per data.",
  "acords_vigents": "Decisions del govern municipal que segueixen en vigor avui.",
  "imports_contractes": "Tots els imports, empreses adjudicatàries i terminis actius detectats. Si no n'hi ha, digues-ho.",
  "vulnerabilitats": "Punts febles del govern: inconsistències, terminis incomplets, manca d'informació, possibles irregularitats.",
  "preguntes_suggerides": [
    "Pregunta formal concreta 1 (basada en un document específic)",
    "Pregunta formal concreta 2",
    "Pregunta formal concreta 3",
    "Pregunta formal concreta 4"
  ],
  "documents_font": [
    {"titol": "títol exacte", "url": "url exacta", "data": "data", "font": "font"}
  ],
  "alertes": ["alerta urgent 1 si n'hi ha", "alerta urgent 2"]
}`,
        },
      ],
    })

    const rawContent = completion.choices[0].message.content || '{}'
    let resultat: any

    try {
      resultat = JSON.parse(rawContent)
    } catch {
      // Si el JSON ve amb backticks, netejar
      const net = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      resultat = JSON.parse(net)
    }

    // Afegir metadades útils
    resultat._meta = {
      documents_consultats: documents.length,
      fonts_consultades: [...new Set(documents.map((d: any) => d.font))],
      data_consulta: new Date().toISOString(),
    }

    return NextResponse.json(resultat)
  } catch (error: any) {
    console.error('Error assistent:', error)
    return NextResponse.json(
      { error: error?.message || 'Error intern del servidor' },
      { status: 500 }
    )
  }
}
