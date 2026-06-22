import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  studioHost: 'richtour',
  api: {
    projectId: 'elggedkx',
    dataset: 'production'
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
