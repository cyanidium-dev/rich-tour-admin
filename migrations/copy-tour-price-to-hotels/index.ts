import {at, defineMigration, patch, set} from 'sanity/migrate'
import {hotelPricePlan, type PriceDocument} from '../../scripts/hotel-prices'
import {
  assertBackedUpDocument, assertBackupDataset, readHotelPriceBackup,
  type HotelPriceBackup,
} from '../../scripts/hotel-price-backup'

let backup: HotelPriceBackup | undefined

export default defineMigration({
  title: 'Копіювання базової ціни виїзду до всіх його готелів (одноразово)',
  documentTypes: ['tour-to-date'],
  filter: 'count(hotels) > 0',
  migrate: {
    document(document, context) {
      const doc = document as PriceDocument
      const plan = hotelPricePlan(doc)
      if (plan.skipReason) {
        console.warn(`${doc._id}: ${plan.skipReason}`)
        return
      }
      if (!plan.changes.length) return
      backup ??= readHotelPriceBackup(process.env.HOTEL_PRICE_MIGRATION_BACKUP)
      assertBackupDataset(backup, context.client.config())
      assertBackedUpDocument(backup, doc)
      return patch(doc._id, plan.changes.map((change) =>
        at(['hotels', {_key: change.key}, 'price'], set(change.value)),
      ), {ifRevision: doc._rev})
    },
  },
})
