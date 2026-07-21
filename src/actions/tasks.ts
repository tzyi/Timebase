'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'
import { getTodayRange, getNext7DaysEnd, toDateInputValue } from '@/lib/date'
import { sortDayTasks } from '@/lib/taskTimeClassification'

export type TaskView =
  | 'today'
  | 'next7days'
  | 'inbox'
  | 'completed'
  | { kind: 'list'; listId: number }
  | { kind: 'tag'; tagId: number }

export async function createTask(
  title: string,
  listId?: number | null,
  note?: string,
  dueDate?: Date,
  priority?: string,
  dueTime?: string | null,
  endTime?: string | null,
  allDay?: boolean
) {
  try {
    const user = await requireAuth()

    if (!title || title.trim().length === 0) {
      return { success: false, error: '任務標題不可為空' }
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        note: note || '',
        dueDate: dueDate || null,
        priority: priority || 'none',
        listId: listId || null,
        dueTime: dueTime || null,
        endTime: endTime || null,
        allDay: allDay ?? false,
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: task }
  } catch (error) {
    console.error('建立任務錯誤:', error)
    return { success: false, error: '建立任務失敗' }
  }
}

export async function moveTaskToGroup(
  taskId: number,
  groupId: number | null,
  targetIndex: number
) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    if (groupId !== null) {
      const group = await prisma.taskGroup.findUnique({ where: { id: groupId } })
      if (!group || group.listId !== task.listId) {
        return { success: false, error: '分組不存在或不屬於此清單' }
      }
    }

    const siblings = await prisma.task.findMany({
      where: {
        listId: task.listId,
        groupId,
        id: { not: taskId },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const clampedIndex = Math.max(0, Math.min(targetIndex, siblings.length))
    const reordered = [
      ...siblings.slice(0, clampedIndex),
      task,
      ...siblings.slice(clampedIndex),
    ]

    await prisma.$transaction(
      reordered.map((t, index) =>
        prisma.task.update({
          where: { id: t.id },
          data: { groupId, sortOrder: index },
        })
      )
    )

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('移動任務分組錯誤:', error)
    return { success: false, error: '移動任務分組失敗' }
  }
}

export async function updateTask(
  id: number,
  data: {
    title?: string
    note?: string
    dueDate?: Date | null
    dueTime?: string | null
    endTime?: string | null
    allDay?: boolean
    priority?: string
    listId?: number | null
  }
) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        note: data.note !== undefined ? data.note : undefined,
        dueDate: data.dueDate !== undefined ? data.dueDate : undefined,
        dueTime: data.dueTime !== undefined ? data.dueTime : undefined,
        endTime: data.endTime !== undefined ? data.endTime : undefined,
        allDay: data.allDay !== undefined ? data.allDay : undefined,
        priority: data.priority,
        listId: data.listId !== undefined ? data.listId : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('編輯任務錯誤:', error)
    return { success: false, error: '編輯任務失敗' }
  }
}

export async function deleteTask(id: number) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    await prisma.task.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    console.error('刪除任務錯誤:', error)
    return { success: false, error: '刪除任務失敗' }
  }
}

export async function toggleTaskComplete(id: number, completed: boolean) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: completed ? 'done' : 'todo',
        completedAt: completed ? new Date() : null,
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('更新任務狀態錯誤:', error)
    return { success: false, error: '更新任務狀態失敗' }
  }
}

export async function postponeTask(id: number) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    const today = getTodayRange().start

    const updated = await prisma.task.update({
      where: { id },
      data: {
        dueDate: today,
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('順延任務錯誤:', error)
    return { success: false, error: '順延任務失敗' }
  }
}

async function buildTaskQuery(userId: number, view: TaskView) {
  const { start: today, end: todayEnd } = getTodayRange()
  const next7DaysEnd = getNext7DaysEnd()

  if (typeof view === 'string') {
    switch (view) {
      case 'today':
        return {
          userId,
          status: 'todo',
          dueDate: { gte: today, lte: todayEnd },
        }
      case 'next7days':
        return {
          userId,
          status: 'todo',
          dueDate: { gte: today, lte: next7DaysEnd },
        }
      case 'inbox':
        return {
          userId,
          status: 'todo',
          listId: null,
        }
      case 'completed':
        return {
          userId,
          status: 'done',
        }
    }
  }

  switch (view.kind) {
    case 'list':
      return {
        userId,
        listId: view.listId,
      }
    case 'tag':
      return {
        userId,
        tags: {
          some: {
            tagId: view.tagId,
          },
        },
      }
  }
}

export async function getTasksForView(view: TaskView) {
  try {
    const user = await requireAuth()

    const where = await buildTaskQuery(user.id, view)

    const tasks = await prisma.task.findMany({
      where,
      orderBy:
        view === 'next7days'
          ? [{ dueDate: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]
          : [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: tasks }
  } catch (error) {
    console.error('查詢任務錯誤:', error)
    return { success: false, error: '查詢任務失敗' }
  }
}

export async function getTodayViewGrouped() {
  try {
    const user = await requireAuth()
    const { start: today, end: todayEnd } = getTodayRange()

    const [overdue, todayTasks] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: 'todo',
          dueDate: { lt: today },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          tags: { include: { tag: true } },
          list: true,
          subtasks: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: 'todo',
          dueDate: { gte: today, lte: todayEnd },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          tags: { include: { tag: true } },
          list: true,
          subtasks: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    ])

    return { success: true, data: { overdue, today: sortDayTasks(todayTasks) } }
  } catch (error) {
    console.error('查詢今天視圖錯誤:', error)
    return { success: false, error: '查詢今天視圖失敗' }
  }
}

export interface CalendarFilters {
  listIds?: number[]
  tagIds?: number[]
  priorities?: string[]
}

export async function getMonthTasks(
  year: number,
  month: number,
  filters?: CalendarFilters
) {
  try {
    const user = await requireAuth()

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    const where: any = {
      userId: user.id,
      dueDate: { gte: startDate, lte: endDate },
    }

    if (filters?.listIds && filters.listIds.length > 0) {
      where.listId = { in: filters.listIds }
    }

    if (filters?.priorities && filters.priorities.length > 0) {
      where.priority = { in: filters.priorities }
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      where.tags = { some: { tagId: { in: filters.tagIds } } }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    const grouped = new Map<string, any[]>()
    tasks.forEach((task) => {
      const dateStr = task.dueDate ? toDateInputValue(task.dueDate) : ''
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, [])
      }
      grouped.get(dateStr)!.push(task)
    })

    const result: { [key: string]: any[] } = {}
    grouped.forEach((tasks, dateStr) => {
      result[dateStr] = tasks.sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2, none: 3 }
        return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
      })
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('查詢月份任務錯誤:', error)
    return { success: false, error: '查詢月份任務失敗' }
  }
}

export async function getWeekTasks(
  startDate: Date,
  filters?: CalendarFilters
) {
  try {
    const user = await requireAuth()

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    const where: any = {
      userId: user.id,
      dueDate: { gte: startDate, lt: endDate },
    }

    if (filters?.listIds && filters.listIds.length > 0) {
      where.listId = { in: filters.listIds }
    }

    if (filters?.priorities && filters.priorities.length > 0) {
      where.priority = { in: filters.priorities }
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      where.tags = { some: { tagId: { in: filters.tagIds } } }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    const grouped = new Map<string, any[]>()
    tasks.forEach((task) => {
      const dateStr = task.dueDate ? toDateInputValue(task.dueDate) : ''
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, [])
      }
      grouped.get(dateStr)!.push(task)
    })

    const result: { [key: string]: any[] } = {}
    grouped.forEach((tasks, dateStr) => {
      result[dateStr] = tasks
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('查詢週任務錯誤:', error)
    return { success: false, error: '查詢週任務失敗' }
  }
}

export async function getDayTasks(
  date: Date,
  filters?: CalendarFilters
) {
  try {
    const user = await requireAuth()

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const where: any = {
      userId: user.id,
      dueDate: { gte: dayStart, lte: dayEnd },
    }

    if (filters?.listIds && filters.listIds.length > 0) {
      where.listId = { in: filters.listIds }
    }

    if (filters?.priorities && filters.priorities.length > 0) {
      where.priority = { in: filters.priorities }
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      where.tags = { some: { tagId: { in: filters.tagIds } } }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: { include: { tag: true } },
        list: true,
        subtasks: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return { success: true, data: tasks }
  } catch (error) {
    console.error('查詢日任務錯誤:', error)
    return { success: false, error: '查詢日任務失敗' }
  }
}
