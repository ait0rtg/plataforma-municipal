import { createClient } from '@/lib/supabase/server'
import DocumentsFilters from '@/components/documents/DocumentsFilters'
import DocumentsTable from '@/components/documents/DocumentsTable'
import ActualitzarButton from '@/components/documents/ActualitzarButton'

type SearchParams = { [key: string]: string | undefined }

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const page = parseInt(params.page || '1')
  const limit = 25
  const offset = (page - 1) * limit
  const mostrarArxivats = params.arxivats === '1'

  let query = supabase
    .from('monitoratge')
    .select('*', { count: 'exact' })
    .order('data_publicacio', { ascending: false })
    .range(offset, offset + limit - 1)

  if (!mostrarArxivats) {
    query = query.neq('estat_seguiment', 'tancat')
  }

  if (params.classificacio) {
    query = query.eq('classificacio', params.classificacio)
  }
  if (params.font) {
    query = query.eq('font', params.font)
  }
  if (params.tema) {
    query = query.eq('tema_principal', params.tema)
  }
  if (params.estat) {
    query = query.eq('estat_seguiment', params.estat)
  }
  if (params.cerca) {
    const c = params.cerca
    query = query.or('titol.ilike.%' + c + '%,resum.ilike.%' + c + '%')
  }

  const { data: documents, count } = await query

  const arxivatsBoto = mostrarArxivats ? '/documents' : '/documents?arxivats=1'
  const arxivatsLabel = mostrarArxivats ? 'Amagar arxivats' : 'Veure arxivats'
  const arxivatsClass = mostrarArxivats
    ? 'text-sm px-3 py-1.5 rounded-lg border bg-orange-100 text-orange-700 border-orange-200'
    : 'text-sm px-3 py-1.5 rounded-lg border bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-sm text-slate-500">{count || 0} documents trobats</p>
        </div>
        <div className="flex items-center gap-3">
          <a href={arxivatsBoto} className={arxivatsClass}>
            {arxivatsLabel}
          </a>
          <ActualitzarButton />
          <a href="/api/documents/export" className="text-sm text-blue-600 hover:underline">
            Exportar CSV
          </a>
        </div>
      </div>
      <DocumentsFilters />
      <DocumentsTable
        documents={documents || []}
        total={count || 0}
        page={page}
        limit={limit}
        userEmail={user?.email}
      />
    </div>
  )
}
