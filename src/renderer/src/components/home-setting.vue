<script setup lang="ts">
import { ref } from 'vue'

const modPath = ref('')
const isLoading = ref(false)
const message = ref('')

async function selectDirectory(): Promise<void> {
  try {
    const result = await window.electron.ipcRenderer.invoke('select-directory')
    if (result) {
      modPath.value = result
    }
  } catch (error) {
    console.error('Error selecting directory:', error)
    message.value = '选择目录失败'
  }
}

async function submitForm(): Promise<void> {
  if (!modPath.value.trim()) {
    message.value = '请输入或选择解压mod地址'
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    const result = await window.electron.ipcRenderer.invoke('create-mod-directory', {
      path: modPath.value.trim()
    })
    if (result.success) {
      message.value = `成功！目录位于: ${result.path}`
      modPath.value = ''
    } else {
      message.value = result.error || '操作失败'
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    message.value = '表单提交失败'
  } finally {
    isLoading.value = false
  }
}

function goBack(): void {
  try {
    if (window.history && window.history.length > 1) {
      window.history.back()
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div id="app-root">
    <v-container class="form-container">
      <v-card class="form-card" elevation="2">
        <v-toolbar density="compact" class="toolbar-header">
          <v-btn icon size="small" aria-label="返回" @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-toolbar-title class="title-center">Mod 解压配置</v-toolbar-title>
          <div style="width: 40px"></div>
        </v-toolbar>
        <v-card-text>
          <v-form @submit.prevent="submitForm">
            <v-text-field
              v-model="modPath"
              label="解压mod地址"
              placeholder="输入本地目录路径"
              prepend-icon="mdi-folder"
              outlined
              density="compact"
              class="mb-4"
            />

            <div class="button-group">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-folder-open"
                color="secondary"
                @click="selectDirectory"
              >
                选择目录
              </v-btn>
              <v-btn type="submit" prepend-icon="mdi-check" color="primary" :loading="isLoading">
                提交
              </v-btn>
            </div>

            <v-alert
              v-if="message"
              :type="message.includes('成功') ? 'success' : 'error'"
              class="mt-4"
              dismissible
            >
              {{ message }}
            </v-alert>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
#app-root {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.form-container {
  max-width: 500px;
  width: 100%;
}

.form-card {
  border-radius: 8px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.button-group .v-btn {
  flex: 1;
}

:deep(.v-card__title) {
  font-size: 24px;
  font-weight: 600;
}

.toolbar-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-center {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
</style>
