import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'
import { extractPdfTextFromBuffer } from '@/lib/pdf'
import { analyseMunicipalDocument } from '@/lib/document-analysis'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Només l’admin pot pujar documents.' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const titol = String(form.get('titol') || '')
    const font = String(form.get('font') || 'PDF intern')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el fitxer PDF.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdf = await extractPdfTextFromBuffer(buffer, 'upload')
    const documentTitle = titol || file.name.replace(/\.pdf$/i, '')

    const analysis = await analyseMunicipalDocument({
      titol: documentTitle,
      font,
      contingut: pdf.text,
    })

    const { data, error } = await supabase
      .from('monitoratge')
      .insert({
        url_original: `upload://${Date.now()}-${file.name}`,
        font,
        tipus: 'pdf_intern',
        tipus_document: 'pdf',
        titol: documentTitle,
        contingut_complet: pdf.text,
        resum: analysis.resum,
        punts_clau: analysis.punts_clau,
        impacte_politic: analysis.impacte_politic,
        classificacio: analysis.classificacio,
        nivell_confianca: analysis.nivell_confianca,
        venciment: analysis.venciment,
        import_detectat: analysis.import_detectat,
        tema_principal: analysis.tema_principal,
        proposta_accio: analysis.proposta_accio,
        pregunta_ple_suggerida: analysis.pregunta_ple_suggerida,
        estat_lectura_pdf: 'llegit',
        estat_seguiment: 'pendent',
        estat: 'nou',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ document: data })
  } catch (error: any) {
    console.error('Error pujant PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Error pujant el PDF.' },
      { status: 500 }
    )
  }
}
