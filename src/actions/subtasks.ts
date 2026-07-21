'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

async function assertTaskOwnership(taskId: number, userId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.userId !== userId) {
    throw new Error('任務不存在或無權限')
  }
}

export async function createSubtask(taskId: number, title: string) {
  try {
    const user = await requireAuth()

    if (!title || title.trim().length === 0) {
      return { success: false, error: '子任務標題不可為空' }
    }

    await assertTaskOwnership(taskId, user.id)

    const last = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { sortOrder: 'desc' },
    })

    const subtask = await prisma.subtask.create({
      data: {
        taskId,
        title: title.trim(),
        sortOrder: last ? last.sortOrder + 1 : 0,
      },
    })

    return { success: true, data: subtask }
  } catch (error) {
    console.error('建立子任務錯誤:', error)
    return { success: false, error: '建立子任務失敗' }
  }
}

export async function updateSubtask(
  id: number,
  data: { title?: string; completed?: boolean }
) {
  try {
    const user = await requireAuth()

    const subtask = await prisma.subtask.findUnique({ where: { id } })
    if (!subtask) {
      return { success: false, error: '子任務不存在' }
    }
    await assertTaskOwnership(subtask.taskId, user.id)

    const updated = await prisma.subtask.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        completed: data.completed,
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('編輯子任務錯誤:', error)
    return { success: false, error: '編輯子任務失敗' }
  }
}

export async function deleteSubtask(id: number) {
  try {
    const user = await requireAuth()

    const subtask = await prisma.subtask.findUnique({ where: { id } })
    if (!subtask) {
      return { success: false, error: '子任務不存在' }
    }
    await assertTaskOwnership(subtask.taskId, user.id)

    await prisma.subtask.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    console.error('刪除子任務錯誤:', error)
    return { success: false, error: '刪除子任務失敗' }
  }
}
