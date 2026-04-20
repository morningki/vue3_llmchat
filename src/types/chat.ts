export type MessageRole = 'user' | 'assistant' | 'system'
export type ChatFileType = 'image' | 'file'

export interface ChatFile {
  name: string
  url: string
  type: ChatFileType
  size: number
}

export interface ChatMessage {
  id: number | string
  role: MessageRole
  content: string
  reasoning_content: string
  files: ChatFile[]
  completion_tokens: number
  speed: number | string
  loading: boolean
  timestamp?: string
}

export type ChatMessageDraft = Omit<ChatMessage, 'timestamp'>

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

export interface ChatSettings {
  model: string
  apiKey: string
  stream: boolean
  maxTokens: number
  temperature: number
  topP: number
  topK: number
}

export interface ModelOption {
  label: string
  value: string
  maxTokens: number
}

export interface ChatCompletionRequestMessage {
  role: MessageRole
  content: string
}

export interface ChatCompletionChoiceMessage {
  content: string
  reasoning_content?: string
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: ChatCompletionChoiceMessage
  }>
  usage: {
    completion_tokens: number
  }
  speed?: string
}

export interface StreamChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: string
      reasoning_content?: string
    }
  }>
  usage?: {
    completion_tokens?: number
  }
}

export type MessageUpdateCallback = (
  content: string,
  reasoningContent: string,
  completionTokens: number,
  speed: number | string,
) => void
