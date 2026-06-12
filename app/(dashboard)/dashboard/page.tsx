import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/dashboard/StatsCards'
import VencimentsCalendar from '@/components/dashboard/VencimentsCalendar'
import UrgentsTable from '@/components/dashboard/UrgentsTable'
import ActivityHeatmap from '@/components/charts/ActivityHeatmap'
import ImportsChart from '@/components/charts/ImportsChart'
import TemaDonut from '@/components/charts/TemaDonut'

export default async function DashboardPage() {
  const supabase = await createClient()

  const avui = new Date().toISOString().split('T')[0]
  const fa7dies = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const fa30dies = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const en7dies = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const en30dies = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: urgents },
    { data: venciments },
    { data: totals },
    { data: contractes30d },
    { data: importsData },
    { data: temaData },
    { data: compromisos },
    { data: noAnalitzats },
    { data: juntes30d },
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
      .gte('venciment', avui)
      .lte('venciment', en30dies)
      .order('venciment', { ascending: true })
      .limit(20),
    supabase.from('monitoratge')
      .select('classificacio, estat_seguiment, font, data_deteccio, import_detectat'),
    supabase.from('monitoratge')
      .select('import_detectat, titol, tema_principal')
      .not('import_detectat', 'is', null)
      .gte('data_deteccio', fa30dies)
      .order('import_detectat', { ascending: false })
      .limit(5),
    supabase.from('monitoratge')
      .select('import_detectat, data_deteccio')
      .not('import_detectat', 'is', null)
      .order('data_deteccio', { ascending: true })
      .limit(50),
    supabase.from('monitoratge')
      .select('tema_principal, font')
      .not('tema_principal', 'is', null),
    supabase.from('compromisos')
      .select('estat'),
    supabase.from('monitoratge')
      .select('id')
      .is('resum', null)
      .eq('estat_seguiment', 'pendent'),
    supabase.from('monitoratge')
      .select('id, titol, data_deteccio')
      .ilike('font', '%Junta%')
      .gte('data_deteccio', fa30dies)
      .order('data_deteccio', { ascending: false }),
  ])

  const ara = totals || []
  const setmanaPassada = ara.filter(d => d.data_deteccio >= fa7dies)
  const importTotal30d = (contractes30d || []).reduce((s, d) => s + (d.import_detectat || 0), 0)
  const compromisosPendents = (compromisos || []).filter(c => c.estat === 'pendent' || c.estat === 'en_curs').length
  const compromisosComplerts = (compromisos || []).filter(c => c.estat === 'complet').length
  const compromisosTotal = (compromisos || []).length
  const pctComplerts = compromisosTotal > 0 ? Math.round(compromisosComplerts / compromisosTotal * 100) : 0

  const stats = {
    total_documents: ara.length,
    urgents_pendents: ara.filter(d => d.classificacio === 'URGENT' && d.estat_seguiment === 'pendent').length,
    nous_7dies: setmanaPassada.length,
    urgents_7dies: setmanaPassada.filter(d => d.classificacio === 'URGENT').length,
    venciments_7dies: (venciments || []).filter(v => v.venciment <= en7dies).length,
    venciments_30dies: (venciments || []).length,
    import_30dies: importTotal30d,
    pendents_sense_analisi: (noAnalitzats || []).length,
    compromisos_pendents: compromisosPendents,
    compromisos_pct: pctComplerts,
    juntes_30dies: (juntes30d || []).length,
    contractes_top: contractes30d || [],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Monitoratge municipal · Castell-Platja d&apos;Aro</p>
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
