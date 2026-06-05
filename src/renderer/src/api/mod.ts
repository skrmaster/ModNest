import { ModDto } from '@shared/dto/mod'
import { ListQuery, ModOpt } from '@shared/types/mod'
import { toRaw } from 'vue'

export async function apiModList(data: ListQuery): Promise<ModDto[]> {
  return await window.api.modApi.list(toRaw(data))
}

export async function apiModEnable(data: ModOpt): Promise<boolean> {
  return await window.api.modApi.enable(toRaw(data))
}

export async function apiModDisable(data: ModOpt): Promise<boolean> {
  return await window.api.modApi.disable(toRaw(data))
}
