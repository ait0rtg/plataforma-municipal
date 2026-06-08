import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Nomes l'admin pot pujar documents." }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const titol = String(form.get('titol') || '')
    const font = String(form.get('font') || 'PDF intern')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el fitxer PDF.' }, { status: 400 })
    }

    const documentTitle = titol || file.name.replace(/\.pdf$/i, '')

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const promptText = 'Ets un assessor politic municipal. Analitza aquest PDF i retorna NOMES JSON valid sense cap text addicional:\n{\n  "resum": "resum util de 6-10 linies",\n  "punts_clau": ["punt 1", "punt 2"],\n  "impacte_politic": "impacte",\n  "proposta_accio": "accio o null",\n  "pregunta_ple_suggerida": "pregunta o null",\n  "classificacio": "URGENT | IMPORTANT | INFORMATIU",\n  "tema_principal": "urbanisme | contractacio | personal | serveis | pressupost | registre | govern | medi_ambient | seguretat | altres",\n  "import_detectat": 1234.56,\n  "venciment": "YYYY-MM-DD o null",\n  "terminis_addicionals": [{"descripcio": "nom", "data": "YYYY-MM-DD"}],\n  "nivell_confianca": "ALTA | MITJA | BAIXA"\n}\nTitol: ' + documentTitle + '\nFont: ' + font

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: base64Data } },
      { text: promptText },
    ])

    const raw = result.response.text().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    const analysis = JSON.parse(raw)

    const { data, error } = await supabase
      .from('monitoratge')
      .insert({
        url_original: 'upload://' + Date.now() + '-' + file.name,
        font,
        tipus: 'pdf_intern',
        tipus_document: 'pdf',
        titol: documentTitle,
        resum: analysis.resum || '',
        punts_clau: analysis.punts_clau || [],
        impacte_politic: analysis.impacte_politic || '',
        classificacio: ['URGENT', 'IMPORTANT', 'INFORMATIU'].includes(analysis.classificacio) ? analysis.classificacio : 'INFORMATIU',
        nivell_confianca: ['ALTA', 'MITJA', 'BAIXA'].includes(analysis.nivell_confianca) ? analysis.nivell_confianca : 'MITJA',
        venciment: analysis.venciment || null,
        import_detectat: typeof analysis.import_detectat === 'number' ? analysis.import_detectat : null,
        tema_principal: analysis.tema_principal || 'altres',
        proposta_accio: analysis.proposta_accio || null,
        pregunta_ple_suggerida: analysis.pregunta_ple_suggerida || null,
        estat_lectura_pdf: 'llegit',
        estat_seguiment: 'pendent',
        estat: 'nou',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (Array.isArray(analysis.terminis_addicionals)) {
      for (const t of analysis.terminis_addicionals) {
        if (t.data && t.descripcio) {
          await supabase.from('calendari_events').upsert({
            titol: 'Termini: ' + t.descripcio + ' - ' + documentTitle.slice(0, 60),
            descripcio: 'Termini detectat automaticament per IA',
            data_inici: t.data,
            data_fi: t.data,
            tot_dia: true,
            color: 'bg-red-100 text-red-800 border-red-300',
            tipus_cita: 'altres',
            user_id: user.id,
            origen_document_id: data.id,
          }, { onConflict: 'titol,data_inici,user_id', ignoreDuplicates: true })
        }
      }
    }

    return NextResponse.json({ document: data })
  } catch (error: any) {
    console.error('Error pujant PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Error pujant el PDF.' },
      { status: 500 }
    )
  }
}
