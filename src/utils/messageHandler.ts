import type {
  ChatCompletionResponse,
  ChatFile,
  ChatMessageDraft,
  MessageRole,
  MessageUpdateCallback,
  StreamChatCompletionChunk,
} from '@/types/chat'

const createSpeedValue = (completionTokens: number, startTime: number) => {
  const seconds = (Date.now() - startTime) / 1000 || 1
  return (completionTokens / seconds).toFixed(2)
}

const formatMessage = (
  role: MessageRole,
  content: string,
  reasoningContent = '',
  files: ChatFile[] = [],
): ChatMessageDraft => ({
  id: Date.now(),
  role,
  content,
  reasoning_content: reasoningContent,
  files,
  completion_tokens: 0,
  speed: 0,
  loading: false,
})

const handleStreamResponse = async (response: Response, updateCallback: MessageUpdateCallback) => {
  if (!response.body) {
    throw new Error('Streaming response body is empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let accumulatedContent = ''
  let accumulatedReasoning = ''
  const startTime = Date.now()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line === 'data: [DONE]' || !line.startsWith('data: ')) continue

      try {
        const data = JSON.parse(line.slice(6)) as StreamChatCompletionChunk
        const content = data.choices?.[0]?.delta?.content || ''
        const reasoning = data.choices?.[0]?.delta?.reasoning_content || ''
        const completionTokens = data.usage?.completion_tokens || 0

        accumulatedContent += content
        accumulatedReasoning += reasoning

        updateCallback(
          accumulatedContent,
          accumulatedReasoning,
          completionTokens,
          createSpeedValue(completionTokens, startTime),
        )
      } catch (error) {
        console.error('解析流式数据失败:', line, error)
      }
    }
  }

  const finalLine = buffer.trim()
  if (!finalLine || finalLine === 'data: [DONE]' || !finalLine.startsWith('data: ')) {
    return
  }

  try {
    const data = JSON.parse(finalLine.slice(6)) as StreamChatCompletionChunk
    const content = data.choices?.[0]?.delta?.content || ''
    const reasoning = data.choices?.[0]?.delta?.reasoning_content || ''
    const completionTokens = data.usage?.completion_tokens || 0

    accumulatedContent += content
    accumulatedReasoning += reasoning

    updateCallback(
      accumulatedContent,
      accumulatedReasoning,
      completionTokens,
      createSpeedValue(completionTokens, startTime),
    )
  } catch (error) {
    console.error('解析最后残留数据失败:', finalLine, error)
  }
}

const handleNormalResponse = (
  response: ChatCompletionResponse,
  updateCallback: MessageUpdateCallback,
) => {
  const message = response.choices[0]?.message
  updateCallback(
    message?.content || '',
    message?.reasoning_content || '',
    response.usage?.completion_tokens || 0,
    response.speed || 0,
  )
}

const handleResponse = async (
  response: Response | ChatCompletionResponse,
  isStream: boolean,
  updateCallback: MessageUpdateCallback,
) => {
  if (isStream) {
    await handleStreamResponse(response as Response, updateCallback)
    return
  }

  handleNormalResponse(response as ChatCompletionResponse, updateCallback)
}

export const messageHandler = {
  formatMessage,
  handleStreamResponse,
  handleNormalResponse,
  handleResponse,
}
