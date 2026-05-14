import { retrieveRelevantChunks } from './retrievalService.js'

const DEFAULT_TOP_K = 3
const DEFAULT_MAX_CONTEXT_LENGTH = 3000

export const getLatestUserQuestion = (messages) => {
  if (!Array.isArray(messages)) {
    return ''
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && typeof message.content === 'string')

  return latestUserMessage?.content || ''
}

export const formatChunksAsContext = (
  chunks,
  options = {},
) => {
  const maxContextLength = options.maxContextLength || DEFAULT_MAX_CONTEXT_LENGTH

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return ''
  }

  let context = ''

  for (const chunk of chunks) {
    const block = [
      `【片段 ${chunk.index}】`,
      chunk.content,
    ].join('\n')

    const nextContext = context
      ? `${context}\n\n${block}`
      : block

    if (nextContext.length > maxContextLength) {
      break
    }

    context = nextContext
  }

  return context
}

export const buildRagSystemPrompt = (context) => {
  return [
    '你是一个基于资料回答问题的助手。',
    '请根据“资料区”的内容回答用户问题。',
    '如果资料区信息与你的已有知识冲突，以资料区为准。',
    '如果资料区没有相关信息，请明确说明“资料中未提及”，不要编造。',
    '回答时保持简洁、准确。',
    '',
    '资料区：',
    context,
  ].join('\n')
}

const mergeRagSystemMessage = (messages, ragSystemMessage) => {
  const existingSystemIndex = messages.findIndex((message) => message.role === 'system')

  if (existingSystemIndex === -1) {
    return [
      ragSystemMessage,
      ...messages,
    ]
  }

  const mergedMessages = [...messages]
  const existingSystemMessage = mergedMessages[existingSystemIndex]

  mergedMessages[existingSystemIndex] = {
    ...existingSystemMessage,
    content: [
      ragSystemMessage.content,
      '',
      '原始系统指令：',
      existingSystemMessage.content,
    ].join('\n'),
  }

  return mergedMessages
}

export const buildRagMessages = (
  messages,
  documentChunks,
  options = {},
) => {
  const topK = options.topK || DEFAULT_TOP_K
  const question = getLatestUserQuestion(messages)

  if (!question || !Array.isArray(documentChunks) || documentChunks.length === 0) {
    return {
      messages,
      relevantChunks: [],
      context: '',
    }
  }

  const relevantChunks = retrieveRelevantChunks(question, documentChunks, {
    topK,
  })

  const context = formatChunksAsContext(relevantChunks, {
    maxContextLength: options.maxContextLength || DEFAULT_MAX_CONTEXT_LENGTH,
  })

  if (!context) {
    return {
      messages,
      relevantChunks,
      context,
    }
  }

  const ragSystemMessage = {
    role: 'system',
    content: buildRagSystemPrompt(context),
  }

  return {
    messages: mergeRagSystemMessage(messages, ragSystemMessage),
    relevantChunks,
    context,
  }
}
