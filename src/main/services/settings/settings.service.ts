import { BaseStoreService } from '../core/base-store.service'
import type { SettingsStore } from '../settings/settings.type'

export class SettingsService extends BaseStoreService<SettingsStore> {
  private static instance: SettingsService

  private constructor() {
    super('settings', {
      theme: 'light',

      accentColor: '#409eff',

      language: 'zh-CN',

      modRootPath: '',

      windowBounds: {
        width: 1400,
        height: 900
      }
    })
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }

    return SettingsService.instance
  }
}
