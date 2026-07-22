'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

async function assertHabitOwnership(habitId: number, userId: number) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } })
  return !!habit && habit.userId === userId
}

export async function toggleHabitLog(habitId: number, dateStr: string) {
  try {
    const user = await requireAuth()

    if (!(await assertHabitOwnership(habitId, user.id))) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    const existing = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId, date: dateStr } },
    })

    if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } })
      return { success: true, data: { completed: false } }
    }

    await prisma.habitLog.create({
      data: { habitId, date: dateStr, completed: true },
    })

    return { success: true, data: { completed: true } }
  } catch (error) {
    console.error('切換習慣打勾錯誤:', error)
    return { success: false, error: '切換習慣打勾失敗' }
  }
}

export async function getHabitLogsInRange(
  habitId: number,
  fromDateStr: string,
  toDateStr: string
) {
  try {
    const user = await requireAuth()

    if (!(await assertHabitOwnership(habitId, user.id))) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    const logs = await prisma.habitLog.findMany({
      where: { habitId, date: { gte: fromDateStr, lte: toDateStr } },
      orderBy: { date: 'asc' },
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error('查詢習慣打卡紀錄錯誤:', error)
    return { success: false, error: '查詢習慣打卡紀錄失敗' }
  }
}

export async function getLogsForHabitsOnDate(habitIds: number[], dateStr: string) {
  try {
    const user = await requireAuth()

    if (habitIds.length === 0) {
      return { success: true, data: [] }
    }

    const habits = await prisma.habit.findMany({ where: { id: { in: habitIds } } })
    if (habits.some((h: { userId: number }) => h.userId !== user.id)) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    const logs = await prisma.habitLog.findMany({
      where: { habitId: { in: habitIds }, date: dateStr },
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error('查詢當日習慣打卡紀錄錯誤:', error)
    return { success: false, error: '查詢當日習慣打卡紀錄失敗' }
  }
}
