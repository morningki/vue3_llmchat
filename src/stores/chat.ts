import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ChatMessage, ChatMessageDraft, Conversation } from '@/types/chat'

const DEFAULT_CONVERSATION_TITLE = '日常问答'

const createConversationRecord = (): Conversation => ({
  id: Date.now().toString(),
  title: DEFAULT_CONVERSATION_TITLE,
  messages: [],
  createdAt: Date.now(),
})

export const useChatStore = defineStore(
  'llm-chat',
  () => {
    const conversations = ref<Conversation[]>([
      {
        id: '1',
        title: DEFAULT_CONVERSATION_TITLE,
        messages: [],
        createdAt: Date.now(),
      },
    ])

    const currentConversationId = ref('1')
    const isLoading = ref(false)

    const currentConversation = computed<Conversation | undefined>(() =>
      conversations.value.find((conv) => conv.id === currentConversationId.value),
    )

    const currentMessages = computed<ChatMessage[]>(
      () => currentConversation.value?.messages ?? [],
    )

    const createConversation = () => {
      const newConversation = createConversationRecord()
      conversations.value.unshift(newConversation)
      currentConversationId.value = newConversation.id
    }

    const switchConversation = (conversationId: string) => {
      currentConversationId.value = conversationId
    }

    const addMessage = (message: ChatMessageDraft) => {
      if (!currentConversation.value) return

      currentConversation.value.messages.push({
        ...message,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      })
    }

    const setIsLoading = (value: boolean) => {
      isLoading.value = value
    }

    const getLastMessage = (): ChatMessage | null => {
      const messages = currentConversation.value?.messages
      if (!messages?.length) return null

      return messages[messages.length - 1] ?? null
    }

    const updateLastMessage = (
      content: string,
      reasoningContent = '',
      completionTokens = 0,
      speed: number | string = 0,
    ) => {
      const lastMessage = getLastMessage()
      if (!lastMessage) return

      lastMessage.content = content
      lastMessage.reasoning_content = reasoningContent
      lastMessage.completion_tokens = completionTokens
      lastMessage.speed = speed
    }

    const updateConversationTitle = (conversationId: string, newTitle: string) => {
      const conversation = conversations.value.find((item) => item.id === conversationId)
      if (conversation) {
        conversation.title = newTitle
      }
    }

    const deleteConversation = (conversationId: string) => {
      const index = conversations.value.findIndex((item) => item.id === conversationId)
      if (index === -1) return

      conversations.value.splice(index, 1)

      if (conversations.value.length === 0) {
        createConversation()
      } else if (conversationId === currentConversationId.value) {
        currentConversationId.value = conversations.value[0].id
      }
    }

    return {
      conversations,
      currentConversationId,
      currentConversation,
      currentMessages,
      isLoading,
      addMessage,
      setIsLoading,
      updateLastMessage,
      getLastMessage,
      createConversation,
      switchConversation,
      updateConversationTitle,
      deleteConversation,
    }
  },
  {
    persist: true,
  },
)
