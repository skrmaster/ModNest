<template>
  <v-dialog v-model="itemDialog" max-width="660">
    <v-card>
      <v-card-title> {{ itemForm.id ? '编辑' : '添加' }} </v-card-title>
      <form-content ref="contentRef" @close="closeDialog" @update="emits('update')"></form-content>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { CreateItemDto, ItemDto } from '@shared/dto/item'
import { reactive, ref, useTemplateRef, nextTick } from 'vue'
import FormContent from './form-content.vue'

const itemDialog = ref(false)

const contentRef = useTemplateRef('contentRef')

const itemForm = reactive<CreateItemDto | ItemDto>({
  name: '',
  name_zh_cn: '',
  cover: null,
  mod_count: 0,
  game_id: '',
  is_custom: 0,
  mod_count_enable: 0,
  category_ids: []
})

const emits = defineEmits<{
  update: []
}>()

const closeDialog = () => {
  itemDialog.value = false
}

async function openModal(itemData?: ItemDto, gameId?: string) {
  if (itemData) {
    Object.assign(itemForm, itemData)
  }
  itemDialog.value = true
  await nextTick()
  contentRef.value?.init(itemData, gameId)
}

defineExpose({
  openModal
})
</script>

<style scoped></style>
