'use client'

import { useState } from 'react'
import { getMonthDays, dateToString, isSameDay, isWeekend } from '@/lib/calendarHelpers'
import { TaskWithRelations } from './types'

interface MonthViewProps {
  monthTasks: { [date: string]: TaskWithRelations[] }
  year: number
  month: number
  focusDate: Date
  onDateClick: (date: Date) => void
  onTaskClick: (taskId: number) => void
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MAX_VISIBLE_TASKS = 4

const PRIORITY_COLOR: { [key: string]: string } = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#fbbf24',
  none: '#9ca3af',
}

export default function MonthView({
  monthTasks,
  year,
  month,
  focusDate,
  onDateClick,
  onTaskClick,
}: MonthViewProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const weeks = getMonthDays(year, month)
  const today = new Date()

  const handleMoreClick = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation()
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`px-2 py-2 text-center text-xs font-medium ${
              i === 0 || i === 6 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flatMap((week) =>
          week.map((date) => {
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
                className={`relative min-h-[110px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors ${
                  isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isFocused ? 'ring-2 ring-inset ring-blue-400' : ''}`}
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
                    {visibleTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task.id)
                        }}
                        className={`w-full flex items-center gap-1 px-1 py-0.5 rounded text-left text-xs truncate ${
                          task.status === 'done'
                            ? 'text-gray-400 line-through bg-gray-50'
                            : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.none }}
                        />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}

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
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          onTaskClick(task.id)
                          setExpandedDate(null)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                          task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.none }}
                        />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
