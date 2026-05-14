import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfTextFromUrl } from '@/lib/pdf'
import { analyseMunicipalDocument } from '@/lib/document-analysis'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { id, titol, contingut, url, font } = await req.json()
    if (!id && !contingut && !url) {
      return NextResponse.json({ error: 'Falta document, contingut o URL.' }, { status: 400 })
    }

    let text = String(contingut || '').trim()
    let documentTitle = titol || 'Document municipal'
    let documentFont = font || 'Documents'
    let documentUrl = url || ''

    if (id) {
      const { data: doc } = await supabase
        .from('monitoratge')
        .select('*')
        .eq('id', id)
        .single()

      if (doc) {
        text = String(doc.contingut_complet || text || '').trim()
        documentTitle = doc.titol || documentTitle
        documentFont = doc.font || documentFont
        documentUrl = doc.url_original || documentUrl
      }
    }

    if ((!text || text.length < 120) && documentUrl) {
      const pdf = await extractPdfTextFromUrl(documentUrl)
      text = pdf.text
    }

    if (!text || text.length < 120) {
      return NextResponse.json({
        error: 'No hi ha prou text per analitzar. Puja el PDF manualment o comprova la URL.',
      }, { status: 422 })
    }

    const analysis = await analyseMunicipalDocument({
      titol: documentTitle,
      font: documentFont,
      url: documentUrl,
      contingut: text,
    })

    if (id) {
      await supabase
        .from('monitoratge')
        .update({
          contingut_complet: text,
          resum: analysis.resum,
          punts_clau: analysis.punts_clau,
          impacte_politic: analysis.impacte_politic,
          proposta_accio: analysis.proposta_accio,
          pregunta_ple_suggerida: analysis.pregunta_ple_suggerida,
          classificacio: analysis.classificacio,
          tema_principal: analysis.tema_principal,
          import_detectat: analysis.import_detectat,
          venciment: analysis.venciment,
          nivell_confianca: analysis.nivell_confianca,
          estat_lectura_pdf: 'llegit',
        })
        .eq('id', id)
    }

    return NextResponse.json({
      ...analysis,
      contingut_complet: text,
    })
  } catch (error: any) {
    console.error('Error analitzant document:', error)
    return NextResponse.json(
      { error: error.message || 'Error generant el resum.' },
      { status: 500 }
    )
  }
}
