import React from "react";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";
import RelatedBaseTours from "./components/RelatedBaseTours";
import RelatedDateTours from "./components/RelatedDateTours";

export default defineConfig({
  name: "default",
  title: "Rich tour admin",

  projectId: "elggedkx",
  dataset: "production",

  useCdn: true,

  schema: {
    types: schemaTypes,
  },

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Контент")
          .items([
            S.listItem()
              .title("Налаштування сайту")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),

            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "siteSettings"
            ),
          ]),

      // ✅ ВОТ ЭТО ДОБАВИТ ВКЛАДКУ ВНУТРИ tour-category
      defaultDocumentNode: (S, { schemaType, documentId }) => {
        // ✅ Категории — как у тебя уже сделано
        if (schemaType === "tour-category") {
          return S.document()
            .id(`tour-category-${documentId}`)
            .views([
              S.view.form().id("form").title("Редагування"),
              S.view
                .component(() => React.createElement(RelatedBaseTours, { documentId }))
                .id("related-base-tours")
                .title("Базові тури"),
            ]);
        }
      
        // ✅ Базовые туры — добавляем вкладку с турами на даты
        if (schemaType === "tour-basic") {
          return S.document()
            .id(`tour-basic-${documentId}`)
            .views([
              S.view.form().id("form").title("Редагування"),
              S.view
                .component(() => React.createElement(RelatedDateTours, { documentId }))
                .id("related-date-tours")
                .title("Тури на дати"),
            ]);
        }
      
        return S.document().views([S.view.form().id("form").title("Редагування")]);
      },
    }),

    visionTool(),
  ],
});