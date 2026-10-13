const assert = require('node:assert/strict')
const test = require('node:test')
const {
  assetDimensions,
  cropControls,
  cropPixelDensity,
  cropResolution,
  makeCrop,
  safeMaxZoom,
} = require('./tourImageCrops.ts')

test('creates independent frames with the requested aspect ratios', () => {
  const ref = 'image-example-2400x1200-jpg'
  const wide = makeCrop(ref, {id: 'wide', title: 'Wide', width: 360, height: 178})
  const portrait = makeCrop(ref, {id: 'portrait', title: 'Portrait', width: 360, height: 399})
  assert.ok(wide)
  assert.ok(portrait)
  const dimensions = assetDimensions(ref)
  const aspect = (crop) =>
    (dimensions.width * (1 - crop.left - crop.right)) /
    (dimensions.height * (1 - crop.top - crop.bottom))
  assert.ok(Math.abs(aspect(wide) - 360 / 178) < 0.001)
  assert.ok(Math.abs(aspect(portrait) - 360 / 399) < 0.001)
  assert.notDeepEqual(wide, portrait)
})

test('retains focus and zoom when reopening a saved frame', () => {
  const ref = 'image-example-2400x1200-jpg'
  const preset = {id: 'portrait', title: 'Portrait', width: 360, height: 399}
  const crop = makeCrop(ref, preset, 0.7, 0.45, 1.5)
  const controls = cropControls(ref, crop, preset)
  assert.ok(Math.abs(controls.focusX - 0.7) < 0.001)
  assert.ok(Math.abs(controls.focusY - 0.45) < 0.001)
  assert.ok(Math.abs(controls.zoom - 1.5) < 0.001)
})

test('limits zoom separately for wide and tall frames at two source pixels per frame pixel', () => {
  const ref = 'image-example-2400x1200-jpg'
  const wide = {id: 'wide', title: 'Wide', width: 600, height: 300}
  const tall = {id: 'tall', title: 'Tall', width: 300, height: 600}
  assert.equal(safeMaxZoom(ref, wide), 2)
  assert.equal(safeMaxZoom(ref, tall), 1)
  assert.ok(cropPixelDensity(ref, makeCrop(ref, wide, 0.5, 0.5, 2), wide) >= 2 - 0.00001)
  assert.ok(cropPixelDensity(ref, makeCrop(ref, wide, 0.5, 0.5, 2.1), wide) < 2)
  assert.ok(cropPixelDensity(ref, makeCrop(ref, tall), tall) >= 2 - 0.00001)
})

test('moving the focus changes position without losing pixels', () => {
  const ref = 'image-example-2400x1200-jpg'
  const preset = {id: 'wide', title: 'Wide', width: 600, height: 300}
  const centered = cropResolution(ref, makeCrop(ref, preset))
  const shifted = cropResolution(ref, makeCrop(ref, preset, 0.9, 0.2))
  assert.ok(Math.abs(centered.width - shifted.width) < 0.01)
  assert.ok(Math.abs(centered.height - shifted.height) < 0.01)
})

test('small originals stay at 1x and can still be assessed without changing saved crops', () => {
  const ref = 'image-example-600x300-jpg'
  const preset = {id: 'wide', title: 'Wide', width: 600, height: 300}
  const saved = makeCrop(ref, preset, 0.6, 0.5, 3)
  const snapshot = {...saved}
  assert.equal(safeMaxZoom(ref, preset), 1)
  assert.equal(cropPixelDensity(ref, makeCrop(ref, preset), preset), 1)
  assert.ok(cropPixelDensity(ref, saved, preset) < 1)
  assert.deepEqual(saved, snapshot)
  assert.deepEqual(cropResolution(ref, undefined), null)
})

test('flags the saved tall crop of the Wednesday tour without altering it', () => {
  const ref = 'image-a65dd97d848785215b9b2de4255835bbbad07783-477x300-jpg'
  const preset = {id: 'costTall', title: 'Cost', width: 360, height: 702}
  const saved = {bottom: 0.090909, left: 0.293396, right: 0.413396, top: 0}
  const original = {...saved}
  const resolution = cropResolution(ref, saved)
  assert.ok(resolution.width > 139 && resolution.width < 141)
  assert.ok(resolution.height > 272 && resolution.height < 274)
  assert.ok(cropPixelDensity(ref, saved, preset) < 0.4)
  assert.equal(safeMaxZoom(ref, preset), 1)
  assert.deepEqual(saved, original)
})
