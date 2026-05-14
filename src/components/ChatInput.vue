<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Close, Document } from '@element-plus/icons-vue'

import { useUploadStore } from '@/stores/upload'
import { uploadFile as requestUploadFile } from '@/utils/uploadApi'
import type { ChatFile } from '@/types/chat'

interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  send: [{ text: string; files: ChatFile[] }]
}>()

const inputValue = ref('')
const fileList = ref<ChatFile[]>([])
const previewVisible = ref(false)
const previewIndex = ref(0)
const uploadStore = useUploadStore()

const allowedDocumentExtensions = ['.txt', '.md', '.pdf']
const maxDocumentFileSize = 20 * 1024 * 1024

const imagePreviewList = computed(() =>
  fileList.value.filter((file) => file.type === 'image').map((file) => file.url),
)

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.')

  if (dotIndex === -1) {
    return ''
  }

  return fileName.slice(dotIndex).toLowerCase()
}

const validateDocumentFile = (file: File) => {
  const extension = getFileExtension(file.name)

  if (!allowedDocumentExtensions.includes(extension)) {
    throw new Error('只支持 txt、md、pdf 文件')
  }

  if (file.size > maxDocumentFileSize) {
    throw new Error('文件大小不能超过 20MB')
  }
}

const handleSend = () => {
  if (!inputValue.value.trim() || props.loading || uploadStore.isUploading) return

  emit('send', {
    text: inputValue.value.trim(),
    files: fileList.value,
  })

  inputValue.value = ''
  fileList.value = []
}

const handleNewline = (event: KeyboardEvent) => {
  event.preventDefault()
  inputValue.value += '\n'
}

const handleDocumentUpload = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return false

  try {
    validateDocumentFile(file)
    uploadStore.setUploading(true)
    uploadStore.setUploadError('')

    const uploadedDocument = await requestUploadFile(file)

    uploadStore.addUploadedDocument(uploadedDocument)
    fileList.value.push({
      name: uploadedDocument.originalName,
      url: `document:${uploadedDocument.filename}`,
      type: 'file',
      size: uploadedDocument.size,
      uploadedDocument,
    })

    ElMessage.success('文件上传成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : '文件上传失败'
    uploadStore.setUploadError(message)
    ElMessage.error(message)
  } finally {
    uploadStore.setUploading(false)
  }

  return false
}

const handleFileRemove = (file: ChatFile) => {
  const index = fileList.value.findIndex((item) => item.url === file.url)

  if (index === -1) {
    return
  }

  if (file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }

  fileList.value.splice(index, 1)
}

const openImagePreview = (file: ChatFile) => {
  const index = imagePreviewList.value.findIndex((url) => url === file.url)
  if (index === -1) return

  previewIndex.value = index
  previewVisible.value = true
}

const closeImagePreview = () => {
  previewVisible.value = false
}
</script>

<template>
  <div class="chat-input-wrapper">
    <div v-if="fileList.length > 0" class="preview-area">
      <div v-for="file in fileList" :key="file.url" class="preview-item">
        <div v-if="file.type === 'image'" class="image-preview" @click="openImagePreview(file)">
          <img :src="file.url" :alt="file.name" />
          <div class="remove-btn" @click.stop="handleFileRemove(file)">
            <el-icon><Close /></el-icon>
          </div>
        </div>

        <div v-else class="file-preview">
          <el-icon><Document /></el-icon>
          <div class="file-meta">
            <div class="file-main">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ (file.size / 1024).toFixed(1) }}KB</span>
            </div>
            <div v-if="file.uploadedDocument" class="file-status">
              <span :class="{ warning: !file.uploadedDocument.readable }">
                {{
                  file.uploadedDocument.readable
                    ? `已解析 · ${file.uploadedDocument.chunkCount} chunks`
                    : file.uploadedDocument.textMessage
                }}
              </span>
            </div>
          </div>
          <div class="remove-btn" @click="handleFileRemove(file)">
            <el-icon><Close /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-input
      v-model="inputValue"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 6 }"
      placeholder="输入消息，Enter 发送，Shift + Enter 换行"
      resize="none"
      @keydown.enter.exact.prevent="handleSend"
      @keydown.enter.shift="handleNewline"
    />

    <div class="button-group">
      <el-upload
        class="upload-btn"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleDocumentUpload"
        accept=".txt,.md,.pdf"
        :disabled="uploadStore.isUploading"
      >
        <button class="action-btn" :disabled="uploadStore.isUploading">
          <img src="@/assets/photo/附件.png" alt="link" />
        </button>
      </el-upload>

      <button
        class="action-btn send-btn"
        :disabled="props.loading || uploadStore.isUploading"
        @click="handleSend"
      >
        <img src="@/assets/photo/发送.png" alt="send" />
      </button>
    </div>
  </div>

  <el-image-viewer
    v-if="previewVisible"
    :url-list="imagePreviewList"
    :initial-index="previewIndex"
    @close="closeImagePreview"
  />
</template>

<style lang="scss" scoped>
.chat-input-wrapper {
  padding: 0.8rem;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  .preview-area {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;

    .preview-item {
      position: relative;
      overflow: hidden;
      border-radius: 8px;

      .image-preview {
        width: 60px;
        height: 60px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .file-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 320px;
        padding: 8px 30px 8px 8px;
        background-color: #f4f4f5;
        border-radius: 8px;

        .file-meta {
          min-width: 0;
        }

        .file-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .file-name {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          color: #909399;
          font-size: 12px;
          white-space: nowrap;
        }

        .file-status {
          margin-top: 2px;
          color: #67c23a;
          font-size: 12px;

          .warning {
            color: #e6a23c;
          }
        }
      }

      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        color: #fff;
        cursor: pointer;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 50%;

        &:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
      }
    }
  }

  :deep(.el-textarea__inner) {
    border: none;
    border-radius: 8px;
    resize: none;
    box-shadow: none;

    &:focus {
      border: none;
      box-shadow: none;
    }
  }

  .button-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;

    .upload-btn {
      display: inline-block;
    }

    .divider {
      width: 1px;
      height: 1rem;
      margin: 0 0.25rem 0 0.125rem;
      background-color: var(--border-color);
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      cursor: pointer;
      background: none;
      border: none;
      border-radius: 50%;
      transition: background-color 0.3s;

      img {
        width: 1rem;
        height: 1rem;
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      &.send-btn {
        width: 2rem;
        height: 2rem;
        background-color: #3f7af1;

        img {
          width: 1.25rem;
          height: 1.25rem;
        }

        &:hover {
          background-color: #3266d6;
        }

        &:disabled:hover {
          background-color: #3f7af1;
        }
      }
    }
  }
}
</style>
