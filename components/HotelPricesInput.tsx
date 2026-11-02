import {useFormValue, type ArrayOfObjectsInputProps, type ObjectItemProps} from 'sanity'
import {withTourPrices, type TourPrices} from './tourPricing'

function useTourPrices(): TourPrices {
  const price = useFormValue(['price']) as number | undefined
  const earlyBookingPrice = useFormValue(['earlyBookingPrice']) as number | undefined
  return {price, earlyBookingPrice}
}

export function HotelPricesInput(props: ArrayOfObjectsInputProps) {
  const prices = useTourPrices()
  const keys = props.value?.map((item) => item._key) ?? []
  const seed = (item: {_key: string}) => withTourPrices(item, prices, keys)
  const inputProps: ArrayOfObjectsInputProps = {
    ...props,
    onItemAppend: (item) => props.onItemAppend(seed(item)),
    onItemPrepend: (item) => props.onItemPrepend(seed(item)),
    onInsert: (event) => props.onInsert({...event, items: event.items.map(seed)}),
  }
  return props.renderDefault(inputProps)
}

/** The item menu has its own insertion callback, separate from the array's Add button. */
export function HotelPricesItem(props: ObjectItemProps) {
  const prices = useTourPrices()
  const itemProps: ObjectItemProps = {
    ...props,
    onInsert: (event) => props.onInsert({
      ...event,
      items: event.items.map((item) => withTourPrices(item, prices, [props.value._key])),
    }),
  }
  return props.renderDefault(itemProps)
}
