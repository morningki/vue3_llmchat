import type { UploadErrorResponse, UploadResponse, UploadedDocument } from '@/types/chat'

export const uploadFile = async (file: File): Promise<UploadedDocument> => {
  const formData = new FormData()

  // 字段名必须叫 file，因为后端使用 upload.single('file') 接收。
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as UploadErrorResponse | null
    const message = errorData?.error || errorData?.message || `Upload failed: ${response.status}`
    const error = new Error(message)

    error.name = errorData?.errorCode || 'UPLOAD_FAILED'
    throw error
  }

  const result = (await response.json()) as UploadResponse
  return result.data
}
