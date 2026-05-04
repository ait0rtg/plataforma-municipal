import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/dashboard/StatsCards'
import VencimentsCalendar from '@/components/dashboard/VencimentsCalendar'
import UrgentsTable from '@/components/dashboard/UrgentsTable'
import ActivityHeatmap from '@/components/charts/ActivityHeatmap'
import ImportsChart from '@/components/charts/ImportsChart'
import TemaDonut from '@/components/charts/TemaDonut'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: urgents },
    { data: venciments },
    { data: statsRaw },
    { data: importsData },
    { data: temaData },
  ] = await Promise.all([
    supabase.from('monitoratge')
      .select('*')
      .eq('classificacio', 'URGENT')
      .eq('estat_seguiment', 'pendent')
      .order('data_deteccio', { ascending: false })
      .limit(10),
    supabase.from('monitoratge')
      .select('id, titol, venciment, classificacio, font, url_original')
      .not('venciment', 'is', null)
      .gte('venciment', new Date().toISOString().split('T')[0])
      .order('venciment', { ascending: true })
      .limit(20),
    supabase.from('monitoratge')
      .select('classificacio, estat_seguiment, font')
      .order('data_deteccio', { ascending: false }),
    supabase.from('monitoratge')
      .select('import_detectat, data_deteccio, import_economic, data_publicacio')
      .not('import_economic', 'is', null)
      .order('data_deteccio', { ascending: true })
      .limit(50),
    supabase.from('monitoratge')
      .select('tema_principal')
      .not('tema_principal', 'is', null),
  ])

  const stats = statsRaw ? {
    total_documents: statsRaw.length,
    urgents_setmana: statsRaw.filter(d => d.classificacio === 'URGENT').length,
    pendents_90dies: statsRaw.filter(d => d.estat_seguiment === 'pendent').length,
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Resum de l activitat municipal</p>
      </div>
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImportsChart data={importsData || []} />
        <TemaDonut data={temaData || []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UrgentsTable urgents={urgents || []} />
        <VencimentsCalendar venciments={venciments || []} />
      </div>
      <ActivityHeatmap />
    </div>
  )
}
