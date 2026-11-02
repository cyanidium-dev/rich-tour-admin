const assert = require('node:assert/strict')
const test = require('node:test')
const {hotelPricePlan, hotelPriceReport, restoreHotelPricePlan} = require('./hotel-prices.ts')

function doc(extra = {}) {
  return {_id: 'tour', _rev: 'before', _type: 'tour-to-date', price: 450,
    hotels: [{_key: 'standard', price: 200}, {_key: 'superior', price: 480}], ...extra}
}

test('migrates all hotels by key and keeps draft and published prices independent', () => {
  assert.deepEqual(hotelPricePlan(doc()).changes, [
    {key: 'standard', value: 450}, {key: 'superior', value: 450},
  ])
  const published = doc({hotels: [{_key: 'one', price: 200}]})
  const draft = doc({_id: 'drafts.tour', price: 500})
  assert.equal(hotelPricePlan(published).changes[0].value, 450)
  assert.equal(hotelPricePlan(draft).changes[0].value, 500)
  assert.deepEqual(hotelPriceReport([published, draft]), {
    documents: 2, hotels: 3, documentsToChange: 2, replacements: 3, skipped: [],
  })
})

test('accepts zero and missing hotel prices, avoids matching values and skips invalid bases', () => {
  assert.deepEqual(hotelPricePlan(doc({price: 0, hotels: [{_key: 'one'}]})).changes,
    [{key: 'one', value: 0}])
  assert.deepEqual(hotelPricePlan(doc({hotels: [{_key: 'one', price: 450}]})).changes, [])
  for (const price of [undefined, null, '450', -1, NaN, Infinity]) {
    const plan = hotelPricePlan(doc({price}))
    assert.equal(plan.changes.length, 0)
    assert.equal(typeof plan.skipReason, 'string')
  }
  for (const hotels of [undefined, [], null]) {
    assert.deepEqual(hotelPricePlan(doc({hotels})), {hotelCount: 0, changes: []})
  }
  for (const hotels of [[{}], [null], [{_key: 'same'}, {_key: 'same'}]]) {
    assert.equal(typeof hotelPricePlan(doc({hotels})).skipReason, 'string')
  }
})

test('restores only targeted prices including absent/null values despite reordering', () => {
  const original = doc({hotels: [
    {_key: 'absent', earlyBookingPrice: 100}, {_key: 'null', price: null},
    {_key: 'same', price: 450}, {_key: 'old', price: 200},
  ]})
  const snapshot = JSON.parse(JSON.stringify(original))
  const current = doc({hotels: [
    {_key: 'old', price: 450}, {_key: 'same', price: 900},
    {_key: 'null', price: 450}, {_key: 'absent', price: 450, earlyBookingPrice: 120},
  ]})
  assert.deepEqual(restoreHotelPricePlan(original, current).changes, [
    {key: 'absent', value: undefined, unset: true},
    {key: 'null', value: null, unset: false},
    {key: 'old', value: 200, unset: false},
  ])
  assert.deepEqual(original, snapshot)
  assert.equal(restoreHotelPricePlan(original, original).changes.length, 0)
})

test('restoration rejects missing documents/hotels and preserves later manual price edits', () => {
  const original = doc()
  for (const current of [undefined, doc({hotels: []}),
    doc({hotels: [{_key: 'standard', price: 999}, {_key: 'superior', price: 450}]})]) {
    const plan = restoreHotelPricePlan(original, current)
    assert.equal(plan.changes.length, 0)
    assert.equal(typeof plan.skipReason, 'string')
  }
})
