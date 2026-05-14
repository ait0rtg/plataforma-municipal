export type Rol = 'admin' | 'user'
export type Classificacio = 'URGENT' | 'IMPORTANT' | 'INFORMATIU'
export type Confianca = 'ALTA' | 'MITJA' | 'BAIXA'
export type EstatSeguiment = 'pendent' | 'en_curs' | 'tancat'
export type EstatDocument = 'nou' | 'revisat' | 'arxivat'
export type EstatCompromis = 'pendent' | 'en_curs' | 'complet' | 'incomplert' | 'abandonat'

export interface Usuari {
  id: string
  email: string
  nom: string
  role: Rol
  aprovat: boolean
  created_at: string
  last_login?: string
}

export interface Document {
  id: string
  url_original: string
  font: string
  tipus?: string
  tipus_document?: string
  titol: string
  contingut_complet?: string
  resum?: string
  punts_clau?: string[]
  impacte_politic?: string
  classificacio: Classificacio
  nivell_confianca?: Confianca
  data_deteccio: string
  data_publicacio?: string
  venciment?: string
  import_detectat?: number
  tema_principal?: string
  proposta_accio?: string
  pregunta_ple_suggerida?: string
  per_a_l_oposicio?: string
  requereix_revisio_manual?: boolean
  estat_seguiment: EstatSeguiment
  observacions?: string
  estat?: EstatDocument
  estat_lectura_pdf?: 'pendent' | 'llegit' | 'error'
  ocult?: boolean
  recordatori_30d?: string
  recordatori_90d?: string
  recordatori_180d?: string
}

export interface Compromis {
  id: string
  titol: string
  descripcio?: string
  font_compromis?: string
  data_compromis?: string
  termini_anunciat?: string
  estat: EstatCompromis
  evidencia_compliment?: string
  tema?: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface ComentariCompromis {
  id: string
  compromis_id: string
  contingut: string
  created_by: string
  created_at: string
}

export interface SyncLog {
  font: string
  estat: 'ok' | 'error'
  nous_docs: number
  missatge?: string
  created_at: string
}

export interface AssistentResponse {
  resum_executiu: string
  antecedents: string
  acords_vigents: string
  imports_contractes: string
  vulnerabilitats: string
  preguntes_suggerides: string[]
  documents_font: { titol: string; url: string; data?: string }[]
}
