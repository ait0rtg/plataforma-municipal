import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
    }

    const { id } = await req.json()

    const { error } = await supabase
      .from('monitoratge')
      .update({ estat_seguiment: 'tancat' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error arxivar:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
