export interface PriceHotel {
  _key?: string
  price?: unknown
  [key: string]: unknown
}

export interface PriceDocument {
  _id: string
  _rev: string
  _type: string
  price?: unknown
  hotels?: PriceHotel[]
  [key: string]: unknown
}

export interface PriceChange {
  key: string
  value: unknown
  unset?: boolean
}

export interface PricePlan {
  hotelCount: number
  changes: PriceChange[]
  skipReason?: string
}

function validHotelKeys(hotels: PriceHotel[]) {
  const keys = hotels.map((hotel) => hotel?._key)
  return keys.every((key) => typeof key === 'string' && key.length > 0) &&
    new Set(keys).size === keys.length
}

export function hotelPricePlan(document: PriceDocument): PricePlan {
  const hotels = document.hotels
  if (document._type !== 'tour-to-date' || !Array.isArray(hotels) || !hotels.length) {
    return {hotelCount: 0, changes: []}
  }
  const plan: PricePlan = {hotelCount: hotels.length, changes: []}
  if (typeof document.price !== 'number' || !Number.isFinite(document.price) || document.price < 0) {
    return {...plan, skipReason: 'Базова ціна відсутня або некоректна'}
  }
  if (!validHotelKeys(hotels)) {
    return {...plan, skipReason: 'Відсутні або повторюються ключі готелів _key'}
  }
  plan.changes = hotels.filter((hotel) => hotel.price !== document.price).map((hotel) => ({
    key: hotel._key!, value: document.price,
  }))
  return plan
}

export function hotelPriceReport(documents: PriceDocument[]) {
  const report = {
    documents: 0, hotels: 0, documentsToChange: 0, replacements: 0,
    skipped: [] as {id: string; reason: string}[],
  }
  for (const document of documents) {
    const plan = hotelPricePlan(document)
    if (!plan.hotelCount) continue
    report.documents++
    report.hotels += plan.hotelCount
    if (plan.skipReason) report.skipped.push({id: document._id, reason: plan.skipReason})
    if (plan.changes.length) report.documentsToChange++
    report.replacements += plan.changes.length
  }
  return report
}

/** Restore only migration targets, without replacing documents or overwriting later price edits. */
export function restoreHotelPricePlan(original: PriceDocument, current?: PriceDocument): PricePlan {
  const migrated = hotelPricePlan(original)
  if (!migrated.changes.length) return {hotelCount: migrated.hotelCount, changes: []}
  const conflict = (reason: string): PricePlan => ({
    hotelCount: migrated.hotelCount, changes: [], skipReason: reason,
  })
  if (!current || !Array.isArray(current.hotels) || !validHotelKeys(current.hotels)) {
    return conflict('Документ або готелі відсутні чи мають некоректні ключі')
  }
  const changes: PriceChange[] = []
  for (const target of migrated.changes) {
    const before = original.hotels!.find((hotel) => hotel._key === target.key)!
    const now = current.hotels.find((hotel) => hotel._key === target.key)
    if (!now) return conflict(`Готель ${target.key} видалено`)
    const hadPrice = Object.hasOwn(before, 'price')
    if (hadPrice === Object.hasOwn(now, 'price') && before.price === now.price) continue
    if (now.price !== original.price) {
      return conflict(`Ціну готелю ${target.key} змінено після міграції`)
    }
    changes.push({key: target.key, value: before.price, unset: !hadPrice})
  }
  return {hotelCount: migrated.hotelCount, changes}
}
