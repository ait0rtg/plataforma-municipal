import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils'
import CompromisosClient from '@/components/compromisos/CompromisosClient'

export default async function CompromisosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: compromisos } = await supabase
    .from('compromisos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Compromisos</h1>
        <p className="text-sm text-slate-500">{compromisos?.length || 0} compromisos registrats</p>
      </div>
      <CompromisosClient compromisos={compromisos || []} isAdmin={isAdmin(user?.email)} />
    </div>
  )
}
