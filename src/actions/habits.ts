'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'
import { isScheduledOn } from '@/lib/habitSchedule'

export interface HabitInput {
  name: string
  description?: string
  emoji?: string
  color?: string
  frequencyType: string // 'daily' | 'weekly' | 'monthly'
  weekDays?: number[] // 1-7
  monthDays?: number[] // 1-31
}

function validateFrequency(input: {
  frequencyType: string
  weekDays?: number[]
  monthDays?: number[]
}): string | null {
  if (!['daily', 'weekly', 'monthly'].includes(input.frequencyType)) {
    return '頻率類型不正確'
  }

  if (input.frequencyType === 'weekly') {
    const days = input.weekDays ?? []
    if (days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
      return '每週頻率須選擇 1-7 之間的星期'
    }
  }

  if (input.frequencyType === 'monthly') {
    const days = input.monthDays ?? []
    if (days.length === 0 || days.some((d) => !Number.isInteger(d) || d < 1 || d > 31)) {
      return '每月頻率須選擇 1-31 之間的日期'
    }
  }

  return null
}

export async function getHabits(dateStr: string) {
  try {
    const user = await requireAuth()

    const habits = await prisma.habit.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { sortOrder: 'asc' },
      include: {
        logs: { where: { date: dateStr } },
      },
    })

    const scheduled = habits
      .filter((h: (typeof habits)[number]) => isScheduledOn(h, dateStr))
      .map((h: (typeof habits)[number]) => {
        const { logs, ...habit } = h
        return { ...habit, completedToday: logs.length > 0 }
      })

    return { success: true, data: scheduled }
  } catch (error) {
    console.error('查詢習慣清單錯誤:', error)
    return { success: false, error: '查詢習慣清單失敗' }
  }
}

export async function getHabitById(id: number) {
  try {
    const user = await requireAuth()

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.userId !== user.id) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    return { success: true, data: habit }
  } catch (error) {
    console.error('查詢習慣錯誤:', error)
    return { success: false, error: '查詢習慣失敗' }
  }
}

export async function getArchivedHabits() {
  try {
    const user = await requireAuth()

    const habits = await prisma.habit.findMany({
      where: { userId: user.id, archived: true },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, data: habits }
  } catch (error) {
    console.error('查詢封存習慣錯誤:', error)
    return { success: false, error: '查詢封存習慣失敗' }
  }
}

export async function createHabit(input: HabitInput) {
  try {
    const user = await requireAuth()

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: '習慣名稱不可為空' }
    }

    const validationError = validateFrequency(input)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const maxOrder = await prisma.habit.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    })

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        description: input.description ?? '',
        emoji: input.emoji || '✅',
        color: input.color || 'blue',
        frequencyType: input.frequencyType,
        weekDays: (input.weekDays ?? []).join(','),
        monthDays: (input.monthDays ?? []).join(','),
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return { success: true, data: habit }
  } catch (error) {
    console.error('建立習慣錯誤:', error)
    return { success: false, error: '建立習慣失敗' }
  }
}

export async function updateHabit(id: number, input: Partial<HabitInput>) {
  try {
    const user = await requireAuth()

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.userId !== user.id) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    if (input.frequencyType !== undefined) {
      const validationError = validateFrequency({
        frequencyType: input.frequencyType,
        weekDays: input.weekDays,
        monthDays: input.monthDays,
      })
      if (validationError) {
        return { success: false, error: validationError }
      }
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        description: input.description,
        emoji: input.emoji,
        color: input.color,
        frequencyType: input.frequencyType,
        weekDays: input.weekDays !== undefined ? input.weekDays.join(',') : undefined,
        monthDays: input.monthDays !== undefined ? input.monthDays.join(',') : undefined,
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('編輯習慣錯誤:', error)
    return { success: false, error: '編輯習慣失敗' }
  }
}

export async function archiveHabit(id: number) {
  try {
    const user = await requireAuth()

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.userId !== user.id) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    const updated = await prisma.habit.update({ where: { id }, data: { archived: true } })
    return { success: true, data: updated }
  } catch (error) {
    console.error('封存習慣錯誤:', error)
    return { success: false, error: '封存習慣失敗' }
  }
}

export async function unarchiveHabit(id: number) {
  try {
    const user = await requireAuth()

    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit || habit.userId !== user.id) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    const updated = await prisma.habit.update({ where: { id }, data: { archived: false } })
    return { success: true, data: updated }
  } catch (error) {
    console.error('解除封存習慣錯誤:', error)
    return { success: false, error: '解除封存習慣失敗' }
  }
}

export async function reorderHabits(orderedIds: number[]) {
  try {
    const user = await requireAuth()

    const habits = await prisma.habit.findMany({ where: { id: { in: orderedIds } } })
    if (
      habits.length !== orderedIds.length ||
      habits.some((h: (typeof habits)[number]) => h.userId !== user.id)
    ) {
      return { success: false, error: '習慣不存在或無權限' }
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.habit.update({ where: { id }, data: { sortOrder: index } })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('排序習慣錯誤:', error)
    return { success: false, error: '排序習慣失敗' }
  }
}
