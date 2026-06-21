<template>
  <v-overlay v-model="visible" persistent class="align-center justify-center">
    <v-card width="380" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-subtitle-2">{{ t('taskStep.title') }}</span>
        <span class="text-caption text-medium-emphasis">
          {{ doneCount }} / {{ store.steps.length }}
        </span>
      </div>

      <v-progress-linear
        :model-value="store.progress"
        :color="progressColor"
        :indeterminate="store.isRunning && store.progress === 0"
        rounded
        height="4"
        class="mb-5"
      />

      <v-timeline density="compact" align="start" class="mb-4" truncate-line="both">
        <v-timeline-item
          v-for="step in store.steps"
          :key="step.id"
          :dot-color="dotColor(step.status)"
          size="x-small"
        >
          <div class="d-flex align-center gap-2 flex-wrap">
            <v-progress-circular
              v-if="step.status === 'running'"
              indeterminate
              size="12"
              width="2"
              color="primary"
            />
            <v-icon v-else :color="dotColor(step.status)" size="12">
              {{ stepIcon(step.status) }}
            </v-icon>

            <span class="text-body-2">{{ stepName(step.id) }}</span>

            <v-chip v-if="step.attempt > 1" size="x-small" color="warning" variant="tonal">
              {{ t('taskStep.retry', { n: step.attempt }) }}
            </v-chip>

            <span
              v-if="step.startedAt && step.finishedAt"
              class="text-caption text-medium-emphasis"
            >
              {{ step.finishedAt - step.startedAt }}ms
            </span>
          </div>

          <v-expand-transition>
            <div v-if="step.error" class="mt-1">
              <v-alert type="error" density="compact" variant="tonal" class="text-caption">
                {{ stepError(step.error) }}
              </v-alert>
            </div>
          </v-expand-transition>
        </v-timeline-item>
      </v-timeline>

      <div class="text-center text-body-2 mb-4" :class="statusTextColor">
        {{ statusMessage }}
      </div>

      <div class="d-flex justify-center gap-2">
        <v-btn
          v-if="store.isRunning"
          color="error"
          variant="outlined"
          size="small"
          prepend-icon="mdi-stop-circle-outline"
          @click="handleCancel"
        >
          {{ t('taskStep.cancel') }}
        </v-btn>

        <v-btn
          v-if="store.isTerminated"
          size="small"
          variant="outlined"
          prepend-icon="mdi-close"
          @click="handleClose"
        >
          {{ t('taskStep.close') }}
        </v-btn>
      </div>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskEngine } from '@renderer/composables/useTaskEngine'
import type { StepStatus } from '@shared/types/task-engine'

const { t } = useI18n()
const { store, start, cancel } = useTaskEngine('genshin:startGame')

const visible = ref(false)

const doneCount = computed(
  () => store.steps.filter((s) => s.status === 'success' || s.status === 'skipped').length
)

const stepName = (id: string) => t(`taskStep.steps.${id}`)
const stepError = (error: string) =>
  t(`taskStep.errors.${error}`) ? t(`taskStep.errors.${error}`) : error

const progressColor = computed(
  () =>
    ({
      idle: 'primary',
      running: 'primary',
      success: 'success',
      cancelled: 'warning',
      error: 'error'
    })[store.status]
)

const statusMessage = computed(
  () =>
    ({
      idle: '',
      running: t('taskStep.status.running'),
      success: t('taskStep.status.success'),
      cancelled: t('taskStep.status.cancelled'),
      error: store.globalError ?? t('taskStep.status.error')
    })[store.status]
)

const statusTextColor = computed(
  () =>
    ({
      idle: '',
      running: 'text-primary',
      success: 'text-success',
      cancelled: 'text-warning',
      error: 'text-error'
    })[store.status]
)

const dotColor = (s: StepStatus) =>
  ({ pending: 'grey', running: 'primary', success: 'success', error: 'error', skipped: 'grey' })[s]

const stepIcon = (s: StepStatus) =>
  ({
    pending: 'mdi-clock-outline',
    running: '',
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    skipped: 'mdi-minus-circle-outline'
  })[s]

async function openModal() {
  store.reset()
  visible.value = true
  await start()
}

async function handleCancel() {
  await cancel()
}

function handleClose() {
  store.reset()
  visible.value = false
}

onUnmounted(() => {
  cancel()
})

defineExpose({ openModal })
</script>
