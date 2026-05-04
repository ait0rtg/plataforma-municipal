import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import UsuarisClient from '@/components/admin/UsuarisClient'

export default async function UsuarisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) redirect('/dashboard')

  const { data: usuaris } = await supabase
    .from('usuaris')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gestió d'usuaris</h1>
        <p className="text-sm text-slate-500">{usuaris?.length || 0} usuaris registrats</p>
      </div>
      <UsuarisClient usuaris={usuaris || []} />
    </div>
  )
}
