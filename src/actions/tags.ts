'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

export async function createTag(name: string, color: string) {
  try {
    const user = await requireAuth()

    if (!name || name.trim().length === 0) {
      return { success: false, error: '標籤名稱不可為空' }
    }

    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color,
      },
    })

    return { success: true, data: tag }
  } catch (error) {
    console.error('建立標籤錯誤:', error)
    return { success: false, error: '建立標籤失敗' }
  }
}

export async function updateTag(id: number, data: { name?: string; color?: string }) {
  try {
    const user = await requireAuth()

    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag || tag.userId !== user.id) {
      return { success: false, error: '標籤不存在或無權限' }
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        color: data.color,
      },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('編輯標籤錯誤:', error)
    return { success: false, error: '編輯標籤失敗' }
  }
}

export async function deleteTag(id: number) {
  try {
    const user = await requireAuth()

    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag || tag.userId !== user.id) {
      return { success: false, error: '標籤不存在或無權限' }
    }

    await prisma.tag.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    console.error('刪除標籤錯誤:', error)
    return { success: false, error: '刪除標籤失敗' }
  }
}

export async function getTags() {
  try {
    const user = await requireAuth()

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    })

    return {
      success: true,
      data: tags.map((tag) => ({
        ...tag,
        taskCount: tag._count.tasks,
      })),
    }
  } catch (error) {
    console.error('查詢標籤錯誤:', error)
    return { success: false, error: '查詢標籤失敗' }
  }
}

export async function assignTagToTask(taskId: number, tagId: number) {
  try {
    const user = await requireAuth()

    const [task, tag] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.tag.findUnique({ where: { id: tagId } }),
    ])

    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    if (!tag || tag.userId !== user.id) {
      return { success: false, error: '標籤不存在或無權限' }
    }

    await prisma.taskTag.create({
      data: { taskId, tagId },
    })

    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: '該標籤已指派給此任務' }
    }
    console.error('指派標籤錯誤:', error)
    return { success: false, error: '指派標籤失敗' }
  }
}

export async function removeTagFromTask(taskId: number, tagId: number) {
  try {
    const user = await requireAuth()

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      return { success: false, error: '任務不存在或無權限' }
    }

    await prisma.taskTag.delete({
      where: {
        taskId_tagId: { taskId, tagId },
      },
    })

    return { success: true }
  } catch (error) {
    console.error('移除標籤錯誤:', error)
    return { success: false, error: '移除標籤失敗' }
  }
}
