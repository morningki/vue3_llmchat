import { useSettingStore } from '@/stores/setting'

import type { ChatCompletionRequestMessage, ChatCompletionResponse } from '@/types/chat'

const API_BASE_URL = 'https://api.siliconflow.cn/v1'

export const createChatCompletion = async (
  messages: ChatCompletionRequestMessage[],
): Promise<Response | ChatCompletionResponse> => {
  const settingStore = useSettingStore()
  const payload = {
    model: settingStore.settings.model,
    messages,
    stream: settingStore.settings.stream,
    max_tokens: settingStore.settings.maxTokens,
    temperature: settingStore.settings.temperature,
    top_p: settingStore.settings.topP,
    top_k: settingStore.settings.topK,
  }

  const options: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settingStore.settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }

  try {
    const startTime = Date.now()
    const response = await fetch(`${API_BASE_URL}/chat/completions`, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (settingStore.settings.stream) {
      return response
    }

    const data = (await response.json()) as ChatCompletionResponse
    const duration = (Date.now() - startTime) / 1000
    const completionTokens = data.usage?.completion_tokens ?? 0
    data.speed = (completionTokens / (duration || 1)).toFixed(2)
    return data
  } catch (error) {
    console.error('Chat API Error:', error)
    throw error
  }
}
