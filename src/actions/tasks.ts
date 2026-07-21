'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'
import { getTodayRange, getNext7DaysEnd } from '@/lib/date'

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
  priority?: string
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
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
      },
    })

    return { success: true, data: task }
  } catch (error) {
    console.error('建立任務錯誤:', error)
    return { success: false, error: '建立任務失敗' }
  }
}

export async function updateTask(
  id: number,
  data: {
    title?: string
    note?: string
    dueDate?: Date | null
    dueTime?: string | null
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
        priority: data.priority,
        listId: data.listId !== undefined ? data.listId : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        list: true,
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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        tags: { include: { tag: true } },
        list: true,
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
        },
      }),
    ])

    return { success: true, data: { overdue, today: todayTasks } }
  } catch (error) {
    console.error('查詢今天視圖錯誤:', error)
    return { success: false, error: '查詢今天視圖失敗' }
  }
}
