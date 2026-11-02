const assert = require('node:assert/strict')
const test = require('node:test')
const {earlyBookingPriceError, earlyBookingUntilError, withTourPrices} = require('./tourPricing.ts')

test('seeds each new hotel from current prices, including hidden prices and zero', () => {
  const prices = {price: 450, earlyBookingPrice: 420, discount: false}
  for (const _key of ['first', 'second']) {
    assert.deepEqual(withTourPrices({_type: 'object', _key}, prices), {
      _type: 'object', _key, price: 450, earlyBookingPrice: 420,
    })
  }
  assert.deepEqual(withTourPrices({_key: 'zero'}, {price: 0}), {_key: 'zero', price: 0})
  assert.deepEqual(withTourPrices({_key: 'empty'}, {}), {_key: 'empty'})
})

test('preserves duplicates, pasted content, cleared prices and existing empty hotels', () => {
  const prices = {price: 450, earlyBookingPrice: 420}
  const edited = {_key: 'edited', title: 'Hotel', price: 480, placementDescription: 'Суперіор'}
  assert.equal(withTourPrices(edited, prices), edited)
  const cleared = {_key: 'cleared', title: 'Hotel'}
  assert.equal(withTourPrices(cleared, prices), cleared)
  const emptyDuplicate = {_key: 'existing', _type: 'object'}
  assert.equal(withTourPrices(emptyDuplicate, prices, ['existing']), emptyDuplicate)
  const seeded = withTourPrices({_key: 'new'}, prices)
  assert.equal(withTourPrices(seeded, {price: 900, earlyBookingPrice: 800}), seeded)
  assert.equal(seeded.price, 450)
  assert.equal(Object.hasOwn(seeded, 'placementDescription'), false)
})

test('validates optional early prices only while early booking is enabled', () => {
  for (const value of [undefined, null, 0, 420]) {
    assert.equal(earlyBookingPriceError(value, 450, true), true)
  }
  for (const value of [-1, 450, 480, NaN, Infinity, '420']) {
    assert.equal(typeof earlyBookingPriceError(value, 450, true), 'string')
    assert.equal(earlyBookingPriceError(value, 450, false), true)
  }
  assert.equal(typeof earlyBookingPriceError(0, 0, true), 'string')
})

test('requires a common deadline for either tour or hotel prices, accepting zero', () => {
  const document = {discount: true}
  assert.equal(earlyBookingUntilError(undefined, document), true)
  for (const extra of [{earlyBookingPrice: 420}, {hotels: [{earlyBookingPrice: 0}]}]) {
    assert.equal(typeof earlyBookingUntilError(undefined, {...document, ...extra}), 'string')
    assert.equal(earlyBookingUntilError(undefined, {...extra, discount: false}), true)
  }
})

test('deadline includes departure day and revalidates against a moved departure', () => {
  const document = {discount: true, dateRange: {startDate: '2027-05-03'}}
  assert.equal(earlyBookingUntilError('2027-05-02', document), true)
  assert.equal(earlyBookingUntilError('2027-05-03', document), true)
  assert.equal(typeof earlyBookingUntilError('2027-05-04', document), 'string')
  assert.equal(typeof earlyBookingUntilError('2027-05-03', {
    ...document, dateRange: {startDate: '2027-05-02'},
  }), 'string')
  assert.equal(earlyBookingUntilError('2027-05-04', {...document, discount: false}), true)
  assert.equal(earlyBookingUntilError('2027-05-03', {discount: true}), true)
})
