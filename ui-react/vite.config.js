import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'

// On Windows, paths containing º (e.g. AMTEC_Terminal_1º) fail in Node.js fs reads.
// This plugin intercepts Vite's load phase and reads files via the 8.3 short path
// before Vite's built-in file reader gets a chance to fail.
function makeWinShortPathPlugin() {
  if (process.platform !== 'win32') return null
  const shortPathCache = new Map()

  function toShortPath(longPath) {
    if (!longPath.includes('\u00BA')) return null
    if (shortPathCache.has(longPath)) return shortPathCache.get(longPath)
    try {
      const short = execSync(
        `cmd /c for %I in ("${longPath}") do @echo %~sI`,
        { encoding: 'utf-8' }
      ).trim()
      shortPathCache.set(longPath, short)
      return short
    } catch {
      return null
    }
  }

  return {
    name: 'vite-plugin-win-short-path',
    enforce: 'pre',
    load(id) {
      const filepath = id.split('?')[0]
      const shortPath = toShortPath(filepath)
      if (!shortPath) return null
      try {
        const code = fs.readFileSync(shortPath, 'utf-8')
        return { code, map: null }
      } catch {
        return null
      }
    },
  }
}

const backendTarget = process.env.VITE_BAGO_API_URL || process.env.VITE_BAGO_API_BASE || 'http://127.0.0.1:8080'
const backendProxy = {
  '/api/v1': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/status': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/session': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/history': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/providers': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/menu': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/command': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/models': {
    target: backendTarget,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [makeWinShortPathPlugin(), react()].filter(Boolean),
  base: './',
  server: {
    port: 4173,
    host: '127.0.0.1',
    proxy: backendProxy,
  },
  preview: {
    host: '127.0.0.1',
    proxy: backendProxy,
  },
})
