import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userEmail = user.email || ''
  const userName = user.user_metadata?.full_name || user.email || ''

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userEmail={userEmail} userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userEmail={userEmail} userName={userName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
