import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.masary.app',
  appName: 'مصرى',
  webDir: 'out',
  android: {
    allowMixedContent: true,
    backgroundColor: '#0D1117',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
