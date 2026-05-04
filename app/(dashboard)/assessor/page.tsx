import AssessorClient from '@/components/assessor/AssessorClient'

export default function AssessorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Assessor IA</h1>
        <p className="text-sm text-slate-500">Consultes lliures sobre qualsevol tema municipal o polític</p>
      </div>
      <AssessorClient />
    </div>
  )
}
