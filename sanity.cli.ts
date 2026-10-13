import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  studioHost: 'richtour',
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'elggedkx',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  deployment: {
    autoUpdates: false,
  },
})
