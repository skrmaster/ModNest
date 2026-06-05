<template>
  <!-- Mod 安装预览弹窗 -->
  <v-dialog v-model="showDialog" max-width="800" persistent>
    <v-card>
      <!-- 标题 -->
      <v-card-title class="text-h5 font-weight-bold bg-primary text-white">
        {{ data.exists ? 'Mod 已存在 - 覆盖安装' : 'Mod 安装预览' }}
      </v-card-title>

      <v-card-text class="pa-6">
        <v-row no-gutters>
          <!-- 左侧：预览图片 -->
          <v-col cols="12" md="6" class="d-flex justify-center align-center pa-4">
            <div class="preview-image-container">
              <v-img
                :src="previewImageUrl"
                alt="Mod 预览图"
                aspect-ratio="16/9"
                max-width="320"
                contain
                class="rounded-lg shadow-sm border"
              />
              <div v-if="!previewImageUrl" class="text-center py-10 text-medium-emphasis">
                无预览图
              </div>
            </div>
          </v-col>

          <!-- 右侧：可编辑信息 -->
          <v-col cols="12" md="6" class="pa-4">
            <v-form class="d-flex flex-column gap-4">
              <!-- Mod 名称 -->
              <v-text-field
                v-model="localForm.modName"
                label="Mod 名称"
                placeholder="请输入 Mod 名称"
                variant="outlined"
                required
              />

              <!-- 创建时间 -->
              <v-text-field
                v-model="localForm.createdAt"
                label="创建时间"
                placeholder="创建时间"
                variant="outlined"
                readonly
                color="default"
              />

              <!-- 提示信息：已存在 -->
              <v-alert
                v-if="data.exists"
                color="warning"
                border="start"
                icon="mdi-alert"
                class="mt-2"
              >
                该 Mod 已存在，覆盖安装会替换原有文件！
              </v-alert>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 底部按钮 -->
      <v-card-actions class="px-6 pb-6 justify-end gap-2">
        <v-btn color="grey" @click="handleCancel"> 取消 </v-btn>

        <!-- 不存在：安装按钮 -->
        <v-btn v-if="!data.exists" color="primary" @click="handleInstall"> 安装 </v-btn>

        <!-- 已存在：覆盖安装按钮 -->
        <v-btn v-if="data.exists" color="red-darken-1" @click="handleOverrideInstall">
          覆盖安装
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

// 弹窗接收的参数
interface ModPreviewData {
  archivePath: string
  category: string
  itemName: string
  modName: string
  createdAt: string
  exists: boolean
  previewImage?: string
}

// Props
const props = defineProps<{
  /** 控制弹窗显示 */
  modelValue: boolean
  /** Mod 预览数据 */
  data: ModPreviewData
  /** 预览图的 base64 / 本地路径 / 网络地址 */
  previewImageUrl: string
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  cancel: []
  install: [form: { modName: string; createdAt: string }]
  overrideInstall: [form: { modName: string; createdAt: string }]
}>()

// 弹窗状态
const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 表单数据（可编辑）
const localForm = ref({
  modName: '',
  createdAt: ''
})

// 监听数据变化，自动回填
watch(
  () => props.data,
  (val) => {
    if (val) {
      localForm.value.modName = val.modName
      localForm.value.createdAt = val.createdAt
    }
  },
  { immediate: true }
)

// 取消
const handleCancel = () => {
  emit('cancel')
  showDialog.value = false
}

// 安装
const handleInstall = () => {
  emit('install', localForm.value)
  showDialog.value = false
}

// 覆盖安装
const handleOverrideInstall = () => {
  emit('overrideInstall', localForm.value)
  showDialog.value = false
}
</script>

<style scoped>
.preview-image-container {
  width: 100%;
  max-width: 320px;
}
</style>
