import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
    const { data } = await supabase
      .from('calendari_events')
      .select('*')
      .eq('user_id', user.id)
      .order('data_inici', { ascending: true })
    return NextResponse.json({ events: data || [] })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    const body = await req.json()
    const assistents = Array.isArray(body.assistents) ? body.assistents : []
    const recordatoriActiu = Boolean(body.recordatori_actiu || assistents.length > 0)

    const { data, error } = await supabase
      .from('calendari_events')
      .insert({
        ...body,
        assistents,
        recordatori_actiu: recordatoriActiu,
        recordatori_minuts: body.recordatori_minuts ?? 60,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (assistents.length > 0) {
      try {
        await supabase.functions.invoke('notify-calendar-event', {
          body: {
            event: data,
            assistents,
            creat_per: user.id,
          },
        })
      } catch {}
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    await supabase.from('calendari_events').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
