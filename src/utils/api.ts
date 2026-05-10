import { useSettingStore } from '@/stores/setting'

import type { ChatCompletionRequestMessage, ChatCompletionResponse, ChatCompletionResult  } from '@/types/chat'

export const createChatCompletion = async (
  messages: ChatCompletionRequestMessage[],
): Promise<ChatCompletionResult> => {
  const settingStore = useSettingStore()
  const isStream = settingStore.settings.stream
  const payload = {
    model: settingStore.settings.model,
    messages,
    stream: isStream,
    max_tokens: settingStore.settings.maxTokens,
    temperature: settingStore.settings.temperature,
    top_p: settingStore.settings.topP,
    top_k: settingStore.settings.topK,
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  if (isStream) {
    return{
    response,
    isStream
    }
  }

  const data = (await response.json()) as ChatCompletionResponse
  return {
    response:data,
    isStream
  }
}
