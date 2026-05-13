import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const { password } = await req.json()
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'La contrasenya ha de tenir almenys 8 caràcters' }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
