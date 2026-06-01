import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'
import { analyseMunicipalDocumentFromText } from '@/lib/document-analysis'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Només l\'admin pot pujar documents.' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const titol = String(form.get('titol') || '')
    const font = String(form.get('font') || 'PDF intern')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el fitxer PDF.' }, { status: 400 })
    }

    const documentTitle = titol || file.name.replace(/\.pdf$/i, '')

    // Passar el PDF directament a Gemini via base64
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const prompt = `Ets un assessor polític municipal per a un regidor de l'oposició de Castell-Platja d'Aro.
Analitza aquest document PDF i retorna NOMÉS JSON vàlid sense cap text addicional:
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
  "terminis_addicionals": [{"descripcio": "nom del termini", "data": "YYYY-MM-DD"}],
  "nivell_confianca": "ALTA | MITJA | BAIXA"
}

Títol del document: ${documentTitle}
Font: ${font}`

    const result = await model.generateContent([
      { inlineData: { mimeType: 'app
