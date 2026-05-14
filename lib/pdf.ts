import pdfParse from 'pdf-parse'

const MAX_PDF_BYTES = 18 * 1024 * 1024
const MAX_TEXT_CHARS = 120000

export type PdfReadResult = {
  text: string
  pages?: number
  source: 'upload' | 'url'
}

function cleanPdfText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS)
}

export async function extractPdfTextFromBuffer(
  buffer: Buffer,
  source: 'upload' | 'url' = 'upload'
): Promise<PdfReadResult> {
  if (!buffer.length) throw new Error('El PDF està buit.')
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error('El PDF és massa gran. Prova amb un document inferior a 18 MB.')
  }

  const parsed = await pdfParse(buffer)
  const text = cleanPdfText(parsed.text || '')

  if (text.length < 80) {
    throw new Error('No s’ha pogut extreure prou text del PDF. Pot ser un PDF escanejat com a imatge.')
  }

  return {
    text,
    pages: parsed.numpages,
    source,
  }
}

export async function extractPdfTextFromUrl(url: string): Promise<PdfReadResult> {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('La URL del document no és vàlida.')
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 MonitorPolitic/1.0',
      Accept: 'application/pdf,text/html,*/*',
    },
  })

  if (!res.ok) throw new Error(`No s’ha pogut descarregar el document (${res.status}).`)

  const contentType = res.headers.get('content-type') || ''
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (!contentType.includes('pdf') && !url.toLowerCase().includes('.pdf')) {
    const text = cleanPdfText(buffer.toString('utf8'))
    if (text.length < 80) {
      throw new Error('El document descarregat no sembla un PDF ni conté text suficient.')
    }
    return { text, source: 'url' }
  }

  return extractPdfTextFromBuffer(buffer, 'url')
}
