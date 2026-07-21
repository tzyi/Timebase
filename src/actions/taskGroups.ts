'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './auth'

async function assertListOwnership(listId: number, userId: number) {
  const list = await prisma.list.findUnique({ where: { id: listId } })
  return !!list && list.userId === userId
}

async function findGroupWithListOwnership(groupId: number, userId: number) {
  const group = await prisma.taskGroup.findUnique({
    where: { id: groupId },
    include: { list: true },
  })
  if (!group || group.list.userId !== userId) return null
  return group
}

export async function createTaskGroup(listId: number, name: string) {
  try {
    const user = await requireAuth()

    if (!name || name.trim().length === 0) {
      return { success: false, error: '分組名稱不可為空' }
    }

    if (!(await assertListOwnership(listId, user.id))) {
      return { success: false, error: '清單不存在或無權限' }
    }

    const maxOrder = await prisma.taskGroup.aggregate({
      where: { listId },
      _max: { sortOrder: true },
    })

    const group = await prisma.taskGroup.create({
      data: {
        listId,
        name: name.trim(),
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return { success: true, data: group }
  } catch (error) {
    console.error('建立分組錯誤:', error)
    return { success: false, error: '建立分組失敗' }
  }
}

export async function renameTaskGroup(groupId: number, name: string) {
  try {
    const user = await requireAuth()

    if (!name || name.trim().length === 0) {
      return { success: false, error: '分組名稱不可為空' }
    }

    const group = await findGroupWithListOwnership(groupId, user.id)
    if (!group) {
      return { success: false, error: '分組不存在或無權限' }
    }

    const updated = await prisma.taskGroup.update({
      where: { id: groupId },
      data: { name: name.trim() },
    })

    return { success: true, data: updated }
  } catch (error) {
    console.error('編輯分組錯誤:', error)
    return { success: false, error: '編輯分組失敗' }
  }
}

export async function deleteTaskGroup(groupId: number) {
  try {
    const user = await requireAuth()

    const group = await findGroupWithListOwnership(groupId, user.id)
    if (!group) {
      return { success: false, error: '分組不存在或無權限' }
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { groupId },
        data: { groupId: null },
      }),
      prisma.taskGroup.delete({ where: { id: groupId } }),
    ])

    return { success: true }
  } catch (error) {
    console.error('刪除分組錯誤:', error)
    return { success: false, error: '刪除分組失敗' }
  }
}

export async function reorderTaskGroups(listId: number, orderedGroupIds: number[]) {
  try {
    const user = await requireAuth()

    if (!(await assertListOwnership(listId, user.id))) {
      return { success: false, error: '清單不存在或無權限' }
    }

    await prisma.$transaction(
      orderedGroupIds.map((groupId, index) =>
        prisma.taskGroup.update({
          where: { id: groupId },
          data: { sortOrder: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('排序分組錯誤:', error)
    return { success: false, error: '排序分組失敗' }
  }
}

export async function getTaskGroups(listId: number) {
  try {
    const user = await requireAuth()

    if (!(await assertListOwnership(listId, user.id))) {
      return { success: false, error: '清單不存在或無權限' }
    }

    const groups = await prisma.taskGroup.findMany({
      where: { listId },
      orderBy: { sortOrder: 'asc' },
    })

    return { success: true, data: groups }
  } catch (error) {
    console.error('查詢分組錯誤:', error)
    return { success: false, error: '查詢分組失敗' }
  }
}

export async function getBoardForList(listId: number) {
  try {
    const user = await requireAuth()

    if (!(await assertListOwnership(listId, user.id))) {
      return { success: false, error: '清單不存在或無權限' }
    }

    const [groups, tasks] = await Promise.all([
      prisma.taskGroup.findMany({
        where: { listId },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.task.findMany({
        where: { listId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          tags: { include: { tag: true } },
          list: true,
          subtasks: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    ])

    return { success: true, data: { groups, tasks } }
  } catch (error) {
    console.error('查詢看板資料錯誤:', error)
    return { success: false, error: '查詢看板資料失敗' }
  }
}
