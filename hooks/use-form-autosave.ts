'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

const AUTOSAVE_INTERVAL = 30_000 // 30 seconds
const STORAGE_KEY_PREFIX = 'em-signoff-draft-'

export interface UseFormAutosaveOptions<T> {
  /** Sign-off ID for existing drafts, or 'new' for new submissions */
  key: string
  /** Current form data to persist */
  data: T
  /** Whether autosave is enabled (disable after successful submit) */
  enabled?: boolean
}

export interface UseFormAutosaveReturn<T> {
  /** Recovered draft data from localStorage, if any */
  recoveredDraft: T | null
  /** Whether a draft was found on mount */
  hasDraft: boolean
  /** Accept the recovered draft (caller should apply it to form state) */
  acceptDraft: () => void
  /** Dismiss the recovered draft without applying */
  dismissDraft: () => void
  /** Manually save current data to localStorage */
  saveNow: () => void
  /** Clear localStorage entry (call on successful submit) */
  clearDraft: () => void
}

export function useFormAutosave<T>({
  key,
  data,
  enabled = true,
}: UseFormAutosaveOptions<T>): UseFormAutosaveReturn<T> {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`
  const dataRef = useRef(data)
  dataRef.current = data

  const [recoveredDraft, setRecoveredDraft] = useState<T | null>(null)
  const [hasDraft, setHasDraft] = useState(false)

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as T
        setRecoveredDraft(parsed)
        setHasDraft(true)
      }
    } catch {
      // Corrupted data — remove it
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  const saveNow = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataRef.current))
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [storageKey])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setRecoveredDraft(null)
    setHasDraft(false)
  }, [storageKey])

  const acceptDraft = useCallback(() => {
    // Caller is responsible for applying recoveredDraft to form state
    setHasDraft(false)
  }, [])

  const dismissDraft = useCallback(() => {
    setRecoveredDraft(null)
    setHasDraft(false)
    localStorage.removeItem(storageKey)
  }, [storageKey])

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      saveNow()
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [enabled, saveNow])

  // Save on unmount
  useEffect(() => {
    if (!enabled) return
    return () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataRef.current))
      } catch {
        // ignore
      }
    }
  }, [enabled, storageKey])

  return {
    recoveredDraft,
    hasDraft,
    acceptDraft,
    dismissDraft,
    saveNow,
    clearDraft,
  }
}
