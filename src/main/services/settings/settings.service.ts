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

      gameConfigs: [
        {
          id: 'genshin-impact',
          nameZh: '原神',
          nameEn: 'Genshin Impact',
          modPath: '',
          image: '',
          imageUrl: '',
          isDefault: true
        },
        {
          id: 'zenless-zone-zero',
          nameZh: '绝区零',
          nameEn: 'Zenless Zone Zero',
          modPath: '',
          image: '',
          imageUrl: '',
          isDefault: true
        }
      ],

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
