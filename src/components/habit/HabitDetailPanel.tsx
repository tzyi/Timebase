'use client'

import { useState, useEffect, useCallback } from 'react'
import { Habit } from '@prisma/client'
import { getHabitById, archiveHabit } from '@/actions/habits'
import { getHabitLogsInRange, toggleHabitLog } from '@/actions/habitLogs'
import { dateToString, getToday } from '@/lib/calendarHelpers'
import { ensureOnline } from '@/lib/toast'
import HabitStatsCards from './HabitStatsCards'
import HabitCalendar from './HabitCalendar'

interface HabitDetailPanelProps {
  habitId: number
  onBack: () => void
  onEdit: (habit: Habit) => void
  onArchived: (habitId: number) => void
}

export default function HabitDetailPanel({ habitId, onBack, onEdit, onArchived }: HabitDetailPanelProps) {
  const [habit, setHabit] = useState<Habit | null>(null)
  const [logs, setLogs] = useState<{ date: string }[]>([])
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = getToday()
    return { year: today.getFullYear(), month: today.getMonth() }
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshLogs = useCallback(async (h: Habit, year: number, month: number) => {
    const todayStr = dateToString(getToday())
    const fromDateStr = dateToString(new Date(h.createdAt))
    const monthEndStr = dateToString(new Date(year, month + 1, 0))
    const toDateStr = monthEndStr > todayStr ? monthEndStr : todayStr
    const result = await getHabitLogsInRange(h.id, fromDateStr, toDateStr)
    if (result.success && result.data) {
      setLogs(result.data)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    const today = getToday()
    const year = today.getFullYear()
    const month = today.getMonth()
    setDisplayMonth({ year, month })

    getHabitById(habitId).then(async (result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setHabit(result.data)
        await refreshLogs(result.data, year, month)
      }
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [habitId, refreshLogs])

  const handleMonthChange = useCallback(
    async (year: number, month: number) => {
      setDisplayMonth({ year, month })
      if (habit) await refreshLogs(habit, year, month)
    },
    [habit, refreshLogs]
  )

  const handleToggleDate = useCallback(
    async (dateStr: string) => {
      if (!habit) return
      if (!ensureOnline()) return
      await toggleHabitLog(habit.id, dateStr)
      await refreshLogs(habit, displayMonth.year, displayMonth.month)
    },
    [habit, displayMonth, refreshLogs]
  )

  const handleArchiveClick = useCallback(async () => {
    if (!habit) return
    if (!confirm(`確定封存習慣「${habit.name}」？可於封存清單中解除封存。`)) return
    if (!ensureOnline()) return
    const result = await archiveHabit(habit.id)
    if (result.success) {
      onArchived(habit.id)
    }
  }, [habit, onArchived])

  if (isLoading || !habit) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button type="button" onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400">
            ‹ 返回
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          載入中...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-auto">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <button type="button" onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400">
          ‹ 返回
        </button>
        <span className="text-xl">{habit.emoji}</span>
        <h2 className="flex-1 min-w-0 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {habit.name}
        </h2>
        <button
          type="button"
          onClick={() => onEdit(habit)}
          className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={handleArchiveClick}
          className="px-2 py-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-900 rounded-lg"
        >
          封存
        </button>
      </div>

      {habit.description && (
        <p className="px-4 pt-3 text-sm text-gray-500 dark:text-gray-400">{habit.description}</p>
      )}

      <div className="p-4 space-y-4">
        <HabitStatsCards habit={habit} logs={logs} year={displayMonth.year} month={displayMonth.month} />
        <HabitCalendar
          habit={habit}
          logs={logs}
          year={displayMonth.year}
          month={displayMonth.month}
          onMonthChange={handleMonthChange}
          onToggleDate={handleToggleDate}
        />
      </div>
    </div>
  )
}
