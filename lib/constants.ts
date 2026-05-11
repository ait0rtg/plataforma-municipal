export const ADMIN_EMAIL = 'aitor.tendero@gmail.com'

export const CLASSIFICACIO_CONFIG = {
  URGENT: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500',
  },
  IMPORTANT: {
    label: 'Important',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
  },
  INFORMATIU: {
    label: 'Informatiu',
    color: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-500',
  },
} as const

export const FONTS = [
  'E-Tauler',
  'Junta de Govern',
  'Perfil Contractant',
  'BPM Decrets',
  'BPM Registre Entrada',
] as const

export const TEMES = [
  'urbanisme',
  'contractació',
  'personal',
  'serveis',
  'pressupost',
  'habitatge turístic',
  'medi ambient',
  'educació',
  'esports',
  'cultura',
  'govern',
  'registre',
  'altres',
] as const

export const ESTAT_SEGUIMENT = {
  pendent: { label: 'Pendent', color: 'bg-gray-100 text-gray-700' },
  en_curs: { label: 'En curs', color: 'bg-blue-100 text-blue-700' },
  tancat: { label: 'Tancat', color: 'bg-green-100 text-green-700' },
} as const
