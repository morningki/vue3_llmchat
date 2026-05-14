export type MessageRole = 'user' | 'assistant' | 'system'
export type ChatFileType = 'image' | 'file'

export interface ChatFile {
  name: string
  url: string
  type: ChatFileType
  size: number
  uploadedDocument?: UploadedDocument
}

export interface ChatCompletionResult {
  response: Response | ChatCompletionResponse
  isStream: boolean
}

export interface ChunkPreview {
  index: number
  content: string
  start?: number
  end?: number
  length: number
}

export interface UploadedDocument {
  originalName: string
  filename: string
  extension: string
  mimeType: string
  size: number
  readable: boolean
  textPreview: string
  textLength: number
  textMessage: string
  pageCount: number | null
  chunkCount: number
  chunksPreview: ChunkPreview[]
  limits: {
    allowedExtensions: string[]
    maxFileSize: number
  }
}

export interface UploadResponse {
  code: number
  message: string
  data: UploadedDocument
}

export interface UploadErrorResponse {
  code: number
  message: string
  error?: string
  errorCode?: string
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
