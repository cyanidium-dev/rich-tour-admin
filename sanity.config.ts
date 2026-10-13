import React from 'react'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import RelatedBaseTours from './components/RelatedBaseTours'
import RelatedDateTours from './components/RelatedDateTours'
import DuplicateTourDateAction from './components/DuplicateTourDateAction'
import RetryCrmSyncAction from './components/RetryCrmSyncAction'
import UserLookupTool from './components/UserLookupTool'
import StaffManagementTool from './components/StaffManagementTool'
import {siteSchemaTypes, tourSchemaTypes, userSchemaTypes} from './schemaTypes'
import {isSuperAdmin, projectId} from './studioAccess'

const contentDataset = process.env.SANITY_STUDIO_DATASET || 'production'
const usersDataset = process.env.SANITY_STUDIO_USERS_DATASET || 'users-production'

export default defineConfig([
  {
    name: 'content',
    title: 'Rich Tour — туры',
    basePath: '/content',
    projectId,
    dataset: contentDataset,
    schema: {types: tourSchemaTypes},
    document: {
      actions: (previousActions, context) =>
        context.schemaType === 'tour-to-date'
          ? [...previousActions, DuplicateTourDateAction]
          : previousActions,
    },
    plugins: [
      structureTool({
        structure: (S) => S.list().title('Туры').items(S.documentTypeListItems()),
        defaultDocumentNode: (S, {schemaType, documentId}) => {
          if (schemaType === 'tour-category') {
            return S.document()
              .id(`tour-category-${documentId ?? 'new'}`)
              .views([
                S.view.form().id('form').title('Редагування'),
                S.view
                  .component(() => React.createElement(RelatedBaseTours, {documentId: documentId ?? ''}))
                  .id('related-base-tours')
                  .title('Базові тури'),
              ])
          }

          if (schemaType === 'tour-basic') {
            return S.document()
              .id(`tour-basic-${documentId ?? 'new'}`)
              .views([
                S.view.form().id('form').title('Редагування'),
                S.view
                  .component(() => React.createElement(RelatedDateTours, {documentId: documentId ?? ''}))
                  .id('related-date-tours')
                  .title('Тури на дати'),
              ])
          }

          return S.document().views([S.view.form().id('form').title('Редагування')])
        },
      }),
    ],
  },
  {
    name: 'site',
    title: 'Rich Tour — сайт',
    basePath: '/site',
    projectId,
    dataset: contentDataset,
    hidden: ({currentUser}) => currentUser !== null && !isSuperAdmin(currentUser),
    schema: {types: siteSchemaTypes},
    tools: (previousTools) => [
      ...previousTools,
      {name: 'staff', title: 'Сотрудники Studio', component: StaffManagementTool},
    ],
    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Сайт')
            .items([
              S.listItem()
                .title('Налаштування сайту')
                .id('siteSettings')
                .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
              ...S.documentTypeListItems().filter((item) => item.getId() !== 'siteSettings'),
            ]),
      }),
      visionTool(),
    ],
  },
  {
    name: 'users',
    title: 'Rich Tour — користувачі',
    basePath: '/users',
    projectId,
    dataset: usersDataset,
    hidden: ({currentUser}) => currentUser !== null && !isSuperAdmin(currentUser),
    schema: {types: userSchemaTypes},
    tools: (previousTools) => [
      ...previousTools,
      {name: 'user-lookup', title: 'Поиск пользователя', component: UserLookupTool},
    ],
    document: {
      actions: (previousActions, context) =>
        context.schemaType === 'agentUser'
          ? [...previousActions, RetryCrmSyncAction]
          : previousActions,
    },
    plugins: [structureTool()],
  },
])
