<template>
  <v-dialog v-model="isDialogOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5 font-medium"> 卸载 {{ modName }} </v-card-title>

      <v-card-text class="py-4">
        <v-radio-group v-model="uninstallType" class="pt-1">
          <v-radio label="移入回收站（可恢复）" value="recycle" color="primary"></v-radio>
          <v-radio label="彻底删除（不可恢复）" value="delete" color="error"></v-radio>
        </v-radio-group>

        <div class="mt-3 text-caption text-gray-500">
          提示：移入回收站后可在系统回收站找回，彻底删除后文件将永久消失。
        </div>
      </v-card-text>

      <v-card-actions class="justify-end px-4 pb-4">
        <v-btn variant="outlined" color="secondary" @click="handleCancel"> 取消 </v-btn>
        <v-btn variant="tonal" color="error" class="ml-2" @click="handleConfirm"> 确认卸载 </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  modName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [uninstallType: 'recycle' | 'delete']
}>()

const isDialogOpen = ref(props.modelValue)

const uninstallType = ref<'recycle' | 'delete'>('recycle')

watch(
  () => props.modelValue,
  (newVal) => {
    isDialogOpen.value = newVal
    if (newVal) uninstallType.value = 'recycle'
  },
  { immediate: true }
)

watch(isDialogOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

const handleCancel = () => {
  isDialogOpen.value = false
}

const handleConfirm = () => {
  emit('confirm', uninstallType.value)
  isDialogOpen.value = false
}

defineExpose({
  open: () => (isDialogOpen.value = true),
  close: handleCancel
})
</script>

<style scoped>
.v-card-text {
  line-height: 1.6;
}
</style>
