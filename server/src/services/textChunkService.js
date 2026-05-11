// 默认每个 chunk 的最大字符数
const DEFAULT_CHUNK_SIZE = 800

// 相邻 chunk 之间的重叠字符数
// 作用：避免一句话刚好被切断，导致上下文丢失
const DEFAULT_CHUNK_OVERLAP = 100

// 文本清洗：把不同来源的文本整理成更适合切分和检索的格式
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    // 统一 Windows / Linux / Mac 的换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // 去掉每一行首尾多余空格
    .split('\n')
    .map((line) => line.trim())

    // 过滤掉完全空白的行
    .filter((line) => line.length > 0)

    // 再用单个换行拼回去，保留基本段落结构
    .join('\n')

    // 把连续 3 个以上换行压缩成 2 个
    .replace(/\n{3,}/g, '\n\n')

    // 去掉整个文本首尾空白
    .trim()
}

// 按字符长度切分文本
export const splitTextIntoChunks = (
  text,
  options = {},
) => {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP

  // 先做基础清洗
  const cleanedText = cleanText(text)

  if (!cleanedText) {
    return []
  }

  // overlap 不能大于等于 chunkSize，否则会造成死循环
  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be smaller than chunkSize')
  }

  const chunks = []
  let start = 0
  let index = 0

  while (start < cleanedText.length) {
    const end = Math.min(start + chunkSize, cleanedText.length)

    const content = cleanedText.slice(start, end).trim()

    if (content) {
      chunks.push({
        // chunk 序号，后续方便定位
        index,

        // 当前片段内容
        content,

        // 当前片段在清洗后文本中的起始位置
        start,

        // 当前片段在清洗后文本中的结束位置
        end,

        // 当前片段字符长度
        length: content.length,
      })

      index += 1
    }

    // 下一个 chunk 从 end - overlap 开始
    // 这样相邻 chunk 会有一小段重叠内容
    start = end - chunkOverlap

    // 如果已经到达文本末尾，结束循环
    if (end === cleanedText.length) {
      break
    }
  }

  return chunks
}
