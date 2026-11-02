export interface TourPrices {
  price?: number
  earlyBookingPrice?: number
  discount?: boolean
  earlyBookingUntil?: string
  dateRange?: {startDate?: string}
  hotels?: TourPrices[]
}

export function earlyBookingPriceError(
  value: unknown,
  regularPrice: unknown,
  discount: unknown,
) {
  if (!discount || value === undefined || value === null) return true
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'Ціна раннього бронювання має бути невід’ємним числом'
  }
  if (typeof regularPrice === 'number' && value >= regularPrice) {
    return 'Ціна раннього бронювання має бути меншою за звичайну ціну'
  }
  return true
}

export function earlyBookingUntilError(value: unknown, document?: TourPrices) {
  if (!document?.discount) return true
  const hasEarlyPrice =
    document.earlyBookingPrice != null ||
    document.hotels?.some((hotel) => hotel?.earlyBookingPrice != null)
  if (!value) {
    return hasEarlyPrice ? 'Укажіть дату завершення раннього бронювання' : true
  }
  const startDate = document.dateRange?.startDate
  return typeof value === 'string' && startDate && value > startDate
    ? 'Дата завершення раннього бронювання не може бути пізніше дати початку туру'
    : true
}

/** Only seed a new empty item. Copies, pasted items and existing hotels retain their values. */
export function withTourPrices<T extends Record<string, unknown>>(
  item: T,
  prices: TourPrices,
  existingKeys: readonly string[] = [],
): T {
  if (
    existingKeys.includes(item._key as string) ||
    Object.keys(item).some((key) => !['_type', '_key', '_resolvingInitialValue'].includes(key))
  ) return item

  return {
    ...item,
    ...(typeof prices.price === 'number' ? {price: prices.price} : {}),
    ...(typeof prices.earlyBookingPrice === 'number'
      ? {earlyBookingPrice: prices.earlyBookingPrice}
      : {}),
  }
}
