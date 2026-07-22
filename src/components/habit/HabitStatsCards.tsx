'use client'

import { Habit } from '@prisma/client'
import { calculateMonthStats, calculateTotalCheckins, calculateStreak } from '@/lib/habitSchedule'
import { dateToString, getToday } from '@/lib/calendarHelpers'

interface HabitStatsCardsProps {
  habit: Habit
  logs: { date: string }[]
  year: number
  month: number
}

export default function HabitStatsCards({ habit, logs, year, month }: HabitStatsCardsProps) {
  const todayStr = dateToString(getToday())
  const monthStats = calculateMonthStats(habit, logs, year, month)
  const totalCheckins = calculateTotalCheckins(logs)
  const streak = calculateStreak(habit, logs, todayStr)

  const items = [
    { label: '本月打卡', value: `${monthStats.checkedDays} 天` },
    { label: '總打卡', value: `${totalCheckins} 天` },
    { label: '本月完成率', value: `${Math.round(monthStats.rate * 100)}%` },
    { label: '目前連續', value: `${streak} 天` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
