import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import Link from 'next/link'
import { Users, RefreshCw, Database } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) redirect('/dashboard')

  const { count: totalDocs } = await supabase
    .from('monitoratge')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsuaris } = await supabase
    .from('usuaris')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Administració</h1>
        <p className="text-sm text-slate-500">Gestió del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-800">Documents</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{totalDocs || 0}</div>
          <div className="text-sm text-slate-500">a la base de dades</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-800">Usuaris</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{totalUsuaris || 0}</div>
          <div className="text-sm text-slate-500">registrats</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/usuaris"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-colors flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-slate-800">Gestió d'usuaris</div>
            <div className="text-sm text-slate-500">Crear, aprovar i gestionar usuaris</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
