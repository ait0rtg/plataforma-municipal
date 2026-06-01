import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyseMunicipalDocumentFromUrl, analyseMunicipalDocumentFromText } from '@/lib/document-analysis'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { id, titol, contingut, url, font } = await req.json()

    let documentTitle = titol || 'Document municipal'
    let documentFont = font || 'Documents'
    let documentUrl = url || ''
    let documentContingut = String(contingut || '').trim()

    // Si tenim id, carreguem el document de la BD
    if (id) {
      const { data: doc } = await supabase
        .from('monitoratge')
        .select('*')
        .eq('id', id)
        .single()

      if (doc) {
        documentTitle = doc.titol || documentTitle
        documentFont = doc.font || documentFont
        documentUrl = doc.url_original || documentUrl
        documentContingut = String(doc.contingut_complet || documentContingut || '').trim()
      }
    }

    let analysis

    // Intentem amb URL primer (Gemini llegeix PDFs directament)
    if (documentUrl && documentUrl.startsWith('http') && !documentUrl.startsWith('upload://')) {
      analysis = await analyseMunicipalDocumentFromUrl(documentUrl, documentTitle, documentFont)
    } else if (documentContingut && documentContingut.length >= 120) {
      analysis = await analyseMunicipalDocumentFromText(documentContingut, documentTitle, documentFont, documentUrl)
    } else {
      return NextResponse.json({
        error: 'No hi ha URL ni contingut suficient per analitzar. Comprova que el document té URL o text extret.',
      }, { status: 422 })
    }

    // Desar resultats a la BD
    if (id) {
      // Desar terminis addicionals al calendari
      if (analysis.terminis_addicionals && analysis.terminis_addicionals.length > 0) {
        const eventsCalendari = analysis.terminis_addicionals.map((t) => ({
          titol: `📋 ${t.descripcio} — ${documentTitle.slice(0, 60)}`,
          descripcio: `Termini detectat automàticament per IA al document: ${documentTitle}`,
          data_inici: t.data,
          data_fi: t.data,
          tot_dia: true,
          color: 'bg-red-100 text-red-800 border-red-300',
          tipus_cita: 'altres',
          user_id: user.id,
          origen_document_id: id,
        }))

        // Inserir sense duplicats (per títol+data)
        for (const event of eventsCalendari) {
          await supabase
            .from('calendari_events')
            .upsert(event, { onConflict: 'titol,data_inici,user_id', ignoreDuplicates: true })
            .select()
        }
      }

      // Desar venciment principal al calendari també
      if (analysis.venciment) {
        await supabase
          .from('calendari_events')
          .upsert({
            titol: `⏰ Venciment: ${documentTitle.slice(0, 70)}`,
            descripcio: `Venciment principal detectat per IA`,
            data_inici: analysis.venciment,
            data_fi: analysis.venciment,
            tot_dia: true,
            color: 'bg-orange-100 text-orange-800 border-orange-300',
            tipus_cita: 'altres',
            user_id: user.id,
            origen_document_id: id,
          }, { onConflict: 'titol,data_inici,user_id', ignoreDuplicates: true })
      }

      await supabase
        .from('monitoratge')
        .update({
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

    return NextResponse.json({ ...analysis })
  } catch (error: any) {
    console.error('Error analitzant document:', error)
    return NextResponse.json(
      { error: error.message || 'Error generant el resum.' },
      { status: 500 }
    )
  }
}
