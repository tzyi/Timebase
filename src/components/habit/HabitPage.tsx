'use client'

import { useState, useCallback, useEffect } from 'react'
import { Habit } from '@prisma/client'
import { getHabits } from '@/actions/habits'
import { toggleHabitLog } from '@/actions/habitLogs'
import { dateToString, getToday, getWeekDays } from '@/lib/calendarHelpers'
import { ensureOnline } from '@/lib/toast'
import WeekStrip from './WeekStrip'
import HabitList from './HabitList'
import HabitDetailPanel from './HabitDetailPanel'
import HabitFormModal from './HabitFormModal'
import ArchivedHabitsModal from './ArchivedHabitsModal'

export type HabitWithToday = Habit & { completedToday: boolean }

interface HabitPageProps {
  initialHabits: HabitWithToday[]
  initialDateStr: string
}

export default function HabitPage({ initialHabits, initialDateStr }: HabitPageProps) {
  const [focusDate, setFocusDate] = useState<Date>(() => new Date(`${initialDateStr}T00:00:00`))
  const [habits, setHabits] = useState<HabitWithToday[]>(initialHabits)
  const [weekCompletion, setWeekCompletion] = useState<{ [date: string]: boolean }>({})
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [isArchivedOpen, setIsArchivedOpen] = useState(false)

  const today = getToday()
  const weekDays = getWeekDays(today)
  const focusDateStr = dateToString(focusDate)

  const refreshHabits = useCallback(async (dateStr: string) => {
    const result = await getHabits(dateStr)
    if (result.success && result.data) {
      setHabits(result.data as HabitWithToday[])
    }
  }, [])

  const refreshWeekCompletion = useCallback(async () => {
    const entries = await Promise.all(
      weekDays.map(async (date) => {
        const dateStr = dateToString(date)
        const result = await getHabits(dateStr)
        const dayHabits = (result.success && result.data ? result.data : []) as HabitWithToday[]
        const fullyCompleted = dayHabits.length > 0 && dayHabits.every((h) => h.completedToday)
        return [dateStr, fullyCompleted] as const
      })
    )
    setWeekCompletion(Object.fromEntries(entries))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refreshHabits(focusDateStr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDateStr])

  useEffect(() => {
    refreshWeekCompletion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setFocusDate(date)
  }, [])

  const handleToggleLog = useCallback(
    async (habitId: number) => {
      if (!ensureOnline()) return
      await toggleHabitLog(habitId, focusDateStr)
      await refreshHabits(focusDateStr)
      await refreshWeekCompletion()
    },
    [focusDateStr, refreshHabits, refreshWeekCompletion]
  )

  const handleSelectHabit = useCallback((habitId: number) => {
    setSelectedHabitId(habitId)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedHabitId(null)
  }, [])

  const handleReorder = useCallback((orderedIds: number[]) => {
    setHabits((prev) => {
      const map = new Map(prev.map((h) => [h.id, h]))
      return orderedIds.map((id) => map.get(id)).filter((h): h is HabitWithToday => !!h)
    })
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingHabit(null)
    setIsFormOpen(true)
  }, [])

  const handleOpenEdit = useCallback((habit: Habit) => {
    setEditingHabit(habit)
    setIsFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
  }, [])

  const handleFormSuccess = useCallback(() => {
    refreshHabits(focusDateStr)
    refreshWeekCompletion()
  }, [focusDateStr, refreshHabits, refreshWeekCompletion])

  const handleArchived = useCallback(
    (habitId: number) => {
      if (selectedHabitId === habitId) setSelectedHabitId(null)
      refreshHabits(focusDateStr)
      refreshWeekCompletion()
    },
    [focusDateStr, selectedHabitId, refreshHabits, refreshWeekCompletion]
  )

  const handleArchivedModalClose = useCallback(() => {
    setIsArchivedOpen(false)
  }, [])

  const handleRestored = useCallback(() => {
    refreshHabits(focusDateStr)
    refreshWeekCompletion()
  }, [focusDateStr, refreshHabits, refreshWeekCompletion])

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-950">
      <div
        className={`w-full md:w-96 flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${
          selectedHabitId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">習慣</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsArchivedOpen(true)}
              className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              封存清單
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              + 新增
            </button>
          </div>
        </div>

        <WeekStrip
          weekDays={weekDays}
          focusDate={focusDate}
          completion={weekCompletion}
          onSelectDate={handleDateSelect}
        />

        <div className="flex-1 overflow-auto">
          <HabitList
            habits={habits}
            selectedHabitId={selectedHabitId}
            onToggleLog={handleToggleLog}
            onSelectHabit={handleSelectHabit}
            onReorder={handleReorder}
          />
        </div>
      </div>

      <div className={`flex-1 min-w-0 ${selectedHabitId ? 'flex' : 'hidden md:flex'}`}>
        {selectedHabitId ? (
          <HabitDetailPanel
            habitId={selectedHabitId}
            onBack={handleBackToList}
            onEdit={handleOpenEdit}
            onArchived={handleArchived}
          />
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            選擇一個習慣以查看詳細資料
          </div>
        )}
      </div>

      {isFormOpen && (
        <HabitFormModal
          isOpen={isFormOpen}
          habit={editingHabit}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {isArchivedOpen && (
        <ArchivedHabitsModal
          isOpen={isArchivedOpen}
          onClose={handleArchivedModalClose}
          onRestored={handleRestored}
        />
      )}
    </div>
  )
}
