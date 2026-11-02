import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {parseArgs} from 'node:util'
import {getCliClient} from 'sanity/cli'
import {hotelPriceReport, restoreHotelPricePlan, type PriceDocument} from './hotel-prices'
import {assertBackupDataset, readHotelPriceBackup, type HotelPriceBackup} from './hotel-price-backup'

async function main() {
  const {values, positionals} = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {file: {type: 'string'}, apply: {type: 'boolean', default: false}},
  })
  const mode = positionals[0]
  if (!['prepare', 'restore'].includes(mode) || positionals.length !== 1 || !values.file ||
    (mode === 'prepare' && values.apply)) {
    throw new Error('Використання: sanity exec scripts/hotel-price-migration.ts --with-user-token -- prepare|restore --file <backup.json> [--apply лише для restore]')
  }
  const client = getCliClient({apiVersion: '2025-04-26'}).withConfig({useCdn: false, perspective: 'raw'})
  const config = client.config()
  if (!config.token) throw new Error('Потрібна авторизація: використайте --with-user-token')
  const filename = resolve(values.file)

  if (mode === 'prepare') {
    const documents: PriceDocument[] = []
    let after = ''
    while (true) {
      const page = await client.fetch<PriceDocument[]>(
        '*[_type == "tour-to-date" && count(hotels) > 0 && _id > $after] | order(_id asc)[0...200]',
        {after},
      )
      documents.push(...page)
      if (page.length < 200) break
      after = page[page.length - 1]._id
    }
    const backup: HotelPriceBackup = {
      kind: 'hotel-prices-v1', createdAt: new Date().toISOString(),
      projectId: config.projectId!, dataset: config.dataset!, documents,
    }
    const report = hotelPriceReport(documents)
    mkdirSync(dirname(filename), {recursive: true})
    // Never replace the only copy of the original prices.
    writeFileSync(filename, JSON.stringify({...backup, report}, null, 2) + '\n', {flag: 'wx'})
    console.log(JSON.stringify({backup: filename, projectId: backup.projectId, dataset: backup.dataset, ...report}, null, 2))
    return
  }

  const backup = readHotelPriceBackup(filename)
  assertBackupDataset(backup, config)
  const targets = backup.documents.filter((doc) => hotelPriceReport([doc]).replacements > 0)
  const pending = []
  const skipped: {id: string; reason: string}[] = []
  for (const original of targets) {
    const current = await client.getDocument<PriceDocument>(original._id)
    const plan = restoreHotelPricePlan(original, current)
    if (plan.skipReason) skipped.push({id: original._id, reason: plan.skipReason})
    else if (plan.changes.length) pending.push({current: current!, changes: plan.changes})
  }
  console.log(JSON.stringify({mode: values.apply ? 'restore' : 'restore-dry-run',
    documentsToRestore: pending.length,
    pricesToRestore: pending.reduce((sum, entry) => sum + entry.changes.length, 0), skipped,
  }, null, 2))
  if (!values.apply) return
  if (skipped.length) throw new Error('Відновлення не виконано: спочатку усуньте конфлікти зі звіту')
  for (const {current, changes} of pending) {
    let patch = client.patch(current._id).ifRevisionId(current._rev)
    for (const change of changes) {
      const path = `hotels[_key==${JSON.stringify(change.key)}].price`
      patch = change.unset ? patch.unset([path]) : patch.set({[path]: change.value})
    }
    await patch.commit()
    console.log(`Відновлено: ${current._id}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Помилка міграції цін')
  process.exitCode = 1
})
