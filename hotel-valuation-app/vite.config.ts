import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function getBuildInfo() {
  let sha = 'unknown'
  try {
    sha = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    sha = 'unknown'
  }
  return { sha, time: new Date().toISOString() }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pamcap/' : '/',
  plugins: [react()],
  define: {
    __BUILD_INFO__: JSON.stringify(getBuildInfo()),
  },
}))
