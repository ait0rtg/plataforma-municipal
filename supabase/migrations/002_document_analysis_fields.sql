ALTER TABLE monitoratge
  ADD COLUMN IF NOT EXISTS punts_clau TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS impacte_politic TEXT,
  ADD COLUMN IF NOT EXISTS estat_lectura_pdf TEXT DEFAULT 'pendent',
  ADD COLUMN IF NOT EXISTS ocult BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_mon_estat_lectura_pdf ON monitoratge(estat_lectura_pdf);
CREATE INDEX IF NOT EXISTS idx_mon_ocult ON monitoratge(ocult);
