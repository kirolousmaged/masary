// JS bridge to the native Android SmsPlugin Capacitor plugin.
// On web / Next.js SSR this import is safe — the plugin just doesn't fire.
import { registerPlugin } from '@capacitor/core'

export interface SmsReceivedData {
  sender: string
  body: string
}

export interface SmsPluginInterface {
  requestPermission(): Promise<void>
  addListener(
    eventName: 'smsReceived',
    listenerFunc: (data: SmsReceivedData) => void
  ): Promise<{ remove: () => void }> & { remove: () => void }
}

export const SmsPlugin = registerPlugin<SmsPluginInterface>('SmsPlugin')
