import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { id, titol, contingut, url } = await req.json()

    let contingutFinal = contingut || ''
    let partsPDF: any[] = []

    // Si és un PDF, descarregar-lo i enviar-lo a Gemini directament
    if (url && url.toLowerCase().includes('.pdf')) {
      try {
        const pdfRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000)
        })
        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer()
          const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
          partsPDF = [{
            inline_data: {
              mime_type: 'application/pdf',
              data: pdfBase64
            }
          }]
        }
      } catch (e) {
        console.error('Error descarregant PDF:', e)
      }
    }

    const prompt = `Ets un assistent polític expert en administració local catalana. Analitza aquest document municipal de l'Ajuntament de Castell-Platja d'Aro.

Extreu i presenta en català:
1. **Resum executiu** (màxim 5 línies)
2. **Dates clau** (inici, finalització, venciments)
3. **Imports econòmics** (si n'hi ha)
4. **Decisions o acords principals**
5. **Implicacions polítiques** per a l'oposició
6. **Punts d'atenció** que cal seguir

Sigues concís i pràctic.

Títol: ${titol}
${contingutFinal ? 'Contingut addicional: ' + contingutFinal : ''}`

    const parts = partsPDF.length > 0
      ? [...partsPDF, { text: prompt }]
      : [{ text: prompt }]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    )

    const geminiData = await geminiRes.json()
    const resum = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!resum) {
      console.error('Gemini error:', JSON.stringify(geminiData))
      return NextResponse.json({ error: 'No s\'ha pogut generar el resum' }, { status: 500 })
    }

    await supabase.from('monitoratge').update({ resum }).eq('id', id)

    return NextResponse.json({ resum })
  } catch (error) {
    console.error('Error resum:', error)
    return NextResponse.json({ error: 'Error generant resum' }, { status: 500 })
  }
}
