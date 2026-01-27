import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

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
            // 🔒 Singleton: Site Settings
            S.listItem()
              .title("Налаштування сайту")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),

            // остальные типы документов
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== "siteSettings"
            ),
          ]),
    }),

    visionTool(),
  ],
});
