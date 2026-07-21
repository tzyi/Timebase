'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

export async function createList(name: string, color: string) {
  try {
    const user = await requireAuth()

    if (!name || name.trim().length === 0) {
      return { success: false, error: '清單名稱不可為空' }
    }

    const list = await prisma.list.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color,
      },
      include: {
        _count: { select: { tasks: { where: { status: 'todo' } } } },
      },
    })

    return { success: true, data: { ...list, uncompletedCount: list._count.tasks } }
  } catch (error) {
    console.error('建立清單錯誤:', error)
    return { success: false, error: '建立清單失敗' }
  }
}

export async function updateList(
  id: number,
  data: { name?: string; color?: string }
) {
  try {
    const user = await requireAuth()

    const list = await prisma.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return { success: false, error: '清單不存在或無權限' }
    }

    const updated = await prisma.list.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        color: data.color,
      },
      include: {
        _count: { select: { tasks: { where: { status: 'todo' } } } },
      },
    })

    return { success: true, data: { ...updated, uncompletedCount: updated._count.tasks } }
  } catch (error) {
    console.error('編輯清單錯誤:', error)
    return { success: false, error: '編輯清單失敗' }
  }
}

export async function deleteList(id: number) {
  try {
    const user = await requireAuth()

    const list = await prisma.list.findUnique({ where: { id } })
    if (!list || list.userId !== user.id) {
      return { success: false, error: '清單不存在或無權限' }
    }

    await prisma.task.updateMany({
      where: { listId: id },
      data: { listId: null },
    })

    await prisma.list.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    console.error('刪除清單錯誤:', error)
    return { success: false, error: '刪除清單失敗' }
  }
}

export async function getLists() {
  try {
    const user = await requireAuth()

    const lists = await prisma.list.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tasks: { where: { status: 'todo' } } } },
      },
    })

    return {
      success: true,
      data: lists.map((list) => ({
        ...list,
        uncompletedCount: list._count.tasks,
      })),
    }
  } catch (error) {
    console.error('查詢清單錯誤:', error)
    return { success: false, error: '查詢清單失敗' }
  }
}
