import { createClient } from '@/lib/supabase/server'

export default async function AnalisiPage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from('monitoratge')
    .select('classificacio, tema_principal, font, import_detectat, data_deteccio')
    .order('data_deteccio', { ascending: false })

  const total = documents?.length || 0
  const urgents = documents?.filter(d => d.classificacio === 'URGENT').length || 0
  const importants = documents?.filter(d => d.classificacio === 'IMPORTANT').length || 0
  const importTotal = documents?.reduce((acc, d) => acc + (d.import_detectat || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Anàlisi</h1>
        <p className="text-sm text-slate-500">Estadístiques generals del monitoratge</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-800">{total}</div>
          <div className="text-sm text-slate-500 mt-1">Total documents</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-red-600">{urgents}</div>
          <div className="text-sm text-slate-500 mt-1">Urgents</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-orange-500">{importants}</div>
          <div className="text-sm text-slate-500 mt-1">Importants</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-blue-600">
            {importTotal > 0 ? `${(importTotal / 1000).toFixed(0)}k€` : '—'}
          </div>
          <div className="text-sm text-slate-500 mt-1">Import total</div>
        </div>
      </div>

      {total === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">Encara no hi ha documents. Actualitza els documents des de la secció Documents.</p>
        </div>
      )}
    </div>
  )
}
