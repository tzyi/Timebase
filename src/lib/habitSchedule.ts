import { dateToString } from './calendarHelpers'

export interface HabitScheduleInfo {
  frequencyType: string
  weekDays: string
  monthDays: string
}

export interface HabitWithId extends HabitScheduleInfo {
  id: number
}

export interface HabitLogInfo {
  date: string
}

export interface HabitLogWithHabitId {
  habitId: number
  date: string
}

function parseDayList(value: string): number[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n))
}

/** 依 frequencyType/weekDays/monthDays 判斷某天是否為該習慣的排程日；parse 失敗時容錯回傳 false。 */
export function isScheduledOn(habit: HabitScheduleInfo, dateStr: string): boolean {
  try {
    const date = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(date.getTime())) return false

    switch (habit.frequencyType) {
      case 'daily':
        return true
      case 'weekly': {
        const days = parseDayList(habit.weekDays)
        const isoWeekday = date.getDay() === 0 ? 7 : date.getDay() // 1=一...7=日
        return days.includes(isoWeekday)
      }
      case 'monthly': {
        const days = parseDayList(habit.monthDays)
        return days.includes(date.getDate())
      }
      default:
        return false
    }
  } catch {
    return false
  }
}

const MAX_STREAK_LOOKBACK_DAYS = 3660

/** 從今天往回數排程日，遇到排程但未完成的日子中斷；非排程日直接跳過，不查也不打斷。 */
export function calculateStreak(
  habit: HabitScheduleInfo,
  logs: HabitLogInfo[],
  todayStr: string
): number {
  const cursor = new Date(`${todayStr}T00:00:00`)
  if (Number.isNaN(cursor.getTime())) return 0

  const logDates = new Set(logs.map((l) => l.date))
  let streak = 0

  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const dateStr = dateToString(cursor)
    if (isScheduledOn(habit, dateStr)) {
      if (logDates.has(dateStr)) {
        streak++
      } else {
        break
      }
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/** 該月已打卡排程日數、該月排程日總數與完成率（以排程日為分母，非整月天數）。month 為 0-indexed。 */
export function calculateMonthStats(
  habit: HabitScheduleInfo,
  logs: HabitLogInfo[],
  year: number,
  month: number
): { checkedDays: number; scheduledDays: number; rate: number } {
  const logDates = new Set(logs.map((l) => l.date))
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let scheduledDays = 0
  let checkedDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = dateToString(new Date(year, month, day))
    if (isScheduledOn(habit, dateStr)) {
      scheduledDays++
      if (logDates.has(dateStr)) checkedDays++
    }
  }

  const rate = scheduledDays > 0 ? checkedDays / scheduledDays : 0
  return { checkedDays, scheduledDays, rate }
}

/** 全部歷史打卡記錄數（總打卡）。 */
export function calculateTotalCheckins(logs: HabitLogInfo[]): number {
  return logs.length
}

/** 判斷某天所有排程中的習慣是否全部完成；當天沒有任何排程習慣時視為未完成（無事可完成）。 */
export function isDayFullyCompleted(
  habits: HabitWithId[],
  logs: HabitLogWithHabitId[],
  dateStr: string
): boolean {
  const scheduledHabits = habits.filter((h) => isScheduledOn(h, dateStr))
  if (scheduledHabits.length === 0) return false

  const completedHabitIds = new Set(
    logs.filter((l) => l.date === dateStr).map((l) => l.habitId)
  )

  return scheduledHabits.every((h) => completedHabitIds.has(h.id))
}
