'use client'

import { useState, useCallback, useEffect } from 'react'
import { List, Tag } from '@prisma/client'
import {
  getMonthTasks,
  getWeekTasks,
  getDayTasks,
  updateTask,
  toggleTaskComplete,
  CalendarFilters as ServerCalendarFilters,
} from '@/actions/tasks'
import { getToday, dateToString, getWeekDays, addDays, formatDate } from '@/lib/calendarHelpers'
import FilterBar from './FilterBar'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'
import DayTasksList from './DayTasksList'
import NewTaskModal from './NewTaskModal'
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel'
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
  const [viewReady, setViewReady] = useState(false)
  const [focusDate, setFocusDate] = useState<Date>(getToday())
  const [filters, setFilters] = useState<CalendarFiltersState>({
    listIds: [],
    tagIds: [],
    priorities: [],
  })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [newTaskDraft, setNewTaskDraft] = useState<{
    date: Date
    dueTime?: string
    endTime?: string
  } | null>(null)
  const [monthTasks, setMonthTasks] = useState(initialMonthTasks)
  const [weekTasks, setWeekTasks] = useState<{ [date: string]: TaskWithRelations[] }>({})
  const [dayTasks, setDayTasks] = useState<TaskWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 640)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const buildApiFilters = useCallback((currentFilters: CalendarFiltersState): ServerCalendarFilters => ({
    listIds: currentFilters.listIds.length > 0 ? currentFilters.listIds : undefined,
    tagIds: currentFilters.tagIds.length > 0 ? currentFilters.tagIds : undefined,
    priorities: currentFilters.priorities.length > 0 ? currentFilters.priorities : undefined,
  }), [])

  const refreshMonthTasks = useCallback(async (date: Date, currentFilters: CalendarFiltersState) => {
    setIsLoading(true)
    try {
      const result = await getMonthTasks(date.getFullYear(), date.getMonth(), buildApiFilters(currentFilters))
      if (result.success && result.data) {
        setMonthTasks(result.data as { [date: string]: TaskWithRelations[] })
      }
    } finally {
      setIsLoading(false)
    }
  }, [buildApiFilters])

  const refreshWeekTasks = useCallback(async (date: Date, currentFilters: CalendarFiltersState) => {
    setIsLoading(true)
    try {
      const weekStart = getWeekDays(date)[0]
      const result = await getWeekTasks(weekStart, buildApiFilters(currentFilters))
      if (result.success && result.data) {
        setWeekTasks(result.data as { [date: string]: TaskWithRelations[] })
      }
    } finally {
      setIsLoading(false)
    }
  }, [buildApiFilters])

  const refreshDayTasks = useCallback(async (date: Date, currentFilters: CalendarFiltersState) => {
    setIsLoading(true)
    try {
      const result = await getDayTasks(date, buildApiFilters(currentFilters))
      if (result.success && result.data) {
        setDayTasks(result.data as TaskWithRelations[])
      }
    } finally {
      setIsLoading(false)
    }
  }, [buildApiFilters])

  const refreshCurrentView = useCallback(async (date: Date, currentFilters: CalendarFiltersState) => {
    if (view === 'month') await refreshMonthTasks(date, currentFilters)
    if (view === 'week') await refreshWeekTasks(date, currentFilters)
    if (view === 'day') await refreshDayTasks(date, currentFilters)
  }, [view, refreshMonthTasks, refreshWeekTasks, refreshDayTasks])

  useEffect(() => {
    const saved = window.localStorage.getItem('calendar:view')
    if (saved === 'month' || saved === 'week' || saved === 'day') {
      setView(saved)
    }
    setViewReady(true)
  }, [])

  useEffect(() => {
    if (!viewReady) return
    if (view === 'month') {
      refreshMonthTasks(focusDate, filters)
    } else if (view === 'week') {
      refreshWeekTasks(focusDate, filters)
    } else if (view === 'day') {
      refreshDayTasks(focusDate, filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewReady, view, focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate(), filters])

  useEffect(() => {
    if (!viewReady) return
    window.localStorage.setItem('calendar:view', view)
  }, [viewReady, view])

  const handleDateClick = useCallback((date: Date) => {
    setFocusDate(date)
    if (isMobile && view === 'month') {
      setView('day')
    }
  }, [isMobile, view])

  const handleTaskClick = useCallback((taskId: number) => {
    setSelectedTaskId(taskId)
  }, [])

  const handleToggleComplete = useCallback(async (taskId: number, completed: boolean) => {
    const result = await toggleTaskComplete(taskId, completed)
    if (result.success) {
      await refreshCurrentView(focusDate, filters)
    }
  }, [focusDate, filters, refreshCurrentView])

  const handleTaskUpdate = useCallback(async (taskId: number, newDateStr: string) => {
    const newDate = new Date(`${newDateStr}T00:00:00`)
    const result = await updateTask(taskId, { dueDate: newDate })
    if (result.success) {
      await refreshMonthTasks(focusDate, filters)
      return true
    }
    return false
  }, [focusDate, filters, refreshMonthTasks])

  const handleTaskTimeUpdate = useCallback(async (
    taskId: number,
    dateStr: string,
    newDueTime: string,
    newEndTime: string
  ) => {
    const newDate = new Date(`${dateStr}T00:00:00`)
    const result = await updateTask(taskId, {
      dueDate: newDate,
      dueTime: newDueTime,
      endTime: newEndTime,
    })
    if (result.success) {
      if (view === 'week') await refreshWeekTasks(focusDate, filters)
      if (view === 'day') await refreshDayTasks(focusDate, filters)
      return true
    }
    return false
  }, [view, focusDate, filters, refreshWeekTasks, refreshDayTasks])

  const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
    const newDate = new Date(newYear, newMonth, 1)
    setFocusDate(newDate)
  }, [])

  const handlePrevMonth = useCallback(() => {
    setFocusDate((prev) => {
      const newMonth = prev.getMonth() - 1
      if (newMonth < 0) return new Date(prev.getFullYear() - 1, 11, 1)
      return new Date(prev.getFullYear(), newMonth, 1)
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setFocusDate((prev) => {
      const newMonth = prev.getMonth() + 1
      if (newMonth > 11) return new Date(prev.getFullYear() + 1, 0, 1)
      return new Date(prev.getFullYear(), newMonth, 1)
    })
  }, [])

  const handlePrevWeek = useCallback(() => {
    setFocusDate((prev) => addDays(getWeekDays(prev)[0], -7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setFocusDate((prev) => addDays(getWeekDays(prev)[0], 7))
  }, [])

  const handlePrevDay = useCallback(() => {
    setFocusDate((prev) => addDays(prev, -1))
  }, [])

  const handleNextDay = useCallback(() => {
    setFocusDate((prev) => addDays(prev, 1))
  }, [])

  const handleToday = useCallback(() => {
    setFocusDate(getToday())
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  const handleNewTaskFromDate = useCallback((date: Date) => {
    setNewTaskDraft({ date })
  }, [])

  const handleNewTaskFromTime = useCallback((date: Date, dueTime: string, endTime: string) => {
    setNewTaskDraft({ date, dueTime, endTime })
  }, [])

  const handleNewTaskModalClose = useCallback(() => {
    setNewTaskDraft(null)
  }, [])

  const handleNewTaskCreated = useCallback(() => {
    refreshCurrentView(focusDate, filters)
  }, [focusDate, filters, refreshCurrentView])

  const weekStart = getWeekDays(focusDate)[0]
  const weekEnd = addDays(weekStart, 6)
  const monthLabel = `${focusDate.getFullYear()} 年 ${focusDate.getMonth() + 1} 月`
  const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
  const headerLabel = view === 'month' ? monthLabel : view === 'week' ? weekLabel : formatDate(focusDate)
  const focusDateTasks =
    view === 'day'
      ? dayTasks
      : view === 'week'
        ? weekTasks[dateToString(focusDate)] || []
        : monthTasks[dateToString(focusDate)] || []
  // 目前視圖的資料在每次切換/儲存後都會重新抓取，其餘視圖的資料可能是尚未刷新的舊資料，
  // 因此查找時需優先採用目前視圖的資料，避免顯示到過期的任務內容（例如舊的時間欄位）。
  const currentViewTasks =
    view === 'day'
      ? dayTasks
      : view === 'week'
        ? Object.values(weekTasks).flat()
        : Object.values(monthTasks).flat()
  const otherLoadedTasks = [
    ...(view !== 'month' ? Object.values(monthTasks).flat() : []),
    ...(view !== 'week' ? Object.values(weekTasks).flat() : []),
    ...(view !== 'day' ? dayTasks : []),
  ]
  const allLoadedTasks = [...currentViewTasks, ...otherLoadedTasks]
  const selectedTask =
    selectedTaskId !== null
      ? allLoadedTasks.find((t) => t.id === selectedTaskId) || null
      : null

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-950">
      <div className="hidden lg:flex w-72 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <DayTasksList
          focusDate={focusDate}
          tasks={focusDateTasks}
          onTaskClick={handleTaskClick}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            {view === 'week' && (
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  aria-label="上一週"
                  className="px-3 md:px-2 py-2.5 md:py-1 text-lg md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  aria-label="下一週"
                  className="px-3 md:px-2 py-2.5 md:py-1 text-lg md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ›
                </button>
              </div>
            )}
            {view === 'month' && (
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="上個月"
                  className="px-3 md:px-2 py-2.5 md:py-1 text-lg md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="下個月"
                  className="px-3 md:px-2 py-2.5 md:py-1 text-lg md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ›
                </button>
              </div>
            )}
            <h1 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{headerLabel}</h1>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToday}
              className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
            >
              今天
            </button>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {VIEW_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={`px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                    view === value
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm font-medium'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <FilterBar lists={initialLists} tags={initialTags} filters={filters} onFilterChange={setFilters} />

        <div className="flex-1 overflow-auto p-4">
          {!viewReady && <p className="text-xs text-gray-400 dark:text-gray-500">載入中...</p>}
          {viewReady && view === 'month' && (
            <MonthView
              monthTasks={monthTasks}
              year={focusDate.getFullYear()}
              month={focusDate.getMonth()}
              focusDate={focusDate}
              onDateClick={handleDateClick}
              onDateDoubleClick={handleNewTaskFromDate}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              onMonthChange={handleMonthChange}
            />
          )}
          {viewReady && view === 'week' && (
            <WeekView
              weekTasks={weekTasks}
              weekStart={weekStart}
              focusDate={focusDate}
              onDateClick={handleDateClick}
              onTaskClick={handleTaskClick}
              onTaskTimeUpdate={handleTaskTimeUpdate}
              onNewTask={handleNewTaskFromTime}
            />
          )}
          {viewReady && view === 'day' && (
            <DayView
              dayTasks={dayTasks}
              focusDate={focusDate}
              onTaskClick={handleTaskClick}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onToday={handleToday}
              onTaskTimeUpdate={handleTaskTimeUpdate}
              onNewTask={handleNewTaskFromTime}
            />
          )}
          {isLoading && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">載入中...</p>}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          lists={initialLists}
          allTags={initialTags}
          onClose={handleModalClose}
          onUpdate={() => refreshCurrentView(focusDate, filters)}
          variant="modal"
        />
      )}

      {newTaskDraft && (
        <NewTaskModal
          initialDate={newTaskDraft.date}
          initialDueTime={newTaskDraft.dueTime}
          initialEndTime={newTaskDraft.endTime}
          lists={initialLists}
          onClose={handleNewTaskModalClose}
          onCreated={handleNewTaskCreated}
        />
      )}
    </div>
  )
}
