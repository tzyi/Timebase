'use client'

import { useState } from 'react'
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

  const handleTaskDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    const isCompleted = task.status === 'done' || !!task.completedAt
    if (isCompleted) {
      e.preventDefault()
      return
    }
    const start = timeToMinutes(task.dueTime || '00:00')
    const end = timeToMinutes(task.endTime || '00:00')
    setDraggedTaskId(task.id)
    setDragDuration(Math.max(end - start, MIN_DURATION))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverMinutes(null)
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    if (draggedTaskId === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
    const maxStart = Math.max(DAY_MINUTES - dragDuration, 0)
    setDragOverMinutes(Math.min(Math.max(snapped, 0), maxStart))
  }

  const handleColumnDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const taskId = draggedTaskId
    const startMinutes = dragOverMinutes
    setDraggedTaskId(null)
    setDragOverMinutes(null)

    if (taskId === null || startMinutes === null) return

    const newDueTime = minutesToTime(startMinutes)
    const newEndTime = minutesToTime(Math.min(startMinutes + dragDuration, DAY_MINUTES))

    if (onTaskTimeUpdate) {
      const success = await onTaskTimeUpdate(taskId, dateToString(focusDate), newDueTime, newEndTime)
      if (!success) {
        console.error('Failed to update task time')
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="上一天"
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            ‹ 上一天
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="下一天"
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
          >
            下一天 ›
          </button>
        </div>
        <h2 className="text-sm font-medium text-gray-900">{formatDate(focusDate)}</h2>
        <button
          type="button"
          onClick={onToday}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            isToday ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          今天
        </button>
      </div>

      {untimedTasks.length > 0 && (
        <div className="border-b border-gray-200 p-2 space-y-1">
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
                className="text-[10px] text-gray-400 text-right pr-1 -translate-y-2"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div
            className="flex-1 relative border-l border-gray-100"
            style={{ height: HOUR_HEIGHT * 24 }}
            onDragOver={handleColumnDragOver}
            onDrop={handleColumnDrop}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-50"
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
                  onClick={() => onTaskClick(task.id)}
                  style={{
                    position: 'absolute',
                    top: layout.top,
                    height: Math.max(layout.height, 24),
                    left: `${layout.left}%`,
                    width: `${100 / layout.columnCount}%`,
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
