import {defineField, defineType} from 'sanity'
import MainTourCategoryInput from '../components/MainTourCategoryInput'
import {createTourImageInput, cropFields} from '../components/TourImageInput'
import {categoryPresets} from '../components/tourImageCrops'

const CategoryImageInput = createTourImageInput(categoryPresets)

export default defineType({
  name: 'tour-category',
  title: 'Категорія туру',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Назва категорії',
      type: 'string',
      validation: (Rule) => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'description',
      title: 'Опис категорії',
      type: 'blockContent',
    }),
    defineField({
      name: 'image',
      title: 'Зображення категорії',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: cropFields(categoryPresets),
      components: {input: CategoryImageInput},
      validation: (rule) => rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'active',
      title: 'Використовувати у фільтрах',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'main',
      title: 'Категорія для вітрини',
      type: 'boolean',
      initialValue: false,
      components: {input: MainTourCategoryInput},
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
