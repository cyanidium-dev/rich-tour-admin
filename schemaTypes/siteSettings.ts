import { defineType, defineField } from "sanity";

const siteSettings = defineType({
  name: "siteSettings",
  title: "Налаштування сайту",
  type: "document",

  fields: [
    defineField({
      name: "agentContract",
      title: "Договір агента",
      type: "file",
      options: {
        accept: ".pdf,.doc,.docx",
      },
    }),

    defineField({
      name: "touristContract",
      title: "Договір з туристом",
      type: "file",
      options: {
        accept: ".pdf,.doc,.docx",
      },
    }),

    defineField({
      name: "telegram",
      title: "Telegram канал",
      type: "url",
    }),

    defineField({
      name: "workSchedule",
      title: "Графік роботи",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "address",
      title: "Адреса",
      type: "text",
    }),

    defineField({
      name: "phones",
      title: "Номери телефонів",
      type: "array",
      of: [
        {
          type: "string",
          validation: (Rule) =>
            Rule.regex(/^\+?[0-9\s()-]+$/, {
              name: "phone",
              invert: false,
            }),
        },
      ],
    }),

    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),

    defineField({
      name: "facebook",
      title: "Facebook",
      type: "url",
    }),

    defineField({
      name: "instagram",
      title: "Instagram",
      type: "url",
    }),
  ],
});

export default siteSettings;