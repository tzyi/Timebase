'use client'

import { useEffect, useState } from 'react'
import { Task, List, Tag, TaskGroup } from '@prisma/client'
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import BoardColumn from './BoardColumn'
import BoardCard from './BoardCard'
import {
  createTaskGroup,
  renameTaskGroup,
  deleteTaskGroup,
  reorderTaskGroups,
} from '@/actions/taskGroups'
import { moveTaskToGroup, createTask } from '@/actions/tasks'
import { ensureOnline } from '@/lib/toast'

type TaskWithRelations = Task & { list: List | null; tags: Array<{ tag: Tag }> }

interface BoardViewProps {
  listId: number
  groups: TaskGroup[]
  tasks: TaskWithRelations[]
  onSelectTask: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
  onRefresh: () => void
}

export default function BoardView({
  listId,
  groups,
  tasks,
  onSelectTask,
  onToggleComplete,
  onRefresh,
}: BoardViewProps) {
  const [localGroups, setLocalGroups] = useState<TaskGroup[]>(groups)
  const [localTasks, setLocalTasks] = useState<TaskWithRelations[]>(tasks)
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)

  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const columns: { group: TaskGroup | null; tasks: TaskWithRelations[] }[] = [
    { group: null, tasks: localTasks.filter((t) => t.groupId === null) },
    ...localGroups.map((g) => ({
      group: g,
      tasks: localTasks.filter((t) => t.groupId === g.id),
    })),
  ]

  // 卡片拖曳只考慮卡片／欄位落點目標，分組拖曳只考慮分組落點目標，
  // 避免欄位本身的 sortable 節點（涵蓋整個欄位範圍）搶走卡片的碰撞判定。
  const collisionDetection: CollisionDetection = (args) => {
    const activeType = args.active.data.current?.type
    const filteredContainers = args.droppableContainers.filter((container) => {
      const type = container.data.current?.type
      if (activeType === 'card') return type === 'card' || type === 'column-dropzone'
      if (activeType === 'column') return type === 'column'
      return true
    })
    return closestCenter({ ...args, droppableContainers: filteredContainers })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'card') {
      const task = localTasks.find((t) => t.id === active.id)
      setActiveTask(task ?? null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    if (active.data.current?.type === 'column') {
      if (active.id === over.id) return
      const oldIndex = localGroups.findIndex((g) => `column-${g.id}` === active.id)
      const newIndex = localGroups.findIndex((g) => `column-${g.id}` === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(localGroups, oldIndex, newIndex)
      setLocalGroups(reordered)
      if (!ensureOnline()) return
      await reorderTaskGroups(
        listId,
        reordered.map((g) => g.id)
      )
      onRefresh()
      return
    }

    // 拖曳卡片
    const taskId = Number(active.id)
    const movingTask = localTasks.find((t) => t.id === taskId)
    if (!movingTask) return

    let targetGroupId: number | null | undefined
    let targetIndex: number

    if (over.data.current?.type === 'column-dropzone') {
      targetGroupId = over.data.current.groupId as number | null
      targetIndex = localTasks.filter((t) => t.groupId === targetGroupId && t.id !== taskId).length
    } else if (over.data.current?.type === 'card') {
      targetGroupId = over.data.current.groupId as number | null
      const columnTasks = localTasks.filter((t) => t.groupId === targetGroupId && t.id !== taskId)
      targetIndex = columnTasks.findIndex((t) => t.id === Number(over.id))
      if (targetIndex === -1) targetIndex = columnTasks.length
    } else {
      return
    }

    if (targetGroupId === movingTask.groupId) {
      // 同欄內排序
      const columnTasks = localTasks.filter((t) => t.groupId === targetGroupId)
      const oldIndex = columnTasks.findIndex((t) => t.id === taskId)
      if (oldIndex === targetIndex) return
    }

    // 樂觀更新本地狀態
    setLocalTasks((prev) => {
      const withoutMoving = prev.filter((t) => t.id !== taskId)
      const columnTasks = withoutMoving.filter((t) => t.groupId === targetGroupId)
      const others = withoutMoving.filter((t) => t.groupId !== targetGroupId)
      const updatedMoving = { ...movingTask, groupId: targetGroupId ?? null }
      const newColumnTasks = [
        ...columnTasks.slice(0, targetIndex),
        updatedMoving,
        ...columnTasks.slice(targetIndex),
      ]
      return [...others, ...newColumnTasks]
    })

    if (!ensureOnline()) return
    await moveTaskToGroup(taskId, targetGroupId ?? null, targetIndex)
    onRefresh()
  }

  const handleAddTask = async (groupId: number | null, title: string) => {
    if (!ensureOnline()) return
    const result = await createTask(title, listId)
    if (result.success && result.data && groupId !== null) {
      await moveTaskToGroup(result.data.id, groupId, 0)
    }
    onRefresh()
  }

  const handleCreateGroup = async () => {
    const name = prompt('新分組名稱')
    if (!name || !name.trim()) return
    if (!ensureOnline()) return
    await createTaskGroup(listId, name.trim())
    onRefresh()
  }

  const handleRenameGroup = async (groupId: number, name: string) => {
    setLocalGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)))
    if (!ensureOnline()) return
    await renameTaskGroup(groupId, name)
    onRefresh()
  }

  const handleDeleteGroup = async (groupId: number) => {
    setLocalGroups((prev) => prev.filter((g) => g.id !== groupId))
    setLocalTasks((prev) =>
      prev.map((t) => (t.groupId === groupId ? { ...t, groupId: null } : t))
    )
    if (!ensureOnline()) return
    await deleteTaskGroup(groupId)
    onRefresh()
  }

  return (
    <div className="flex-1 bg-white overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 p-4 h-full items-start">
          <SortableContext
            items={localGroups.map((g) => `column-${g.id}`)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map(({ group, tasks: columnTasks }) => (
              <BoardColumn
                key={group ? group.id : 'ungrouped'}
                group={group}
                tasks={columnTasks}
                onSelectTask={onSelectTask}
                onToggleComplete={onToggleComplete}
                onAddTask={handleAddTask}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            ))}
          </SortableContext>

          <button
            type="button"
            onClick={handleCreateGroup}
            className="flex-shrink-0 w-40 h-10 mt-0 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
          >
            + 新分組
          </button>
        </div>

        <DragOverlay>
          {activeTask ? (
            <BoardCard
              task={activeTask}
              onSelectTask={() => {}}
              onToggleComplete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
