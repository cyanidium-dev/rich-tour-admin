import {readFileSync} from 'node:fs'
import type {PriceDocument} from './hotel-prices'

export interface HotelPriceBackup {
  kind: 'hotel-prices-v1'
  createdAt: string
  projectId: string
  dataset: string
  documents: PriceDocument[]
}

export function readHotelPriceBackup(filename: string | undefined): HotelPriceBackup {
  if (!filename) throw new Error('Укажіть шлях до резервної копії HOTEL_PRICE_MIGRATION_BACKUP')
  const backup = JSON.parse(readFileSync(filename, 'utf8')) as HotelPriceBackup
  if (backup.kind !== 'hotel-prices-v1' || !backup.projectId || !backup.dataset ||
    !Array.isArray(backup.documents) || backup.documents.some((doc) => !doc._id || !doc._rev)) {
    throw new Error('Некоректна резервна копія цін готелів')
  }
  return backup
}

export function assertBackupDataset(
  backup: HotelPriceBackup,
  config: {projectId?: string; dataset?: string},
) {
  if (backup.projectId !== config.projectId || backup.dataset !== config.dataset) {
    throw new Error('Проєкт або dataset не відповідає резервній копії')
  }
}

export function assertBackedUpDocument(backup: HotelPriceBackup, document: PriceDocument) {
  const original = backup.documents.find((doc) => doc._id === document._id)
  if (!original || original._rev !== document._rev) {
    throw new Error(`Документ ${document._id} змінився або відсутній у копії. Підготуйте нову копію та звіт.`)
  }
}
