import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

    // Aquí s'invocarà la Edge Function de Supabase que fa els scrapers
    const { data, error } = await supabase.functions.invoke('scraper-vigilancia')

    if (error) {
      console.error('Error scraper:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, nous: data?.nous || 0 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error intern' }, { status: 500 })
  }
}
