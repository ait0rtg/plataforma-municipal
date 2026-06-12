import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import LleisClient from '@/components/admin/LleisClient'

export default async function LleisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const { data: lleis } = await adminSupabase
    .from('lleis_context')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lleis i normativa</h1>
        <p className="text-sm text-slate-500">Context legal que utilitza l&apos;assessor IA en les respostes</p>
      </div>
      <LleisClient lleis={lleis || []} />
    </div>
  )
}
