import { useSnackbarStore } from '@renderer/stores/snackbar'

export function useNotify() {
  const snackbar = useSnackbarStore()

  return {
    success: snackbar.success,
    error: snackbar.error,
    warning: snackbar.warning,
    info: snackbar.info
  }
}
