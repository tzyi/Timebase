'use client'

import { useState, useCallback, useEffect } from 'react'
import { List, Tag } from '@prisma/client'
import { getMonthTasks, updateTask, CalendarFilters as ServerCalendarFilters } from '@/actions/tasks'
import { getToday, dateToString } from '@/lib/calendarHelpers'
import FilterBar from './FilterBar'
import MonthView from './MonthView'
import DayTasksList from './DayTasksList'
import TaskDetailModal from './TaskDetailModal'
import { CalendarView, CalendarFiltersState, TaskWithRelations } from './types'

interface CalendarPageProps {
  initialLists: List[]
  initialTags: Tag[]
  initialMonthTasks: { [date: string]: TaskWithRelations[] }
}

const VIEW_LABELS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'week', label: '週' },
  { value: 'day', label: '日' },
]

export default function CalendarPage({
  initialLists,
  initialTags,
  initialMonthTasks,
}: CalendarPageProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [focusDate, setFocusDate] = useState<Date>(getToday())
  const [filters, setFilters] = useState<CalendarFiltersState>({
    listIds: [],
    tagIds: [],
    priorities: [],
  })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [monthTasks, setMonthTasks] = useState(initialMonthTasks)
  const [isLoading, setIsLoading] = useState(false)

  const refreshMonthTasks = useCallback(async (date: Date, currentFilters: CalendarFiltersState) => {
    setIsLoading(true)
    try {
      const apiFilters: ServerCalendarFilters = {
        listIds: currentFilters.listIds.length > 0 ? currentFilters.listIds : undefined,
        tagIds: currentFilters.tagIds.length > 0 ? currentFilters.tagIds : undefined,
        priorities: currentFilters.priorities.length > 0 ? currentFilters.priorities : undefined,
      }
      const result = await getMonthTasks(date.getFullYear(), date.getMonth(), apiFilters)
      if (result.success && result.data) {
        setMonthTasks(result.data as { [date: string]: TaskWithRelations[] })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'month') {
      refreshMonthTasks(focusDate, filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, focusDate.getFullYear(), focusDate.getMonth(), filters, refreshMonthTasks])

  const handleDateClick = useCallback((date: Date) => {
    setFocusDate(date)
  }, [])

  const handleTaskClick = useCallback((taskId: number) => {
    setSelectedTaskId(taskId)
  }, [])

  const handleTaskUpdate = useCallback(async (taskId: number, newDateStr: string) => {
    const newDate = new Date(newDateStr)
    const result = await updateTask(taskId, { dueDate: newDate })
    if (result.success) {
      await refreshMonthTasks(focusDate, filters)
      return true
    }
    return false
  }, [focusDate, filters, refreshMonthTasks])

  const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
    const newDate = new Date(newYear, newMonth, 1)
    setFocusDate(newDate)
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  const monthLabel = `${focusDate.getFullYear()} 年 ${focusDate.getMonth() + 1} 月`
  const focusDateTasks = monthTasks[dateToString(focusDate)] || []
  const selectedTask =
    selectedTaskId !== null
      ? Object.values(monthTasks).flat().find((t) => t.id === selectedTaskId) || null
      : null

  return (
    <div className="flex h-full bg-gray-100">
      <div className="hidden lg:flex w-72 flex-col border-r border-gray-200 bg-white">
        <DayTasksList focusDate={focusDate} tasks={focusDateTasks} onTaskClick={handleTaskClick} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold text-gray-900">{monthLabel}</h1>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {VIEW_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === value
                    ? 'bg-white text-blue-600 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <FilterBar lists={initialLists} tags={initialTags} filters={filters} onFilterChange={setFilters} />

        <div className="flex-1 overflow-auto p-4">
          {view === 'month' && (
            <MonthView
              monthTasks={monthTasks}
              year={focusDate.getFullYear()}
              month={focusDate.getMonth()}
              focusDate={focusDate}
              onDateClick={handleDateClick}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              onMonthChange={handleMonthChange}
            />
          )}
          {view === 'week' && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              週視圖開發中
            </div>
          )}
          {view === 'day' && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              日視圖開發中
            </div>
          )}
          {isLoading && <p className="text-xs text-gray-400 mt-2">載入中...</p>}
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={selectedTaskId !== null}
        onClose={handleModalClose}
        onSave={() => refreshMonthTasks(focusDate, filters)}
        lists={initialLists}
        tags={initialTags}
      />
    </div>
  )
}
