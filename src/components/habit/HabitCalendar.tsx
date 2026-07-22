'use client'

import { Habit } from '@prisma/client'
import { getMonthDays, dateToString, isSameDay, getWeekNumber } from '@/lib/calendarHelpers'
import { isScheduledOn } from '@/lib/habitSchedule'

interface HabitCalendarProps {
  habit: Habit
  logs: { date: string }[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
  onToggleDate: (dateStr: string) => void
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default function HabitCalendar({
  habit,
  logs,
  year,
  month,
  onMonthChange,
  onToggleDate,
}: HabitCalendarProps) {
  const weeks = getMonthDays(year, month)
  const logDates = new Set(logs.map((l) => l.date))
  const today = new Date()
  const todayStr = dateToString(today)

  const handlePrevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }

  const handleNextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ‹
        </button>
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {year} 年 {month + 1} 月
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-1.5 text-center text-xs font-medium text-gray-400 dark:text-gray-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div>
        {weeks.map((week) => (
          <div key={`week-${getWeekNumber(week[0])}`} className="grid grid-cols-7">
            {week.map((date) => {
              const dateStr = dateToString(date)
              const isCurrentMonth = date.getMonth() === month
              const isToday = isSameDay(date, today)
              const scheduled = isCurrentMonth && isScheduledOn(habit, dateStr)
              const completed = logDates.has(dateStr)
              const isFuture = dateStr > todayStr
              const clickable = scheduled && !isFuture

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onToggleDate(dateStr)}
                  className={`aspect-square flex items-center justify-center text-xs m-0.5 rounded-lg transition-colors ${
                    !isCurrentMonth
                      ? 'text-gray-200 dark:text-gray-700'
                      : !scheduled
                        ? 'text-gray-300 dark:text-gray-600'
                        : completed
                          ? 'bg-green-500 text-white cursor-pointer'
                          : isFuture
                            ? 'text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700'
                            : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                  } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
