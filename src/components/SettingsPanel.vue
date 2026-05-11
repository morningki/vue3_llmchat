<script setup>
import { ref, watch, computed } from 'vue'
import { useSettingStore, modelOptions } from '@/stores/setting'
import { useChatStore } from '@/stores/chat'
import { QuestionFilled } from '@element-plus/icons-vue'

const settingStore = useSettingStore()
const chatStore = useChatStore()

const visible = ref(false)

const currentMaxTokens = computed(() => {
  const selectedModel = modelOptions.find((option) => option.value === settingStore.settings.model)
  return selectedModel ? selectedModel.maxTokens : 4096
})

watch(
  () => settingStore.settings.model,
  (newModel) => {
    const selectedModel = modelOptions.find((option) => option.value === newModel)
    if (selectedModel) {
      settingStore.settings.maxTokens = Math.min(
        settingStore.settings.maxTokens,
        selectedModel.maxTokens,
      )
    }
  },
)

const openDrawer = () => {
  if (chatStore.isLoading) return

  visible.value = true
}

defineExpose({
  openDrawer,
})
</script>

<template>
  <el-drawer v-model="visible" title="设置" direction="rtl" size="350px">
    <div class="setting-container">
      <div class="setting-item">
        <div class="setting-label">Model</div>
        <el-select
          v-model="settingStore.settings.model"
          class="model-select"
          placeholder="选择模型"
        >
          <el-option
            v-for="option in modelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>

      <div class="setting-item">
        <div class="setting-label-row">
          <div class="label-with-tooltip">
            <span>流式响应</span>
            <el-tooltip content="开启后将流式显示 AI 回复" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch v-model="settingStore.settings.stream" />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-label">
          Max Tokens
          <el-tooltip content="生成文本的最大长度" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="setting-control">
          <el-slider
            v-model="settingStore.settings.maxTokens"
            :min="1"
            :max="currentMaxTokens"
            :step="1"
            :show-tooltip="false"
            class="setting-slider"
          />
          <el-input-number
            v-model="settingStore.settings.maxTokens"
            :min="1"
            :max="currentMaxTokens"
            :step="1"
            controls-position="right"
          />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-label">
          Temperature
          <el-tooltip content="值越高，回答越随机" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="setting-control">
          <el-slider
            v-model="settingStore.settings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :show-tooltip="false"
            class="setting-slider"
          />
          <el-input-number
            v-model="settingStore.settings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            controls-position="right"
          />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-label">
          Top-P
          <el-tooltip content="核采样阈值" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="setting-control">
          <el-slider
            v-model="settingStore.settings.topP"
            :min="0"
            :max="1"
            :step="0.1"
            :show-tooltip="false"
            class="setting-slider"
          />
          <el-input-number
            v-model="settingStore.settings.topP"
            :min="0"
            :max="1"
            :step="0.1"
            controls-position="right"
          />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-label">
          Top-K
          <el-tooltip content="保留概率最高的 K 个词" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="setting-control">
          <el-slider
            v-model="settingStore.settings.topK"
            :min="1"
            :max="100"
            :step="1"
            :show-tooltip="false"
            class="setting-slider"
          />
          <el-input-number
            v-model="settingStore.settings.topK"
            :min="1"
            :max="100"
            :step="1"
            controls-position="right"
          />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.setting-container {
  padding: 20px;
  color: #27272a;
}

.setting-item {
  margin-bottom: 24px;

  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 500;
    color: #27272a;
  }

  .setting-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: #27272a;

    .label-with-tooltip {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: 16px;

    .setting-slider {
      flex: 1;
    }

    :deep(.el-input-number) {
      width: 120px;
    }
  }

  .model-select {
    width: 100%;
  }

  :deep(.el-select-dropdown__item) {
    color: #27272a;
  }
}
</style>
