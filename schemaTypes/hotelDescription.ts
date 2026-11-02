import {defineArrayMember, defineField, defineType} from 'sanity'
import blockContent from './blockContent'
import {HotelDescriptionInput, HotelVideoFileInput} from '../components/HotelMediaInput'
import HotelYoutubeInput from '../components/HotelYoutubeInput'
import {hotelVideoFileError, YOUTUBE_VIDEO_ID} from '../components/hotelVideo'

export const hotelVideoFile = defineType({
  name: 'hotelVideoFile',
  title: 'Відеофайл',
  type: 'file',
  options: {accept: 'video/mp4'},
  description:
    'MP4 (H.264/AAC), до 100 МБ. Підготуйте відео заздалегідь: автоматичної конвертації немає.',
  components: {input: HotelVideoFileInput},
  fields: [
    defineField({name: 'title', title: 'Назва відео', type: 'string'}),
    defineField({name: 'poster', title: 'Обкладинка', type: 'image', options: {hotspot: true}}),
  ],
  validation: (Rule) =>
    Rule.required()
      .assetRequired()
      .custom(async (value, context) => {
        if (!value?.asset?._ref) return true // assetRequired handles missing references.
        try {
          const asset = await context.getClient({apiVersion: '2025-04-26'}).getDocument<{
            _id: string
            size: number
            mimeType: string
          }>(value.asset._ref)
          return asset ? (hotelVideoFileError(asset) ?? true) : 'Відеофайл не знайдено'
        } catch {
          return 'Не вдалося перевірити відеофайл. Спробуйте ще раз перед публікацією.'
        }
      }),
  preview: {
    select: {title: 'title', filename: 'asset.originalFilename', media: 'poster'},
    prepare: ({title, filename, media}) => ({
      title: title || filename || 'Відеофайл',
      subtitle: 'MP4',
      media,
    }),
  },
})

export const hotelYoutube = defineType({
  name: 'hotelYoutube',
  title: 'YouTube',
  type: 'object',
  fields: [
    defineField({
      name: 'videoId',
      title: 'Посилання або iframe YouTube',
      type: 'string',
      components: {input: HotelYoutubeInput},
      validation: (Rule) =>
        Rule.required().regex(YOUTUBE_VIDEO_ID).error('Додайте коректне відео YouTube'),
    }),
    defineField({name: 'title', title: 'Назва відео', type: 'string'}),
  ],
  preview: {
    select: {title: 'title', videoId: 'videoId'},
    prepare: ({title, videoId}) => ({title: title || 'YouTube', subtitle: videoId}),
  },
})

export default defineType({
  ...blockContent,
  name: 'hotelDescription',
  title: 'Опис готелю',
  components: {input: HotelDescriptionInput},
  of: [
    ...blockContent.of,
    defineArrayMember({type: 'hotelVideoFile'}),
    defineArrayMember({type: 'hotelYoutube'}),
  ],
})
