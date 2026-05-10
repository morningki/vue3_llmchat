const getLlmConfig = () => {
  const apiKey = process.env.LLM_API_KEY
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1'
  const defaultModel = process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-R1'

  if (!apiKey) {
    throw new Error('缺少 LLM_API_KEY 环境变量配置')
  }

  return {
    apiKey,
    baseUrl,
    defaultModel,
  }
}

const buildChatPayload = (payload) => {
  const { defaultModel } = getLlmConfig()

  // 统一构造发给上游大模型的请求体，避免流式和非流式重复写参数
  return {
    model: payload.model || defaultModel,
    messages: payload.messages,
    stream: payload.stream,
    temperature: payload.temperature ?? 0.7,
    max_tokens: payload.max_tokens ?? 4096,
    top_p: payload.top_p ?? 0.7,
    top_k: payload.top_k ?? 50,
  }
}

const requestUpstreamChat = async (requestBody) => {
  const { apiKey, baseUrl } = getLlmConfig()

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`上游大模型接口请求失败：${response.status} - ${errorText}`)
  }

  return response
}

export const normalChatService = async (payload) => {
  const requestBody = buildChatPayload({
    ...payload,
    stream: false,
  })

  console.log('[chat service] normal request', {
    model: requestBody.model,
    messageCount: requestBody.messages.length,
    stream: requestBody.stream,
  })

  const response = await requestUpstreamChat(requestBody)
  return response.json()
}

export const streamChatService = async (payload, res) => {
  const requestBody = buildChatPayload({
    ...payload,
    stream: true,
  })

  console.log('[chat service] stream request', {
    model: requestBody.model,
    messageCount: requestBody.messages.length,
    stream: requestBody.stream,
  })

  const response = await requestUpstreamChat(requestBody)

  if (!response.body) {
    throw new Error('上游接口未返回可读流 response.body')
  }

  const reader = response.body.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // 原样转发上游大模型的 SSE chunk，前端 messageHandler 会继续解析 data: ...
      res.write(value)
    }
  } finally {
    res.end()
  }
}
