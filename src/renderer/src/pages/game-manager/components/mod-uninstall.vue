<template>
  <v-dialog
    v-model="isDialogOpen"
    max-width="500px"
    persistent
    @click:outside="!isLoading && handleCancel"
  >
    <v-card>
      <v-card-title class="text-h5 font-medium d-flex align-center justify-between">
        卸载 {{ modName }}
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          :disabled="isLoading"
          @click="handleCancel"
        ></v-btn>
      </v-card-title>

      <v-card-text class="py-4">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-radio-group v-model="uninstallType" class="pt-1" :disabled="isLoading">
          <div class="mb-3 pa-3 border rounded">
            <v-radio
              label="移入回收站"
              value="recycle"
              color="primary"
              :disabled="isLoading"
            ></v-radio>
            <div class="text-caption text-gray-500 ml-10">文件将被移入系统回收站，可以随时恢复</div>
          </div>

          <div class="mb-2 pa-3 border rounded">
            <v-radio label="彻底删除" value="delete" color="error" :disabled="isLoading"></v-radio>
            <div class="text-caption text-error font-medium ml-10">此操作无法撤销！</div>
          </div>
        </v-radio-group>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <v-btn color="secondary" :disabled="isLoading" @click="handleCancel"> 取消 </v-btn>
        <v-btn
          variant="tonal"
          :color="'primary'"
          class="px-4"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleConfirm"
        >
          {{ isLoading ? '卸载中...' : '确认卸载' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ModInfo } from '@shared/types/mod'
import { ref } from 'vue'

const emit = defineEmits<{
  delete: []
  recycle: []
}>()

const isDialogOpen = ref(false)
const uninstallType = ref<'recycle' | 'delete'>('recycle')
const isLoading = ref(false)
const errorMessage = ref('')

const handleCancel = () => {
  if (!isLoading.value) {
    isDialogOpen.value = false
  }
}

const handleConfirm = () => {
  isLoading.value = true
  if (uninstallType.value === 'delete') {
    emit('delete')
  } else {
    emit('recycle')
  }
}

const modName = ref('')
function openModal(data: ModInfo) {
  isDialogOpen.value = true
  modName.value = data.name
  uninstallType.value = 'recycle'
}

function closeModal() {
  isLoading.value = false
  isDialogOpen.value = false
}

function setError(msg: string) {
  isLoading.value = false
  errorMessage.value = msg
}

defineExpose({
  openModal,
  closeModal,
  setError
})
</script>

<style scoped></style>
