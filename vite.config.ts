import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { multiplayerRelayPlugin } from './server/multiplayerPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), multiplayerRelayPlugin()],
  // Bind to all interfaces (not just localhost) so a second device on the same
  // wifi network can reach this machine's dev server for multiplayer.
  server: {
    host: true,
  },
})
