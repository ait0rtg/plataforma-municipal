import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { id, titol, contingut } = await req.json()

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ets un assistent polític. Analitza aquest document municipal de l'Ajuntament de Castell-Platja d'Aro i fes un resum en màxim 20 línies en català. Destaca: dates importants, imports econòmics, decisions clau i implicacions polítiques.\n\nTítol: ${titol}\n\nContingut: ${contingut || 'No disponible'}`
            }]
          }]
        })
      }
    )

    const geminiData = await geminiRes.json()
    const resum = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!resum) return NextResponse.json({ error: 'No s\'ha pogut generar el resum' }, { status: 500 })

    await supabase.from('monitoratge').update({ resum }).eq('id', id)

    return NextResponse.json({ resum })
  } catch (error) {
    console.error('Error resum:', error)
    return NextResponse.json({ error: 'Error generant resum' }, { status: 500 })
  }
}
