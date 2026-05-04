import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { titol, descripcio, prioritat, partit, percentatge, data_limit } = await req.json()
  if (!titol) return NextResponse.json({ error: 'Falten camps' }, { status: 400 })

  const { data: compromis, error } = await supabase
    .from('compromisos')
    .insert({
      titol,
      descripcio,
      prioritat,
      partit,
      percentatge: percentatge || 0,
      data_limit: data_limit || null,
      estat: 'PENDENT'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ compromis })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { id, estat, percentatge, descripcio } = await req.json()

  const updates: Record<string, string | number> = {}
  if (estat !== undefined) updates.estat = estat
  if (percentatge !== undefined) updates.percentatge = percentatge
  if (descripcio !== undefined) updates.descripcio = descripcio

  const { error } = await supabase.from('compromisos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
