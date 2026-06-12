import { createClient } from '@/lib/supabase/server'
import AnalisiClient from '@/components/analisi/AnalisiClient'

export default async function AnalisiPage() {
  const supabase = await createClient()

  const [
    { data: documents },
    { data: imports },
  ] = await Promise.all([
    supabase.from('monitoratge')
      .select('classificacio, tema_principal, font, import_detectat, data_deteccio, tipus_document, estat_seguiment')
      .order('data_deteccio', { ascending: true }),
    supabase.from('monitoratge')
      .select('import_detectat, data_deteccio, titol, font, tema_principal')
      .not('import_detectat', 'is', null)
      .gt('import_detectat', 0)
      .order('import_detectat', { ascending: false })
      .limit(20),
  ])

  const docs = documents || []

  const total = docs.length
  const urgents = docs.filter(d => d.classificacio === 'URGENT').length
  const importants = docs.filter(d => d.classificacio === 'IMPORTANT').length
  const importTotal = docs.reduce((acc, d) => acc + (d.import_detectat || 0), 0)
  const pendents = docs.filter(d => d.estat_seguiment === 'pendent').length

  // Evolució mensual
  const byMonth: Record<string, { total: number; urgents: number; imports: number }> = {}
  docs.forEach(d => {
    if (!d.data_deteccio) return
    const k = d.data_deteccio.substring(0, 7)
    if (!byMonth[k]) byMonth[k] = { total: 0, urgents: 0, imports: 0 }
    byMonth[k].total++
    if (d.classificacio === 'URGENT') byMonth[k].urgents++
    byMonth[k].imports += d.import_detectat || 0
  })
  const evolucioMensual = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, v]) => ({ mes: mes.substring(0, 7), ...v, imports: Math.round(v.imports) }))

  // Per tema (tots els documents)
  const byTema: Record<string, { count: number; imports: number }> = {}
  docs.forEach(d => {
    const t = d.tema_principal || 'altres'
    if (!byTema[t]) byTema[t] = { count: 0, imports: 0 }
    byTema[t].count++
    byTema[t].imports += d.import_detectat || 0
  })
  const perTema = Object.entries(byTema)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([tema, v]) => ({ tema, ...v, imports: Math.round(v.imports) }))

  // Subtemes de la Junta de Govern (per tema_principal dels seus documents)
  const docsJunta = docs.filter(d =>
    d.font && (d.font.toLowerCase().includes('junta') || d.font.toLowerCase().includes('govern'))
  )
  const byTemaJunta: Record<string, { count: number; imports: number }> = {}
  docsJunta.forEach(d => {
    const t = d.tema_principal || 'altres'
    if (!byTemaJunta[t]) byTemaJunta[t] = { count: 0, imports: 0 }
    byTemaJunta[t].count++
    byTemaJunta[t].imports += d.import_detectat || 0
  })
  const perTemaJunta = Object.entries(byTemaJunta)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([tema, v]) => ({ tema, ...v, imports: Math.round(v.imports) }))

  // Per font
  const byFont: Record<string, number> = {}
  docs.forEach(d => { if (d.font) byFont[d.font] = (byFont[d.font] || 0) + 1 })
  const perFont = Object.entries(byFont).sort(([, a], [, b]) => b - a).map(([font, count]) => ({ font, count }))

  const topImports = (imports || []).slice(0, 10).map(d => ({
    titol: d.titol?.slice(0, 60) || 'N/D',
    import_detectat: d.import_detectat,
    font: d.font,
    tema_principal: d.tema_principal,
    data: d.data_deteccio?.split('T')[0],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Anàlisi de tendències</h1>
        <p className="text-sm text-slate-500">Patrons, imports i evolució de l&apos;activitat municipal</p>
      </div>
      <AnalisiClient
        stats={{ total, urgents, importants, importTotal, pendents }}
        evolucioMensual={evolucioMensual}
        perTema={perTema}
        perTemaJunta={perTemaJunta}
        totalJunta={docsJunta.length}
        perFont={perFont}
        topImports={topImports}
      />
    </div>
  )
}
