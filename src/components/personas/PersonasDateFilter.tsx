'use client'

import { useState, useCallback } from 'react'
import type { PersonasAnalytics } from '@/lib/personas-analytics'

interface PersonasDateFilterProps {
  readonly onDateChange: (date: string | null) => void
  readonly isLoading: boolean
}

export function PersonasDateFilter({ onDateChange, isLoading }: Readonly<PersonasDateFilterProps>) {
  const [selectedDate, setSelectedDate] = useState<string>('')

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value
      setSelectedDate(date)
      onDateChange(date || null)
    },
    [onDateChange]
  )

  const handleClear = useCallback(() => {
    setSelectedDate('')
    onDateChange(null)
  }, [onDateChange])

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex items-center gap-2">
        <label htmlFor="creation-date" className="text-sm font-body text-on-surface-variant">
          Filter by creation date:
        </label>
        <input
          id="creation-date"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          disabled={isLoading}
          className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-sm font-body disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      {selectedDate && (
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-sm font-body hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear filter
        </button>
      )}
      {isLoading && <span className="text-xs text-on-surface-variant">Loading...</span>}
    </div>
  )
}
