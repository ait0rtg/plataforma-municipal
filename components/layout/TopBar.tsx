'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/assistent': 'Assistent de Preparació',
  '/assessor': 'Assessor IA',
  '/compromisos': 'Compromisos del govern',
  '/analisi': 'Anàlisi avançada',
  '/admin': 'Administració',
  '/calendari': 'Calendari',
  '/preguntes-ple': 'Preguntes pel Ple',
}

export default function TopBar({ userEmail, userName }: { userEmail: string; userName: string }) {
  const pathname = usePathname()
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || ''
  const isDashboard = pathname === '/dashboard'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-6 pl-16 lg:pl-6">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>

      {isDashboard && (
        <Link
          href="/assistent"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Preparar ple
        </Link>
      )}
    </header>
  )
}
