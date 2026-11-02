const assert = require('node:assert/strict')
const test = require('node:test')
const {dirname, resolve} = require('node:path')
const process = require('node:process')
const {mkdtempSync, readFileSync, writeFileSync, rmSync} = require('node:fs')
const {tmpdir} = require('node:os')
const ts = require('typescript')
const React = require('react')
const {renderToStaticMarkup} = require('react-dom/server')
const {FormValueProvider} = require('sanity')
const {Schema} = require('@sanity/schema')
const {validateDocument} = require('@sanity/validation')
const {createClient} = require('@sanity/client')
const testDirectory = dirname(module.filename)

// Compile the real schema/components in memory, without browser assets or network calls.
function loadTs(path) {
  const extensions = ['.ts', '.tsx', '.css']
  const previous = extensions.map((extension) => require.extensions[extension])
  const compile = (compiled, filename) => compiled._compile(ts.transpileModule(
    readFileSync(filename, 'utf8'), {compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }},
  ).outputText, filename)
  require.extensions['.ts'] = compile
  require.extensions['.tsx'] = compile
  require.extensions['.css'] = (compiled) => { compiled.exports = {} }
  try {
    const filename = resolve(testDirectory, path)
    delete require.cache[filename]
    return require(filename)
  } finally {
    extensions.forEach((extension, index) => {
      if (previous[index]) require.extensions[extension] = previous[index]
      else delete require.extensions[extension]
    })
  }
}

const tour = loadTs('../schemaTypes/tour-to-date.ts').default
const field = (name) => tour.fields.find((entry) => entry.name === name)
const hotels = field('hotels')
const hotel = hotels.of[0]

test('schema places conditional early fields after the switch and preserves hidden data', () => {
  const names = tour.fields.map((entry) => entry.name)
  const discountIndex = names.indexOf('discount')
  assert.deepEqual(names.slice(discountIndex + 1, discountIndex + 3),
    ['earlyBookingPrice', 'earlyBookingUntil'])
  const document = {discount: false, earlyBookingPrice: 420, earlyBookingUntil: '2027-05-01'}
  for (const entry of [field('earlyBookingPrice'), field('earlyBookingUntil'),
    hotel.fields.find((entry) => entry.name === 'earlyBookingPrice')]) {
    assert.equal(entry.hidden({document}), true)
    assert.equal(entry.hidden({document: {...document, discount: true}}), false)
  }
  assert.equal(document.earlyBookingPrice, 420)
  assert.equal(document.earlyBookingUntil, '2027-05-01')
})

test('real array and item components seed every insertion path and preserve duplicates', () => {
  const {HotelPricesInput, HotelPricesItem} = loadTs('./HotelPricesInput.tsx')
  const document = {_id: 'tour', _type: 'tour-to-date', price: 450, earlyBookingPrice: 420,
    discount: false}
  function render(Component, props) {
    let received
    renderToStaticMarkup(React.createElement(FormValueProvider, {value: document},
      React.createElement(Component, {...props, renderDefault: (value) => {
        received = value
        return React.createElement('span')
      }})))
    return received
  }
  const calls = []
  const existing = {_key: 'existing', _type: 'object'}
  const array = render(HotelPricesInput, {
    value: [existing], onItemAppend: (item) => calls.push(item),
    onItemPrepend: (item) => calls.push(item), onInsert: (event) => calls.push(...event.items),
  })
  array.onItemAppend({_key: 'append', _type: 'object'})
  array.onItemPrepend({_key: 'prepend', _type: 'object'})
  array.onInsert({items: [{_key: 'insert', _type: 'object'}], position: 'after', referenceItem: -1})
  for (const item of calls) assert.equal(item.price, 450)
  for (const item of calls) assert.equal(item.earlyBookingPrice, 420)
  const row = render(HotelPricesItem, {value: existing, onInsert: (event) => calls.push(...event.items)})
  row.onInsert({items: [{_type: 'object'}], position: 'before'})
  assert.equal(calls.at(-1).price, 450)
  row.onInsert({items: [existing], position: 'after'})
  assert.equal(calls.at(-1), existing)
  document.price = 900
  assert.equal(calls[0].price, 450)
})

test('Sanity validation rechecks hotel prices and deadline when dependent fields change', async () => {
  const pricingFields = ['price', 'discount', 'earlyBookingPrice', 'earlyBookingUntil', 'dateRange']
  const schema = Schema.compile({name: 'pricing', types: [{...tour, fields: [
    ...tour.fields.filter((entry) => pricingFields.includes(entry.name)),
    {...hotels, of: [{...hotel, fields: hotel.fields.filter((entry) =>
      ['price', 'earlyBookingPrice', 'placementDescription'].includes(entry.name))}]},
  ]}]})
  const client = createClient({projectId: 'offline', dataset: 'test', apiVersion: '2025-04-26', useCdn: false})
  const base = {_id: 'tour', _type: 'tour-to-date', price: 450, discount: true,
    dateRange: {startDate: '2027-05-03', endDate: '2027-05-10'},
    earlyBookingUntil: '2027-05-03',
    hotels: [{_key: 'one', _type: 'object', price: 480, earlyBookingPrice: 420}]}
  const validate = (extra) => validateDocument({schema, client, document: {...base, ...extra}})
  assert.equal((await validate({})).status, 'passed')
  let result = await validate({earlyBookingUntil: undefined})
  assert.equal(result.status, 'failed')
  assert.ok(result.markers.some((marker) => marker.path.includes('earlyBookingUntil')))
  result = await validate({dateRange: {startDate: '2027-05-02', endDate: '2027-05-10'}})
  assert.equal(result.status, 'failed')
  result = await validate({hotels: [{...base.hotels[0], price: 400}]})
  assert.equal(result.status, 'failed')
  assert.ok(result.markers.some((marker) => marker.path.includes('earlyBookingPrice')))
  assert.equal((await validate({discount: false, earlyBookingPrice: 999,
    earlyBookingUntil: '2028-01-01', hotels: [{...base.hotels[0], earlyBookingPrice: -1}]})).status, 'passed')
  assert.equal((await validate({hotels: [{_key: 'zero', _type: 'object', price: 0}]})).status, 'passed')
})

test('real migration requires matching backup/revision and emits only keyed price patches', () => {
  const {readHotelPriceBackup, assertBackupDataset, assertBackedUpDocument} =
    loadTs('../scripts/hotel-price-backup.ts')
  const directory = mkdtempSync(resolve(tmpdir(), 'rich-tour-prices-'))
  const filename = resolve(directory, 'backup.json')
  const original = {_id: 'drafts.tour', _rev: 'rev-1', _type: 'tour-to-date', price: 450,
    hotels: [{_key: 'one', price: 200, earlyBookingPrice: 190, placementDescription: 'Стандарт'}]}
  const backup = {kind: 'hotel-prices-v1', projectId: 'offline', dataset: 'test', documents: [original]}
  const previousPath = process.env.HOTEL_PRICE_MIGRATION_BACKUP
  try {
    writeFileSync(filename, JSON.stringify(backup))
    assert.deepEqual(readHotelPriceBackup(filename), backup)
    assert.throws(() => readHotelPriceBackup(undefined))
    assert.throws(() => assertBackupDataset(backup, {projectId: 'other', dataset: 'test'}))
    assert.throws(() => assertBackedUpDocument(backup, {...original, _rev: 'rev-2'}))
    delete process.env.HOTEL_PRICE_MIGRATION_BACKUP
    let migration = loadTs('../migrations/copy-tour-price-to-hotels/index.ts').default
    const context = {client: {config: () => ({projectId: 'offline', dataset: 'test'})}}
    assert.throws(() => migration.migrate.document(original, context))
    process.env.HOTEL_PRICE_MIGRATION_BACKUP = filename
    migration = loadTs('../migrations/copy-tour-price-to-hotels/index.ts').default
    const patch = migration.migrate.document(original, context)
    assert.equal(patch.id, original._id)
    assert.deepEqual(patch.options, {ifRevision: 'rev-1'})
    assert.equal(patch.patches.length, 1)
    assert.deepEqual(patch.patches[0], {path: ['hotels', {_key: 'one'}, 'price'], op: {type: 'set', value: 450}})
    assert.equal(original.hotels[0].price, 200)
  } finally {
    if (previousPath === undefined) delete process.env.HOTEL_PRICE_MIGRATION_BACKUP
    else process.env.HOTEL_PRICE_MIGRATION_BACKUP = previousPath
    assert.ok(directory.startsWith(resolve(tmpdir(), 'rich-tour-prices-')))
    rmSync(directory, {recursive: true, force: true})
  }
})
