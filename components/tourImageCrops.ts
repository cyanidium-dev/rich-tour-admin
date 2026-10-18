export type CropPreset = {id: string; title: string; width: number; height: number}
export type CropRect = {left: number; top: number; right: number; bottom: number}

export const categoryPresets: CropPreset[] = [
  {id: 'wide', title: 'Головна: широка 360×178', width: 360, height: 178},
  {id: 'medium', title: 'Головна: 360×201', width: 360, height: 201},
  {id: 'portrait', title: 'Головна: висока 360×399', width: 360, height: 399},
  {id: 'banner', title: 'Головна: банер 360×165', width: 360, height: 165},
  {id: 'mobile', title: 'Телефон: 325×178', width: 325, height: 178},
]

export const basicPresets: CropPreset[] = [
  {id: 'cardMobile', title: 'Картка: телефон 210×129', width: 210, height: 129},
  {id: 'cardDesktop', title: 'Картка: комп’ютер 265×170', width: 265, height: 170},
  {id: 'heroMobile', title: 'Сторінка туру: телефон 342×184', width: 342, height: 184},
  {id: 'heroDesktop', title: 'Сторінка туру: комп’ютер 645×300', width: 645, height: 300},
]

export const heroMainPresets: CropPreset[] = [
  {id: 'heroDesktop', title: 'Верхнє головне: комп’ютер 645×300', width: 645, height: 300},
  {id: 'heroMobile', title: 'Верхнє головне: телефон 342×184', width: 342, height: 184},
]
export const heroLeftPresets: CropPreset[] = [
  {id: 'heroLeft', title: 'Верхнє ліве: комп’ютер 454×244', width: 454, height: 244},
  {id: 'mobile', title: 'Верхнє ліве: телефон 342×184', width: 342, height: 184},
]
export const heroRightPresets: CropPreset[] = [
  {id: 'heroRight', title: 'Верхнє праве: комп’ютер 645×244', width: 645, height: 244},
  {id: 'mobile', title: 'Верхнє праве: телефон 342×184', width: 342, height: 184},
]
export const benefitsPresets: CropPreset[] = [
  {id: 'benefits', title: 'Переваги: комп’ютер 600×350', width: 600, height: 350},
  {id: 'benefitsMobile', title: 'Переваги: телефон 342×234', width: 342, height: 234},
]
export const costShortPresets: CropPreset[] = [
  {id: 'costShort', title: 'Вартість: ліве 360×544', width: 360, height: 544},
]
export const costTallPresets: CropPreset[] = [
  {id: 'costTall', title: 'Вартість: праве 360×702', width: 360, height: 702},
]

export const hotelPresets: CropPreset[] = [
  {id: 'feature', title: 'Готель: велике фото 645×307', width: 645, height: 307},
  {id: 'thumb', title: 'Готель: мініатюра 265×128', width: 265, height: 128},
  {id: 'card', title: 'Готель: картка 265×150', width: 265, height: 150},
  {id: 'modal', title: 'Готель: вікно 500×350', width: 500, height: 350},
]

export const inspirationPresets: CropPreset[] = [
  {id: 'desktopTall', title: 'Натхнення: високе фото 160×430', width: 160, height: 430},
  {id: 'desktopShort', title: 'Натхнення: коротке фото 160×220', width: 160, height: 220},
  {id: 'mobileTall', title: 'Натхнення: телефон 170×422', width: 170, height: 422},
  {id: 'mobileShort', title: 'Натхнення: телефон 170×187', width: 170, height: 187},
]

export function assetDimensions(ref?: string) {
  const match = ref?.match(/^image-[^-]+-(\d+)x(\d+)-([a-z0-9]+)$/i)
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? {width, height, extension: match[3]} : null
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const round = (value: number) => Math.round(value * 1e6) / 1e6

function baseCropSize(ref: string | undefined, preset: CropPreset) {
  const dimensions = assetDimensions(ref)
  if (!dimensions || preset.width <= 0 || preset.height <= 0) return null
  const sourceAspect = dimensions.width / dimensions.height
  const targetAspect = preset.width / preset.height
  return {
    width: sourceAspect > targetAspect ? targetAspect / sourceAspect : 1,
    height: sourceAspect > targetAspect ? 1 : sourceAspect / targetAspect,
  }
}

/** Available source pixels inside a crop, before any CDN or browser scaling. */
export function cropResolution(ref: string | undefined, crop: CropRect | undefined) {
  const dimensions = assetDimensions(ref)
  if (!dimensions || !crop) return null
  if ([crop.left, crop.top, crop.right, crop.bottom].some(
    (side) => !Number.isFinite(side) || side < 0 || side >= 1,
  )) return null
  const width = dimensions.width * (1 - crop.left - crop.right)
  const height = dimensions.height * (1 - crop.top - crop.bottom)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }
  return {width, height}
}

/** Source pixels per CSS pixel of the preset frame; 2 is the recommended minimum. */
export function cropPixelDensity(ref: string | undefined, crop: CropRect | undefined, preset: CropPreset) {
  const resolution = cropResolution(ref, crop)
  if (!resolution || preset.width <= 0 || preset.height <= 0) return null
  return Math.min(resolution.width / preset.width, resolution.height / preset.height)
}

/** Largest zoom that keeps at least 2 source pixels per preset pixel. */
export function safeMaxZoom(ref: string | undefined, preset: CropPreset) {
  const dimensions = assetDimensions(ref)
  const base = baseCropSize(ref, preset)
  if (!dimensions || !base) return null
  const limit = Math.min(
    (dimensions.width * base.width) / (preset.width * 2),
    (dimensions.height * base.height) / (preset.height * 2),
    4,
  )
  // Keep the slider's two-decimal steps safely under the pixel threshold.
  return clamp(Math.floor(limit * 100 + 1e-9) / 100, 1, 4)
}

export function makeCrop(
  ref: string | undefined,
  preset: CropPreset,
  focusX = 0.5,
  focusY = 0.5,
  zoom = 1,
): CropRect | null {
  const base = baseCropSize(ref, preset)
  if (!base) return null
  const scale = clamp(zoom, 1, 4)
  const width = base.width / scale
  const height = base.height / scale
  const left = clamp(focusX - width / 2, 0, 1 - width)
  const top = clamp(focusY - height / 2, 0, 1 - height)
  return {
    left: round(left),
    top: round(top),
    right: round(1 - left - width),
    bottom: round(1 - top - height),
  }
}

export function cropControls(
  ref: string | undefined,
  crop: CropRect | undefined,
  preset: CropPreset,
) {
  const base = baseCropSize(ref, preset)
  if (!base || !crop) return {focusX: 0.5, focusY: 0.5, zoom: 1}
  const width = 1 - crop.left - crop.right
  const height = 1 - crop.top - crop.bottom
  if (width <= 0 || height <= 0) return {focusX: 0.5, focusY: 0.5, zoom: 1}
  return {
    focusX: crop.left + width / 2,
    focusY: crop.top + height / 2,
    zoom: clamp(Math.max(base.width / width, base.height / height), 1, 4),
  }
}
