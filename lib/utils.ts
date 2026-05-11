import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays } from 'date-fns'
import { ca } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatData(date: string | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '—'
  try {
    return format(new Date(date), fmt, { locale: ca })
  } catch {
    return '—'
  }
}

export function formatDataHora(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ca })
  } catch {
    return '—'
  }
}

export function diesRestants(date: string | null | undefined): number | null {
  if (!date) return null
  try {
    return differenceInDays(new Date(date), new Date())
  } catch {
    return null
  }
}

export function colorVenciment(date: string | null | undefined): string {
  const dies = diesRestants(date)
  if (dies === null) return ''
  if (dies < 0) return 'text-red-700 font-bold'
  if (dies < 7) return 'text-red-600 font-semibold'
  if (dies < 30) return 'text-orange-500 font-medium'
  return 'text-gray-600'
}

export function formatImport(amount: number | null | undefined): string {
  if (!amount) return '—'
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function isAdmin(email: string | undefined | null): boolean {
  return email === 'aitor.tendero@gmail.com'
}

export function getInitials(name: string): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
