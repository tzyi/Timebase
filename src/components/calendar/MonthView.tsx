'use client'

import { useState } from 'react'
import { getMonthDays, dateToString, isSameDay, isWeekend, getTaskBackgroundColor, getTaskTextColor, getWeekNumber } from '@/lib/calendarHelpers'
import { TaskWithRelations } from './types'

interface MonthViewProps {
  monthTasks: { [date: string]: TaskWithRelations[] }
  year: number
  month: number
  focusDate: Date
  onDateClick: (date: Date) => void
  onTaskClick: (taskId: number) => void
  onTaskUpdate?: (taskId: number, newDate: string) => Promise<boolean>
  onMonthChange?: (year: number, month: number) => void
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const MAX_VISIBLE_TASKS = 4

export default function MonthView({
  monthTasks,
  year,
  month,
  focusDate,
  onDateClick,
  onTaskClick,
  onTaskUpdate,
  onMonthChange,
}: MonthViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null)
  const [lastWheelTime, setLastWheelTime] = useState<number>(0)
  const weeks = getMonthDays(year, month)
  const today = new Date()

  const handleMoreClick = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation()
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - lastWheelTime < 300) return

    setLastWheelTime(now)
    const newMonth = e.deltaY < 0 ? month - 1 : month + 1

    if (onMonthChange) {
      if (newMonth < 0) {
        onMonthChange(year - 1, 11)
      } else if (newMonth > 11) {
        onMonthChange(year + 1, 0)
      } else {
        onMonthChange(year, newMonth)
      }
    }
  }

  const handleTaskDragStart = (e: React.DragEvent, taskId: number, isCompleted: boolean) => {
    if (isCompleted) {
      e.preventDefault()
      return
    }
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDateDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDateDragEnter = (_e: React.DragEvent, dateStr: string) => {
    if (draggedTaskId !== null) {
      setDraggedOverDate(dateStr)
    }
  }

  const handleDateDragLeave = () => {
    setDraggedOverDate(null)
  }

  const handleDateDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    setDraggedOverDate(null)

    if (draggedTaskId === null) return

    if (onTaskUpdate) {
      const success = await onTaskUpdate(draggedTaskId, dateStr)
      if (!success) {
        console.error('Failed to update task')
      }
    }

    setDraggedTaskId(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm" onWheel={handleWheel}>
      <div className="flex">
        <div className="w-12 border-r border-gray-200 bg-gray-50">
          <div className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">週</div>
          {weeks.map((week) => (
            <div
              key={`weeknum-${getWeekNumber(week[0])}`}
              className="px-2 py-1.5 text-center text-xs font-medium text-gray-400 border-b border-gray-100 flex items-center justify-center min-h-[110px]"
            >
              {getWeekNumber(week[0])}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`px-2 py-2 text-center text-xs font-medium ${
                  i === 5 || i === 6 ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div>
            {weeks.map((week) => (
              <div key={`week-${getWeekNumber(week[0])}`} className="flex">
                <div className="flex-1 grid grid-cols-7">
                  {week.map((date) => {
                    const dateStr = dateToString(date)
                    const isCurrentMonth = date.getMonth() === month
                    const isToday = isSameDay(date, today)
                    const isFocused = isSameDay(date, focusDate)
                    const dayTasks = monthTasks[dateStr] || []
                    const visibleTasks = isCurrentMonth ? dayTasks.slice(0, MAX_VISIBLE_TASKS) : []
                    const hiddenCount = isCurrentMonth ? Math.max(dayTasks.length - MAX_VISIBLE_TASKS, 0) : 0
                    const isExpanded = expandedDate === dateStr

                    return (
                      <div
                        key={dateStr}
                        onClick={() => onDateClick(date)}
                        onDragOver={handleDateDragOver}
                        onDragEnter={(e) => handleDateDragEnter(e, dateStr)}
                        onDragLeave={handleDateDragLeave}
                        onDrop={(e) => handleDateDrop(e, dateStr)}
                        className={`relative min-h-[110px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                          isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                        } ${isFocused ? 'ring-2 ring-inset ring-blue-400' : ''} ${
                          draggedOverDate === dateStr ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''
                        }`}
                      >
                        <div className="flex justify-end">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                              isToday
                                ? 'bg-blue-500 text-white font-semibold'
                                : isCurrentMonth
                                  ? isWeekend(date)
                                    ? 'text-red-400'
                                    : 'text-gray-700'
                                  : 'text-gray-300'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        {isCurrentMonth && (
                          <div className="mt-1 space-y-0.5">
                            {visibleTasks.map((task) => {
                              const bgColor = getTaskBackgroundColor(task)
                              const textColor = getTaskTextColor(task)
                              const isCompleted = task.status === 'done' || !!task.completedAt
                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  draggable={!isCompleted}
                                  onDragStart={(e) => handleTaskDragStart(e, task.id, isCompleted)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskClick(task.id)
                                  }}
                                  className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left text-xs truncate transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                                    isCompleted ? 'line-through opacity-70 cursor-not-allowed' : 'cursor-grab'
                                  } ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                                >
                                  {isCompleted && <span className="shrink-0">✓</span>}
                                  <span className="truncate">{task.title}</span>
                                </button>
                              )
                            })}

                            {hiddenCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => handleMoreClick(e, dateStr)}
                                className="w-full text-left text-xs text-blue-500 hover:text-blue-600 px-1"
                              >
                                +{hiddenCount} 個更多
                              </button>
                            )}
                          </div>
                        )}

                        {isExpanded && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-full z-30 mt-1 w-56 max-h-72 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                          >
                            {dayTasks.map((task) => {
                              const bgColor = getTaskBackgroundColor(task)
                              const textColor = getTaskTextColor(task)
                              const isCompleted = task.status === 'done' || !!task.completedAt
                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  draggable={!isCompleted}
                                  onDragStart={(e) => handleTaskDragStart(e, task.id, isCompleted)}
                                  onClick={() => {
                                    onTaskClick(task.id)
                                    setExpandedDate(null)
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                                    isCompleted ? 'line-through opacity-70 cursor-not-allowed' : 'cursor-grab'
                                  } ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                                >
                                  {isCompleted && <span className="shrink-0">✓</span>}
                                  <span className="truncate">{task.title}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
