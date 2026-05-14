import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin'
import { isAdmin } from '@/lib/utils'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Només l’admin pot editar documents' }, { status: 403 })
    }

    const { id, ...camps } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const campsPermesos = [
      'titol',
      'resum',
      'punts_clau',
      'impacte_politic',
      'classificacio',
      'tema_principal',
      'import_detectat',
      'venciment',
      'per_a_l_oposicio',
      'pregunta_ple_suggerida',
      'observacions',
      'estat_seguiment',
      'ocult',
      'contingut_complet',
      'estat_lectura_pdf',
    ]

    const update: any = {}

    for (const camp of campsPermesos) {
      if (camp in camps) update[camp] = camps[camp]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Cap camp vàlid per actualitzar' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error } = await admin
      .from('monitoratge')
      .update(update)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
