'use client'

import { dateToString, isSameDay, getDayName } from '@/lib/calendarHelpers'

interface WeekStripProps {
  weekDays: Date[]
  focusDate: Date
  completion: { [date: string]: boolean }
  onSelectDate: (date: Date) => void
}

export default function WeekStrip({ weekDays, focusDate, completion, onSelectDate }: WeekStripProps) {
  const today = new Date()

  return (
    <div className="flex justify-between gap-1 px-3 py-3 border-b border-gray-200 dark:border-gray-800">
      {weekDays.map((date) => {
        const dateStr = dateToString(date)
        const isFocused = isSameDay(date, focusDate)
        const isToday = isSameDay(date, today)
        const isDone = !!completion[dateStr]

        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onSelectDate(date)}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span
              className={`text-[10px] font-medium ${
                isToday ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {getDayName(date)}
            </span>
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                isDone
                  ? 'bg-green-500 text-white'
                  : isFocused
                    ? 'ring-2 ring-blue-400 text-gray-700 dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isDone ? '✓' : date.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
