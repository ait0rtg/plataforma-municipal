import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/utils'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('lleis_context')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ lleis: data || [] })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 403 })

    const { titol, descripcio, contingut } = await req.json()
    if (!titol || !contingut) return NextResponse.json({ error: 'Falten camps' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('lleis_context')
      .insert({ titol, descripcio, contingut, activa: true })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ llei: data })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 403 })

    const { id, titol, descripcio, contingut, activa } = await req.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('lleis_context')
      .update({ titol, descripcio, contingut, activa })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('lleis_context').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
