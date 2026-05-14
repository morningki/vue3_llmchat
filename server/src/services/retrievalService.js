const CHINESE_STOP_WORDS = new Set([
  '的',
  '了',
  '和',
  '是',
  '在',
  '我',
  '你',
  '他',
  '她',
  '它',
  '们',
  '这',
  '那',
  '有',
  '与',
  '及',
  '或',
  '一个',
  '什么',
  '如何',
  '为什么',
])

const ENGLISH_STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'to',
  'of',
  'and',
  'or',
  'in',
  'on',
  'for',
  'with',
  'what',
  'how',
  'why',
])

const CHINESE_QUESTION_FILLERS = [
  '请问',
  '什么',
  '为什么',
  '怎么',
  '怎样',
  '如何',
  '是否',
  '有没有',
  '有啥',
  '有哪些',
  '有什么',
]

const escapeRegExp = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
}

const createKeywordPatterns = (keywords = []) => {
  return keywords
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') {
        return {
          keyword: item,
          pattern: new RegExp(escapeRegExp(item), 'g'),
        }
      }

      return item
    })
    .filter(({ keyword, pattern }) => keyword && pattern)
}

const removeChineseQuestionFillers = (text) => {
  return [...CHINESE_QUESTION_FILLERS]
    .sort((a, b) => b.length - a.length)
    .reduce((result, filler) => {
      return result.replaceAll(filler, '')
    }, text)
}

const createChineseNgrams = (text) => {
  const grams = []
  const minSize = 2
  const maxSize = Math.min(4, text.length)

  for (let size = minSize; size <= maxSize; size += 1) {
    for (let start = 0; start <= text.length - size; start += 1) {
      grams.push(text.slice(start, start + size))
    }
  }

  return grams
}

export const extractKeywords = (question) => {
  if (!question || typeof question !== 'string') {
    return []
  }

  const normalizedQuestion = question.toLowerCase()
  const tokens = normalizedQuestion.match(/[a-z0-9]+|[\u4e00-\u9fa5]+/g) || []
  const keywords = []

  tokens.forEach((token) => {
    if (/^[a-z0-9]+$/.test(token)) {
      if (token.length > 1 && !ENGLISH_STOP_WORDS.has(token)) {
        keywords.push(token)
      }

      return
    }

    const cleanedChineseToken = removeChineseQuestionFillers(token)

    if (!cleanedChineseToken || CHINESE_STOP_WORDS.has(cleanedChineseToken)) {
      return
    }

    if (cleanedChineseToken.length >= 2) {
      keywords.push(cleanedChineseToken)
    }

    // 中文没有引入分词库时，补充 2~4 字短语，提升“后端代理/文件上传”这类问题的命中率。
    createChineseNgrams(cleanedChineseToken)
      .filter((gram) => !CHINESE_STOP_WORDS.has(gram))
      .forEach((gram) => keywords.push(gram))
  })

  return Array.from(new Set(keywords))
}

export const scoreChunk = (chunk, keywordPatterns) => {
  const normalizedKeywordPatterns = createKeywordPatterns(keywordPatterns)

  if (!chunk?.content || normalizedKeywordPatterns.length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
    }
  }

  const content = chunk.content.toLowerCase()
  const matchedKeywords = []
  let score = 0

  normalizedKeywordPatterns.forEach(({ keyword, pattern }) => {
    const matches = content.match(pattern) || []
    const count = matches.length

    if (count === 0) {
      return
    }

    matchedKeywords.push(keyword)

    // 长关键词通常更有意义，所以给更高权重。
    const lengthWeight = keyword.length >= 4 ? 2 : 1
    score += count * lengthWeight

    // 如果关键词出现在 chunk 开头，说明该 chunk 可能更聚焦。
    if (content.indexOf(keyword) < 120) {
      score += 1
    }
  })

  return {
    score,
    matchedKeywords,
  }
}

export const retrieveRelevantChunks = (
  question,
  chunks,
  options = {},
) => {
  const topK = options.topK || 3
  const minScore = options.minScore || 1
  const keywords = extractKeywords(question)
  const keywordPatterns = createKeywordPatterns(keywords)

  if (!Array.isArray(chunks) || chunks.length === 0 || keywordPatterns.length === 0) {
    return []
  }

  // Expected caller: the /api/chat RAG path after uploaded chunks are persisted.
  return chunks
    .map((chunk) => {
      const result = scoreChunk(chunk, keywordPatterns)
      const densityScore = result.score / Math.max(chunk.content.length / 800, 1)

      return {
        ...chunk,
        score: Number(densityScore.toFixed(2)),
        rawScore: result.score,
        matchedKeywords: result.matchedKeywords,
      }
    })
    .filter((chunk) => chunk.rawScore >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
