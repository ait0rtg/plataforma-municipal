import { createClient } from '@/lib/supabase/server'
import { DocumentsFilters } from '@/components/documents/DocumentsFilters'
import { DocumentsTable } from '@/components/documents/DocumentsTable'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const page = parseInt(params.page || '1')
  const limit = 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('monitoratge')
    .select('*', { count: 'exact' })
    .order('data_publicacio', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.classificacio) query = query.eq('classificacio', params.classificacio)
  if (params.font) query = query.eq('font', params.font)
  if (params.tema) query = query.eq('tema_principal', params.tema)
  if (params.estat) query = query.eq('estat_seguiment', params.estat)
  if (params.cerca) {
    query = query.or(`titol.ilike.%${params.cerca}%,resum.ilike.%${params.cerca}%`)
  }

  const { data: documents, count } = await query

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-sm text-slate-500">{count || 0} documents trobats</p>
        </div>
        <a href="/api/documents/export" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          Exportar CSV
        </a>
      </div>
      <DocumentsFilters />
      <DocumentsTable documents={documents || []} total={count || 0} page={page} limit={limit} userEmail={user?.email} />
    </div>
  )
}