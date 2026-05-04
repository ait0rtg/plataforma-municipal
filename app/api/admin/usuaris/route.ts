import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { data: usuaris } = await supabase
    .from('usuaris')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ usuaris })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { nom, email, password } = await req.json()
  if (!nom || !email || !password) return NextResponse.json({ error: 'Falten camps' }, { status: 400 })

  const adminClient = await createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: profileError } = await adminClient
    .from('usuaris')
    .insert({ id: authData.user.id, email, nom, role: 'user', aprovat: true })

  if (profileError) return NextResponse.json({ error: 'Error creant perfil' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { id, aprovat } = await req.json()

  const { error } = await supabase
    .from('usuaris')
    .update({ aprovat })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
