'use client'

import { useEffect, useRef, useState } from 'react'
import {
  isSameDay,
  getTaskBackgroundColor,
  getTaskTextColor,
  formatTime,
  formatDate,
  dateToString,
  timeToMinutes,
  minutesToTime,
} from '@/lib/calendarHelpers'
import { classifyTaskTime, TaskTimeType } from '@/lib/taskTimeClassification'
import { calculateTaskLayout } from '@/lib/taskLayout'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { TaskWithRelations } from './types'

interface DayViewProps {
  /** 焦點日期當天的任務，來自 `getDayTasks(focusDate, filters)` */
  dayTasks: TaskWithRelations[]
  focusDate: Date
  onTaskClick: (taskId: number) => void
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
  onTaskTimeUpdate?: (
    taskId: number,
    dateStr: string,
    newDueTime: string,
    newEndTime: string
  ) => Promise<boolean>
  onNewTask?: (date: Date, dueTime: string, endTime: string) => void
}

const HOUR_HEIGHT = 60
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SNAP_MINUTES = 15
const MIN_DURATION = 15
const DAY_MINUTES = 24 * 60

export default function DayView({
  dayTasks,
  focusDate,
  onTaskClick,
  onPrevDay,
  onNextDay,
  onToday,
  onTaskTimeUpdate,
  onNewTask,
}: DayViewProps) {
  const today = new Date()
  const isToday = isSameDay(focusDate, today)
  const now = useCurrentTime()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const untimedTasks = dayTasks.filter((t) => classifyTaskTime(t as any) !== TaskTimeType.TIMED)
  const timedTasks = dayTasks.filter((t) => classifyTaskTime(t as any) === TaskTimeType.TIMED)
  const layouts = calculateTaskLayout(timedTasks as any)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [dragDuration, setDragDuration] = useState<number>(MIN_DURATION)
  const [dragOverMinutes, setDragOverMinutes] = useState<number | null>(null)

  // 手機觸控拖曳用的 ref：避免在 touchmove/touchend 的原生事件監聽器中讀到過期的 state。
  const columnRef = useRef<HTMLDivElement>(null)
  const dragDurationRef = useRef(MIN_DURATION)
  const dragOverMinutesRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchDraggingRef = useRef(false)

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const computeSnappedMinutes = (clientY: number, duration: number) => {
    if (!columnRef.current) return null
    const rect = columnRef.current.getBoundingClientRect()
    const offsetY = clientY - rect.top
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
    const maxStart = Math.max(DAY_MINUTES - duration, 0)
    return Math.min(Math.max(snapped, 0), maxStart)
  }

  const handleTaskDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    const isCompleted = task.status === 'done' || !!task.completedAt
    if (isCompleted) {
      e.preventDefault()
      return
    }
    const start = timeToMinutes(task.dueTime || '00:00')
    const end = timeToMinutes(task.endTime || '00:00')
    const duration = Math.max(end - start, MIN_DURATION)
    setDraggedTaskId(task.id)
    setDragDuration(duration)
    dragDurationRef.current = duration
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverMinutes(null)
    dragOverMinutesRef.current = null
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    if (draggedTaskId === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const minutes = computeSnappedMinutes(e.clientY, dragDuration)
    if (minutes === null) return
    setDragOverMinutes(minutes)
    dragOverMinutesRef.current = minutes
  }

  const commitDrop = async (taskId: number, startMinutes: number, duration: number) => {
    const newDueTime = minutesToTime(startMinutes)
    const newEndTime = minutesToTime(Math.min(startMinutes + duration, DAY_MINUTES))

    if (onTaskTimeUpdate) {
      const success = await onTaskTimeUpdate(taskId, dateToString(focusDate), newDueTime, newEndTime)
      if (!success) {
        console.error('Failed to update task time')
      }
    }
  }

  const handleColumnDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const taskId = draggedTaskId
    const startMinutes = dragOverMinutes
    setDraggedTaskId(null)
    setDragOverMinutes(null)
    dragOverMinutesRef.current = null

    if (taskId === null || startMinutes === null) return
    await commitDrop(taskId, startMinutes, dragDuration)
  }

  // 手機版：長按 250ms 進入拖曳模式，避免與捲動、單擊手勢衝突。
  const handleTaskTouchStart = (e: React.TouchEvent, task: TaskWithRelations) => {
    const isCompleted = task.status === 'done' || !!task.completedAt
    if (isCompleted) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      const start = timeToMinutes(task.dueTime || '00:00')
      const end = timeToMinutes(task.endTime || '00:00')
      const duration = Math.max(end - start, MIN_DURATION)
      isTouchDraggingRef.current = true
      dragDurationRef.current = duration
      setDragDuration(duration)
      setDraggedTaskId(task.id)
    }, 250)
  }

  const handleTaskTouchMove = (e: React.TouchEvent) => {
    if (isTouchDraggingRef.current || !touchStartRef.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    if (dx > 8 || dy > 8) clearLongPressTimer()
  }

  const handleTaskTouchEnd = () => {
    clearLongPressTimer()
    touchStartRef.current = null
  }

  useEffect(() => {
    if (draggedTaskId === null) return

    const handleMove = (e: TouchEvent) => {
      if (!isTouchDraggingRef.current) return
      e.preventDefault()
      const touch = e.touches[0]
      const minutes = computeSnappedMinutes(touch.clientY, dragDurationRef.current)
      if (minutes === null) return
      dragOverMinutesRef.current = minutes
      setDragOverMinutes(minutes)
    }

    const handleEnd = () => {
      if (!isTouchDraggingRef.current) return
      isTouchDraggingRef.current = false
      const taskId = draggedTaskId
      const startMinutes = dragOverMinutesRef.current
      const duration = dragDurationRef.current
      setDraggedTaskId(null)
      setDragOverMinutes(null)
      dragOverMinutesRef.current = null
      if (startMinutes === null) return
      void commitDrop(taskId, startMinutes, duration)
    }

    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('touchcancel', handleEnd)
    return () => {
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedTaskId])

  const handleColumnDoubleClick = (e: React.MouseEvent) => {
    if (!onNewTask) return
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
    const startMinutes = Math.min(Math.max(snapped, 0), DAY_MINUTES - MIN_DURATION)
    const endMinutes = Math.min(startMinutes + 60, DAY_MINUTES)
    onNewTask(focusDate, minutesToTime(startMinutes), minutesToTime(endMinutes))
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="上一天"
            className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ‹ 上一天
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="下一天"
            className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            下一天 ›
          </button>
        </div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(focusDate)}</h2>
        <button
          type="button"
          onClick={onToday}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            isToday ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          今天
        </button>
      </div>

      {untimedTasks.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-800 p-2 space-y-1">
          {untimedTasks.map((task) => {
            const bgColor = getTaskBackgroundColor(task)
            const textColor = getTaskTextColor(task)
            const isCompleted = task.status === 'done' || !!task.completedAt
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick(task.id)}
                className={`w-full text-left text-sm truncate px-2 py-1 rounded transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                  isCompleted ? 'line-through opacity-70' : ''
                }`}
              >
                {isCompleted && '✓ '}
                {task.title}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-14 shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="text-[10px] text-gray-400 dark:text-gray-500 text-right pr-1 -translate-y-2"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div
            ref={columnRef}
            className="flex-1 relative border-l border-gray-100 dark:border-gray-800"
            style={{ height: HOUR_HEIGHT * 24 }}
            onDragOver={handleColumnDragOver}
            onDrop={handleColumnDrop}
            onDoubleClick={handleColumnDoubleClick}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-50 dark:border-gray-800"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
            {layouts.map((layout) => {
              const task = timedTasks.find((t) => t.id === layout.taskId)
              if (!task) return null
              const bgColor = getTaskBackgroundColor(task)
              const textColor = getTaskTextColor(task)
              const isCompleted = task.status === 'done' || !!task.completedAt
              return (
                <button
                  key={task.id}
                  type="button"
                  draggable={!isCompleted}
                  onDragStart={(e) => handleTaskDragStart(e, task)}
                  onDragEnd={handleTaskDragEnd}
                  onTouchStart={(e) => handleTaskTouchStart(e, task)}
                  onTouchMove={handleTaskTouchMove}
                  onTouchEnd={handleTaskTouchEnd}
                  onClick={() => onTaskClick(task.id)}
                  style={{
                    position: 'absolute',
                    top: layout.top,
                    height: Math.max(layout.height, 24),
                    left: `${layout.left}%`,
                    width: `${100 / layout.columnCount}%`,
                    touchAction: 'manipulation',
                    WebkitTouchCallout: 'none',
                  }}
                  className={`overflow-hidden text-left text-xs px-2 py-1 rounded border border-black/5 transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                    isCompleted ? 'line-through opacity-70 cursor-not-allowed' : 'cursor-grab'
                  } ${draggedTaskId === task.id ? 'opacity-40' : ''}`}
                >
                  <div className="font-medium truncate">{task.title}</div>
                  {task.dueTime && task.endTime && (
                    <div className="text-[10px] opacity-75 truncate">
                      {formatTime(task.dueTime)}-{formatTime(task.endTime)}
                    </div>
                  )}
                </button>
              )
            })}
            {dragOverMinutes !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: dragOverMinutes }}
              >
                <div className="border-t-2 border-blue-500" />
                <span className="inline-block -translate-y-1/2 ml-1 text-[10px] text-white bg-blue-500 px-1 rounded shadow">
                  {minutesToTime(dragOverMinutes)}
                </span>
              </div>
            )}
            {isToday && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                style={{ top: currentMinutes }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-[3px] -translate-y-1/2" />
                <div className="flex-1 border-t border-red-500 -translate-y-1/2" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
