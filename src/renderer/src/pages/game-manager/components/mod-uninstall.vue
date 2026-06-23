<template>
  <v-dialog
    v-model="isDialogOpen"
    max-width="500px"
    persistent
    @click:outside="!isLoading && handleCancel"
  >
    <v-card>
      <v-card-title class="text-h5 font-medium d-flex align-center justify-between">
        {{ t('gameManager.uninstall.title') }}MOD
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          :disabled="isLoading"
          @click="handleCancel"
        ></v-btn>
      </v-card-title>

      <v-card-text class="py-4">
        <v-alert class="mb-4" color="info">
          请注意,这些MOD:<br />
          {{ modName }}<br />将会被卸载
        </v-alert>
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
          <div
            class="mb-3 pa-3 border border-blue-200 rounded cursor-pointer"
            :class="{ 'bg-blue-200!': uninstallType === 'recycle' }"
            @click="uninstallType = 'recycle'"
          >
            <v-radio
              :label="t('gameManager.uninstall.recycle')"
              value="recycle"
              color="primary"
              :disabled="isLoading"
            />
            <div class="text-caption text-gray-500 ml-10">
              {{ t('gameManager.uninstall.recycleDesc') }}
            </div>
          </div>

          <div
            class="mb-2 pa-3 border border-red-200 rounded cursor-pointer"
            :class="{ 'bg-red-200!': uninstallType === 'delete' }"
            @click="uninstallType = 'delete'"
          >
            <v-radio
              :label="t('gameManager.uninstall.delete')"
              value="delete"
              color="error"
              :disabled="isLoading"
            />
            <div class="text-caption text-error font-medium ml-10">
              {{ t('gameManager.uninstall.deleteWarning') }}
            </div>
          </div>
        </v-radio-group>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <v-btn color="secondary" :disabled="isLoading" @click="handleCancel">{{
          t('common.cancel')
        }}</v-btn>
        <v-btn
          variant="tonal"
          :color="'primary'"
          class="px-4"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleConfirm"
        >
          {{
            isLoading ? t('gameManager.uninstall.uninstalling') : t('gameManager.uninstall.confirm')
          }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ModInfo } from '@shared/types/mod'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const emit = defineEmits<{
  delete: []
  recycle: []
  cannel: []
}>()

const isDialogOpen = ref(false)
const uninstallType = ref<'recycle' | 'delete'>('recycle')
const isLoading = ref(false)
const errorMessage = ref('')

const handleCancel = () => {
  if (!isLoading.value) {
    isDialogOpen.value = false
    emit('cannel')
  }
}

const handleConfirm = () => {
  isLoading.value = true
  if (uninstallType.value === 'delete') {
    emit('delete')
  } else {
    emit('recycle')
  }
  isLoading.value = false
  isDialogOpen.value = false
}

const modName = ref('')
function openModal(data: ModInfo[]) {
  isDialogOpen.value = true
  uninstallType.value = 'recycle'
  modName.value = data.map((e) => e.name).join(',')
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
