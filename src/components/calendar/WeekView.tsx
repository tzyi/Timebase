'use client'

import {
  getWeekDays,
  dateToString,
  isSameDay,
  isWeekend,
  getDayName,
  getTaskBackgroundColor,
  getTaskTextColor,
  formatTime,
} from '@/lib/calendarHelpers'
import { classifyTaskTime, TaskTimeType } from '@/lib/taskTimeClassification'
import { calculateTaskLayout } from '@/lib/taskLayout'
import { TaskWithRelations } from './types'

interface WeekViewProps {
  /** 依日期字串（YYYY-MM-DD）分組的任務，來自 `getWeekTasks()` */
  weekTasks: { [date: string]: TaskWithRelations[] }
  /** 週的起始日，必須是星期一（由 `getWeekDays(focusDate)[0]` 取得） */
  weekStart: Date
  focusDate: Date
  onDateClick: (date: Date) => void
  onTaskClick: (taskId: number) => void
}

const HOUR_HEIGHT = 60
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function WeekView({
  weekTasks,
  weekStart,
  focusDate,
  onDateClick,
  onTaskClick,
}: WeekViewProps) {
  const days = getWeekDays(weekStart)
  const today = new Date()

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col h-full">
      <div className="flex border-b border-gray-200">
        <div className="w-14 shrink-0" />
        <div className="flex-1 grid grid-cols-7">
          {days.map((date) => {
            const dateStr = dateToString(date)
            const isToday = isSameDay(date, today)
            const isFocused = isSameDay(date, focusDate)
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onDateClick(date)}
                className={`flex flex-col items-center py-2 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 transition-colors ${
                  isFocused ? 'bg-blue-50' : ''
                }`}
              >
                <span className={`text-xs ${isWeekend(date) ? 'text-red-400' : 'text-gray-500'}`}>
                  {getDayName(date)}
                </span>
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mt-0.5 ${
                    isToday ? 'bg-blue-500 text-white font-semibold' : 'text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <div className="w-14 shrink-0 flex items-center justify-center text-[10px] text-gray-400">
          全天
        </div>
        <div className="flex-1 grid grid-cols-7 min-h-[32px]">
          {days.map((date) => {
            const dateStr = dateToString(date)
            const dayTasks = weekTasks[dateStr] || []
            const untimedTasks = dayTasks.filter(
              (t) => classifyTaskTime(t as any) !== TaskTimeType.TIMED
            )
            return (
              <div
                key={dateStr}
                className="border-r border-gray-100 last:border-r-0 p-0.5 space-y-0.5"
              >
                {untimedTasks.map((task) => {
                  const bgColor = getTaskBackgroundColor(task)
                  const textColor = getTaskTextColor(task)
                  const isCompleted = task.status === 'done' || !!task.completedAt
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onTaskClick(task.id)}
                      className={`w-full text-left text-xs truncate px-1 py-0.5 rounded transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                        isCompleted ? 'line-through opacity-70' : ''
                      }`}
                    >
                      {isCompleted && '✓ '}
                      {task.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

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
          <div className="flex-1 grid grid-cols-7">
            {days.map((date) => {
              const dateStr = dateToString(date)
              const dayTasks = weekTasks[dateStr] || []
              const timedTasks = dayTasks.filter(
                (t) => classifyTaskTime(t as any) === TaskTimeType.TIMED
              )
              const layouts = calculateTaskLayout(timedTasks as any)

              return (
                <div
                  key={dateStr}
                  className="relative border-r border-gray-100 last:border-r-0"
                  style={{ height: HOUR_HEIGHT * 24 }}
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
                        onClick={() => onTaskClick(task.id)}
                        style={{
                          position: 'absolute',
                          top: layout.top,
                          height: Math.max(layout.height, 20),
                          left: `${layout.left}%`,
                          width: `${100 / layout.columnCount}%`,
                        }}
                        className={`overflow-hidden text-left text-[11px] px-1 py-0.5 rounded border border-black/5 transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                          isCompleted ? 'line-through opacity-70' : ''
                        }`}
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        {task.dueTime && (
                          <div className="text-[10px] opacity-75 truncate">
                            {formatTime(task.dueTime)}
                            {task.endTime ? `-${formatTime(task.endTime)}` : ''}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
