'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import { getArchivedHabits, unarchiveHabit } from '@/actions/habits'
import { ensureOnline } from '@/lib/toast'

interface ArchivedHabitsModalProps {
  isOpen: boolean
  onClose: () => void
  onRestored: () => void
}

export default function ArchivedHabitsModal({ isOpen, onClose, onRestored }: ArchivedHabitsModalProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    getArchivedHabits().then((result) => {
      if (result.success && result.data) setHabits(result.data)
      setIsLoading(false)
    })
  }, [isOpen])

  const handleUnarchive = async (id: number) => {
    if (!ensureOnline()) return
    const result = await unarchiveHabit(id)
    if (result.success) {
      setHabits((prev) => prev.filter((h) => h.id !== id))
      onRestored()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">封存清單</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-400 dark:text-gray-500">載入中...</p>}

        {!isLoading && habits.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">目前沒有封存的習慣</p>
        )}

        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg"
            >
              <span className="text-lg">{habit.emoji}</span>
              <span className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-200 truncate">
                {habit.name}
              </span>
              <button
                type="button"
                onClick={() => handleUnarchive(habit.id)}
                className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-lg"
              >
                解除封存
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
