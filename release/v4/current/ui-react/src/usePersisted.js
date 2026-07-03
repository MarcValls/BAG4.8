/**
 * usePersisted.js — shared localStorage read/write helpers.
 *
 * Every hook that persists state to localStorage used to carry its own
 * copy of readPersisted/writePersisted.  Centralise them here so there
 * is one implementation to maintain.
 */

export function readPersisted(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

export function writePersisted(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}