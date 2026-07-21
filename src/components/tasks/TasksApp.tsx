'use client'

import { useState, useCallback } from 'react'
import { List, Tag, Task, Subtask } from '@prisma/client'
import Sidebar from './Sidebar'
import TaskListView from './TaskListView'
import TaskDetailPanel from './TaskDetailPanel'
import {
  getTasksForView,
  getTodayViewGrouped,
  toggleTaskComplete,
  postponeTask,
  createTask,
} from '@/actions/tasks'
import { getLists } from '@/actions/lists'

type TaskWithRelations = Task & {
  list: List | null
  tags: Array<{ tag: Tag }>
  subtasks: Subtask[]
}

type ListWithCount = List & { uncompletedCount?: number }

type TagWithCount = Tag & { taskCount?: number }

interface TasksAppProps {
  initialLists: ListWithCount[]
  initialTags: TagWithCount[]
  initialView: 'today' | 'next7days' | 'inbox' | 'completed'
  initialTasks: TaskWithRelations[]
  initialOverdueTasks?: TaskWithRelations[]
}

type ViewState =
  | 'today'
  | 'next7days'
  | 'inbox'
  | 'completed'
  | { kind: 'list'; listId: number }
  | { kind: 'tag'; tagId: number }

export default function TasksApp({
  initialLists,
  initialTags,
  initialView,
  initialTasks,
  initialOverdueTasks = [],
}: TasksAppProps) {
  const [lists, setLists] = useState<ListWithCount[]>(initialLists)
  const [tags] = useState<TagWithCount[]>(initialTags)
  const [selectedView, setSelectedView] = useState<ViewState>(initialView)
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks)
  const [overdueTasks, setOverdueTasks] = useState<TaskWithRelations[]>(initialOverdueTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  const refreshTasks = useCallback(async () => {
    setIsLoadingTasks(true)
    try {
      if (selectedView === 'today') {
        const result = await getTodayViewGrouped()
        if (result.success && result.data) {
          setTasks(result.data.today)
          setOverdueTasks(result.data.overdue)
        }
      } else if (typeof selectedView === 'string') {
        const result = await getTasksForView(selectedView)
        if (result.success && result.data) {
          setTasks(result.data)
          setOverdueTasks([])
        }
      } else {
        const result = await getTasksForView(selectedView)
        if (result.success && result.data) {
          setTasks(result.data)
          setOverdueTasks([])
        }
      }

      const listsResult = await getLists()
      if (listsResult.success && listsResult.data) {
        setLists(listsResult.data)
      }
    } finally {
      setIsLoadingTasks(false)
    }
  }, [selectedView])

  const handleSelectView = useCallback(async (view: ViewState) => {
    setSelectedView(view)
    setSelectedTaskId(null)
    setIsLoadingTasks(true)

    try {
      if (view === 'today') {
        const result = await getTodayViewGrouped()
        if (result.success && result.data) {
          setTasks(result.data.today)
          setOverdueTasks(result.data.overdue)
        }
      } else if (typeof view === 'string') {
        const result = await getTasksForView(view)
        if (result.success && result.data) {
          setTasks(result.data)
          setOverdueTasks([])
        }
      } else {
        const result = await getTasksForView(view)
        if (result.success && result.data) {
          setTasks(result.data)
          setOverdueTasks([])
        }
      }
    } finally {
      setIsLoadingTasks(false)
    }
  }, [])

  const handleToggleComplete = useCallback(
    async (taskId: number, completed: boolean) => {
      await toggleTaskComplete(taskId, completed)
      await refreshTasks()
    },
    [refreshTasks]
  )

  const handlePostpone = useCallback(
    async (taskId: number) => {
      await postponeTask(taskId)
      await refreshTasks()
    },
    [refreshTasks]
  )

  const handleAddTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newTaskTitle.trim()) return

      let listId: number | null = null
      if (typeof selectedView === 'object' && selectedView.kind === 'list') {
        listId = selectedView.listId
      }

      const result = await createTask(newTaskTitle, listId)
      if (result.success) {
        setNewTaskTitle('')
        await refreshTasks()
      }
    },
    [newTaskTitle, selectedView, refreshTasks]
  )

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="flex h-full bg-gray-100">
      <Sidebar
        lists={lists}
        tags={tags}
        selectedView={selectedView}
        onSelectView={handleSelectView}
        onRefresh={refreshTasks}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <form onSubmit={handleAddTask} className="flex gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="新增任務到收集箱..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || isLoadingTasks}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
            >
              新增
            </button>
          </form>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <TaskListView
            tasks={tasks}
            overdueTasks={selectedView === 'today' ? overdueTasks : undefined}
            onSelectTask={setSelectedTaskId}
            onToggleComplete={handleToggleComplete}
            onPostpone={selectedView === 'today' ? handlePostpone : undefined}
          />

          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              lists={lists}
              allTags={tags}
              onClose={() => setSelectedTaskId(null)}
              onUpdate={refreshTasks}
            />
          )}
        </div>
      </div>
    </div>
  )
}
