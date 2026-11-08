/**
 * utils/document.js — Convierte el texto de los documentos oficiales
 * (que vienen con marcado simple: **negritas**, tablas | ... |, \_ firmas)
 * en HTML seguro para mostrar en la hoja A4 y para exportar a .doc.
 *
 * Primero se escapa TODO el HTML del texto (anti-XSS) y después se
 * aplican las transformaciones propias del marcado del documento.
 */

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Convierte una tabla markdown (ya escapada) en <table>. */
const tableToHtml = (block) => {
  const filas = block
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))
  if (filas.length < 2) return `<p>${block}</p>`

  const celdas = (fila) =>
    fila
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))

  const esSeparador = /^\|[\s:-]+\|/.test(filas[1]) && !/\w/.test(filas[1])
  const encabezado = esSeparador ? celdas(filas[0]) : null
  const cuerpo = (esSeparador ? filas.slice(2) : filas.slice(1)).map(celdas)

  let html = '<table class="doc-table">'
  if (encabezado) {
    html += `<thead><tr>${encabezado.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
  }
  html += `<tbody>${cuerpo
    .map((fila) => `<tr>${fila.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`
  return html
}

/**
 * Texto oficial → HTML. Los bloques separados por línea en blanco son
 * párrafos; los que empiezan con | son tablas.
 */
export function documentToHtml(text) {
  if (!text) return ''
  const limpio = escapeHtml(text).replace(/\\_/g, '_') // \_ → _ (líneas de firma)
  return limpio
    .split(/\n{2,}/)
    .map((bloque) => {
      const b = bloque.trim()
      if (!b) return ''
      if (b.startsWith('|')) return tableToHtml(b)
      const inner = b
        .replace(/\n/g, '<br/>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return `<p>${inner}</p>`
    })
    .join('\n')
}

/**
 * Descarga un texto como archivo .doc (Word abre HTML sin problemas).
 * Se usa para la exportación documental RF08.
 */
export function downloadAsDoc(text, filename = 'documento.doc') {
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${filename}</title></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.6;">
${documentToHtml(text)}
</body></html>`
  // \ufeff (BOM) para que Word detecte UTF-8 y muestre bien los acentos
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
