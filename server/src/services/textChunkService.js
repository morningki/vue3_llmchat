const DEFAULT_CHUNK_SIZE = 800
const DEFAULT_CHUNK_OVERLAP = 100

export const cleanText = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    // 统一 Windows / Linux / macOS 的换行符。
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // 去掉每一行首尾多余空格，并过滤空行。
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

    // 保留基本段落结构。
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const findSoftBreakPoint = (text, start, hardEnd) => {
  const minEnd = start + Math.floor((hardEnd - start) * 0.6)
  const slice = text.slice(minEnd, hardEnd)
  const lastBreak = Math.max(
    slice.lastIndexOf('\n'),
    slice.lastIndexOf('。'),
    slice.lastIndexOf('！'),
    slice.lastIndexOf('？'),
    slice.lastIndexOf('. '),
  )

  if (lastBreak === -1) {
    return hardEnd
  }

  return minEnd + lastBreak + 1
}

export const splitTextIntoChunks = (
  text,
  options = {},
) => {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP
  const cleanedText = cleanText(text)

  if (!cleanedText) {
    return []
  }

  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0')
  }

  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be greater than or equal to 0 and smaller than chunkSize')
  }

  const chunks = []
  let start = 0
  let index = 0

  while (start < cleanedText.length) {
    const hardEnd = Math.min(start + chunkSize, cleanedText.length)
    const end = hardEnd === cleanedText.length
      ? hardEnd
      : findSoftBreakPoint(cleanedText, start, hardEnd)

    const content = cleanedText.slice(start, end).trim()

    if (content) {
      chunks.push({
        index,
        content,
        start,
        end,
        length: content.length,
      })

      index += 1
    }

    if (hardEnd === cleanedText.length) {
      break
    }

    start = Math.max(end - chunkOverlap, start + 1)
  }

  return chunks
}
