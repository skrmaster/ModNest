import { defineStore } from 'pinia'

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    show: false,
    text: '',
    color: 'success'
  }),

  actions: {
    success(text: string) {
      this.text = text
      this.color = 'success'
      this.show = true
    },

    error(text: string) {
      this.text = text
      this.color = 'error'
      this.show = true
    },

    warning(text: string) {
      this.text = text
      this.color = 'warning'
      this.show = true
    },

    info(text: string) {
      this.text = text
      this.color = 'info'
      this.show = true
    }
  }
})
