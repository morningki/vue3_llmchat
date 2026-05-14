import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { UploadedDocument } from '@/types/chat'

export const useUploadStore = defineStore('llm-upload', () => {
  const uploadedDocuments = ref<UploadedDocument[]>([])
  const currentDocument = ref<UploadedDocument | null>(null)
  const isUploading = ref(false)
  const uploadError = ref('')

  const setUploading = (value: boolean) => {
    isUploading.value = value
  }

  const setUploadError = (message: string) => {
    uploadError.value = message
  }

  const addUploadedDocument = (document: UploadedDocument) => {
    uploadedDocuments.value.push(document)
    currentDocument.value = document
    uploadError.value = ''
  }

  const clearCurrentDocument = () => {
    currentDocument.value = null
  }

  return {
    uploadedDocuments,
    currentDocument,
    isUploading,
    uploadError,
    setUploading,
    setUploadError,
    addUploadedDocument,
    clearCurrentDocument,
  }
})
