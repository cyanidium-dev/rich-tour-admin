export const MAX_HOTEL_VIDEO_BYTES = 100_000_000
export const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export function parseYoutubeVideoId(input: string): string | undefined {
  let source = input.trim()
  if (source.startsWith('<')) {
    const iframe = /^<iframe\b([^<>]*)>\s*<\/iframe>$/i.exec(source)
    if (!iframe) return undefined
    const sources = [...iframe[1].matchAll(/(?:^|\s)src\s*=\s*(["'])(.*?)\1/gi)]
    if (sources.length !== 1) return undefined
    source = sources[0][2].replace(/&amp;/g, '&')
  }
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined
    const host = url.hostname.toLowerCase()
    let id: string | null | undefined
    if (host === 'youtu.be') {
      id = /^\/([^/]+)\/?$/.exec(url.pathname)?.[1]
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      id =
        url.pathname === '/watch'
          ? url.searchParams.get('v')
          : /^\/(?:embed|shorts)\/([^/]+)\/?$/.exec(url.pathname)?.[1]
    } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      id = /^\/embed\/([^/]+)\/?$/.exec(url.pathname)?.[1]
    }
    return id && YOUTUBE_VIDEO_ID.test(id) ? id : undefined
  } catch {
    return undefined
  }
}

export function hotelVideoFileError(file: {size?: number; type?: string; mimeType?: string}) {
  if ((file.type ?? file.mimeType) !== 'video/mp4') return 'Оберіть відеофайл MP4 (H.264/AAC)'
  if (!Number.isFinite(file.size) || !file.size || file.size < 0)
    return 'Файл порожній або його розмір невідомий'
  if (file.size > MAX_HOTEL_VIDEO_BYTES) return 'Розмір відео має бути не більше 100 МБ'
  return undefined
}
