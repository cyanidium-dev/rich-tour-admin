const assert = require('node:assert/strict')
const test = require('node:test')
const {parseYoutubeVideoId, hotelVideoFileError, MAX_HOTEL_VIDEO_BYTES} = require('./hotelVideo.ts')
const id = 'dQw4w9WgXcQ'

test('normalizes supported YouTube URLs and iframe without preserving player options or HTML', () => {
  for (const input of [
    `https://www.youtube.com/watch?v=${id}&t=32`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=share`,
    `https://youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}?autoplay=1`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `<iframe width="560" src="https://www.youtube.com/embed/${id}?start=42&amp;autoplay=1" onload="evil()" allowfullscreen></iframe>`,
    `<iframe src='https://www.youtube-nocookie.com/embed/${id}'></iframe>`,
  ]) assert.equal(parseYoutubeVideoId(input), id, input)
})

test('rejects other origins, credentials, protocols, playlists and malformed embeds', () => {
  for (const input of [
    '', 'javascript:alert(1)', `http://youtube.com/watch?v=${id}`,
    `https://youtube.com.evil.example/watch?v=${id}`,
    `https://evil.example/embed/${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`,
    `https://user@youtube.com/watch?v=${id}`,
    `https://youtube.com:444/embed/${id}`,
    'https://youtube.com/playlist?list=example', 'https://youtu.be/invalid',
    `<iframe src="https://evil.example/embed/${id}"></iframe>`,
    `<iframe src="https://youtube.com/embed/${id}"></iframe><script>alert(1)</script>`,
    `<iframe data-src="https://youtube.com/embed/${id}"></iframe>`,
    `<iframe src="https://youtube.com/embed/${id}" src="https://evil.example"></iframe>`,
  ]) assert.equal(parseYoutubeVideoId(input), undefined, input)
})

test('accepts the inclusive size limit and validates both local files and stored assets', () => {
  assert.equal(hotelVideoFileError({type: 'video/mp4', size: MAX_HOTEL_VIDEO_BYTES}), undefined)
  assert.equal(hotelVideoFileError({mimeType: 'video/mp4', size: 1}), undefined)
  for (const file of [
    {type: 'video/mp4', size: MAX_HOTEL_VIDEO_BYTES + 1},
    {mimeType: 'video/quicktime', size: 100},
    {type: 'image/png', size: 100},
    {type: 'video/mp4', size: 0},
    {type: 'video/mp4', size: -1},
    {type: 'video/mp4', size: NaN},
    {type: 'video/mp4'},
  ]) assert.equal(typeof hotelVideoFileError(file), 'string')
})
