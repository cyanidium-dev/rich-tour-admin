import {useEffect, useRef, useState, type CSSProperties} from 'react'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ObjectInputProps, set, unset, useClient} from 'sanity'
import {
  assetDimensions,
  cropControls,
  cropPixelDensity,
  cropResolution,
  makeCrop,
  safeMaxZoom,
  type CropPreset,
  type CropRect,
} from './tourImageCrops'
import styles from './TourImageInput.module.css'

function rangeStyle(value: number, min: number, max: number): CSSProperties {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0
  return {'--range-progress': `${progress}%`} as CSSProperties
}

type TourImage = {
  _type?: 'image'
  _key?: string
  asset?: {_type?: 'reference'; _ref?: string}
  displayCrops?: Record<string, CropRect>
  crop?: CropRect
  hotspot?: {x: number; y: number; width: number; height: number}
}

function imageUrl(ref: string, projectId: string, dataset: string, crop?: CropRect) {
  const dimensions = assetDimensions(ref)
  if (!dimensions) return null
  const match = ref.match(/^image-([^-]+)-(\d+x\d+)-([a-z0-9]+)$/i)
  if (!match) return null
  const url = new URL(
    `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}.${match[3]}`,
  )
  if (crop) {
    const x = Math.round(dimensions.width * crop.left)
    const y = Math.round(dimensions.height * crop.top)
    const width = Math.max(1, dimensions.width - x - Math.round(dimensions.width * crop.right))
    const height = Math.max(1, dimensions.height - y - Math.round(dimensions.height * crop.bottom))
    url.searchParams.set('rect', `${x},${y},${width},${height}`)
  }
  url.searchParams.set('w', '900')
  url.searchParams.set('auto', 'format')
  return url.toString()
}

export function createTourImageInput(presets: CropPreset[]) {
  function TourImageInput({value, onChange}: ObjectInputProps) {
    const client = useClient({apiVersion: '2025-01-01'})
    const fileRef = useRef<HTMLInputElement>(null)
    const image = value as TourImage | undefined
    const ref = image?.asset?._ref
    const [selected, setSelected] = useState(presets[0].id)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const preset = presets.find((item) => item.id === selected) ?? presets[0]
    const crop = image?.displayCrops?.[preset.id]
    const [focusX, setFocusX] = useState(0.5)
    const [focusY, setFocusY] = useState(0.5)
    const [zoom, setZoom] = useState(1)
    const [editedKey, setEditedKey] = useState<string | null>(null)
    const frameKey = `${ref ?? ''}:${selected}`
    useEffect(() => {
      const saved = image?.displayCrops?.[selected]
      const controls = cropControls(ref, saved, preset)
      setFocusX(saved ? controls.focusX : (image?.hotspot?.x ?? controls.focusX))
      setFocusY(saved ? controls.focusY : (image?.hotspot?.y ?? controls.focusY))
      setZoom(controls.zoom)
      setEditedKey(null)
      // Keep slider state while the current crop is being saved.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, selected])
    const config = client.config()
    const previewCrop = editedKey === frameKey
      ? (makeCrop(ref, preset, focusX, focusY, zoom) ?? crop)
      : (crop ?? makeCrop(ref, preset, focusX, focusY, zoom))
    const resolution = cropResolution(ref, previewCrop ?? undefined)
    const pixelDensity = cropPixelDensity(ref, previewCrop ?? undefined, preset)
    const baseDensity = cropPixelDensity(ref, makeCrop(ref, preset) ?? undefined, preset)
    const maxSafeZoom = safeMaxZoom(ref, preset)
    const savedZoom = crop ? cropControls(ref, crop, preset).zoom : 1
    const sliderMax = Math.max(maxSafeZoom ?? 4, savedZoom)
    const preview = ref
      ? imageUrl(ref, String(config.projectId), String(config.dataset), previewCrop ?? undefined)
      : null

    const saveCrop = (x: number, y: number, zoom: number) => {
      if (!ref) return
      const next = makeCrop(ref, preset, x, y, zoom)
      if (!next) return
      onChange(
        image?.displayCrops
          ? set(next, ['displayCrops', preset.id])
          : set({[preset.id]: next}, ['displayCrops']),
      )
    }

    const upload = async (file?: File) => {
      if (!file) return
      setBusy(true)
      setError(null)
      try {
        const asset = await client.assets.upload('image', file, {filename: file.name})
        const displayCrops = Object.fromEntries(
          presets.map((item) => [item.id, makeCrop(asset._id, item)]).filter((entry) => entry[1]),
        ) as Record<string, CropRect>
        const primary = displayCrops[presets[0].id]
        onChange(
          set({
            ...(image?._key ? {_key: image._key} : {}),
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
            displayCrops,
            ...(primary
              ? {
                  crop: primary,
                  hotspot: {
                    x: 0.5,
                    y: 0.5,
                    width: 1 - primary.left - primary.right,
                    height: 1 - primary.top - primary.bottom,
                  },
                }
              : {}),
          }),
        )
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити фото')
      } finally {
        setBusy(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    }

    return (
      <Card padding={3} radius={2} border>
        <Stack gap={4}>
          <Flex gap={2} wrap="wrap">
            <Button
              text={ref ? 'Замінити фото' : 'Завантажити фото'}
              tone="primary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            />
            {ref && (
              <Button
                text="Прибрати"
                tone="critical"
                mode="ghost"
                disabled={busy}
                onClick={() => onChange(unset())}
              />
            )}
          </Flex>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          {error && (
            <Text size={1} muted>
              {error}
            </Text>
          )}
          {ref && (
            <Stack gap={4}>
              <Text size={1}>
                Оберіть місце на сайті та налаштуйте його кадр. Оригінал фото залишається незмінним.
              </Text>
              <Flex gap={2} wrap="wrap">
                {presets.map((item) => (
                  <Button
                    key={item.id}
                    text={item.title}
                    mode={selected === item.id ? 'default' : 'ghost'}
                    tone="primary"
                    onClick={() => setSelected(item.id)}
                  />
                ))}
              </Flex>
              <Box
                style={{
                  width: '100%',
                  maxWidth: 600,
                  aspectRatio: `${preset.width} / ${preset.height}`,
                  overflow: 'hidden',
                  background: '#eee',
                  borderRadius: 8,
                }}
              >
                {preview && (
                  <img
                    src={preview}
                    alt="Попередній перегляд кадру"
                    style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                )}
              </Box>
              {!crop && (
                <Text size={1} muted>
                  Для цього місця кадр ще не задано. Натисніть «Зберегти кадр» або змініть фокус.
                </Text>
              )}
              {resolution && pixelDensity !== null && (
                <Card
                  padding={3}
                  radius={2}
                  tone={pixelDensity >= 2 ? 'positive' : pixelDensity >= 1 ? 'caution' : 'critical'}
                  className={styles.qualityCard}
                >
                  <Stack gap={2}>
                    <Text size={1} weight="semibold">
                      {pixelDensity >= 2
                        ? 'Якість для цієї рамки: добра'
                        : pixelDensity >= 1
                          ? 'Якість для цієї рамки: може бути розмитою на щільному екрані'
                          : 'Якість для цієї рамки: замало пікселів'}
                    </Text>
                    <Text size={1}>
                      У кадрі: {Math.floor(resolution.width)}×{Math.floor(resolution.height)} пікс.
                      {' '}Орієнтир для рамки {preset.width}×{preset.height}: {preset.width * 2}×{preset.height * 2} пікс. (2×).
                    </Text>
                    {baseDensity !== null && baseDensity < 2 && (
                      <Text size={1}>
                        Оригінал замалий навіть без збільшення кадру. Завантажте фото більшого розміру.
                      </Text>
                    )}
                    {baseDensity !== null && baseDensity >= 2 && pixelDensity < 2 && (
                      <Text size={1}>
                        Зменште масштаб кадру до {maxSafeZoom?.toFixed(2)}× або завантажте фото більшого розміру.
                      </Text>
                    )}
                  </Stack>
                </Card>
              )}
              <label className={styles.sliderField}>
                <span className={styles.sliderHeading}>
                  <span>Фокус по горизонталі</span>
                  <output className={styles.sliderValue}>{Math.round(focusX * 100)}%</output>
                </span>
                <input
                  className={styles.range}
                  aria-label="Фокус по горизонталі"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={focusX}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    setFocusX(next)
                    setEditedKey(frameKey)
                    saveCrop(next, focusY, zoom)
                  }}
                  style={rangeStyle(focusX, 0, 1)}
                />
              </label>
              <label className={styles.sliderField}>
                <span className={styles.sliderHeading}>
                  <span>Фокус по вертикалі</span>
                  <output className={styles.sliderValue}>{Math.round(focusY * 100)}%</output>
                </span>
                <input
                  className={styles.range}
                  aria-label="Фокус по вертикалі"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={focusY}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    setFocusY(next)
                    setEditedKey(frameKey)
                    saveCrop(focusX, next, zoom)
                  }}
                  style={rangeStyle(focusY, 0, 1)}
                />
              </label>
              <label className={styles.sliderField}>
                <span className={styles.sliderHeading}>
                  <span>Масштаб кадру</span>
                  <output className={styles.sliderValue}>{zoom.toFixed(2)}×</output>
                </span>
                <input
                  className={styles.range}
                  aria-label="Масштаб кадру"
                  type="range"
                  min="1"
                  max={sliderMax}
                  step="0.01"
                  value={zoom}
                  disabled={maxSafeZoom === 1 && savedZoom <= 1}
                  onChange={(event) => {
                    const requested = Number(event.target.value)
                    // Existing overzoomed frames may be reduced gradually, but never enlarged further.
                    const next = maxSafeZoom === null
                      ? requested
                      : zoom > maxSafeZoom
                        ? Math.min(requested, zoom)
                        : Math.min(requested, maxSafeZoom)
                    setZoom(next)
                    setEditedKey(frameKey)
                    saveCrop(focusX, focusY, next)
                  }}
                  style={rangeStyle(zoom, 1, sliderMax)}
                />
                {maxSafeZoom !== null && (
                  <Text size={1} muted>
                    Максимум для орієнтира 2×: {maxSafeZoom.toFixed(2)}×.
                  </Text>
                )}
              </label>
              <Button
                text="Зберегти кадр"
                tone="primary"
                onClick={() => saveCrop(focusX, focusY, zoom)}
              />
            </Stack>
          )}
        </Stack>
      </Card>
    )
  }
  return TourImageInput
}

export function cropFields(presets: CropPreset[]) {
  return [
    {
      name: 'displayCrops',
      title: 'Кадри для сайту',
      type: 'object' as const,
      hidden: true,
      fields: presets.map((preset) => ({
        name: preset.id,
        title: preset.title,
        type: 'object' as const,
        fields: (['left', 'top', 'right', 'bottom'] as const).map((name) => ({
          name,
          title: name,
          type: 'number' as const,
        })),
      })),
    },
  ]
}
