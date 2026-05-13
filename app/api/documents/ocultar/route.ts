import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin'
import { isAdmin } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Només l\'admin pot ocultar documents' }, { status: 403 })
    }
    const { id, ocult } = await req.json()
    const admin = getAdminClient()
    await admin.from('monitoratge').update({ ocult: !!ocult }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
