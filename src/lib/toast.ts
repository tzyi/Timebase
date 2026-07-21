'use client'

import { useSyncExternalStore } from 'react'

export interface ToastItem {
  id: number
  message: string
}

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function showToast(message: string, durationMs = 4000) {
  const id = nextId++
  toasts = [...toasts, { id, message }]
  emit()
  if (typeof window !== 'undefined') {
    window.setTimeout(() => dismiss(id), durationMs)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return toasts
}

function getServerSnapshot() {
  return []
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function dismissToast(id: number) {
  dismiss(id)
}

/** 若目前離線則顯示提示並回傳 false；線上則回傳 true。 */
export function ensureOnline(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    showToast('目前離線，請連上網路後再試')
    return false
  }
  return true
}
