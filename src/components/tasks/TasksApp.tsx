'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { List, Tag, Task, Subtask, TaskGroup } from '@prisma/client'
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
import { getBoardForList } from '@/actions/taskGroups'
import { getLists } from '@/actions/lists'
import { ensureOnline } from '@/lib/toast'

const BoardView = dynamic(() => import('./BoardView'), { ssr: false })

type TaskWithRelations = Task & {
  list: List | null
  tags: Array<{ tag: Tag }>
  subtasks: Subtask[]
}

type BoardData = { groups: TaskGroup[]; tasks: TaskWithRelations[] }

const LIST_VIEW_STORAGE_PREFIX = 'timebase:listView:'

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
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [boardData, setBoardData] = useState<BoardData>({ groups: [], tasks: [] })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isListView = typeof selectedView === 'object' && selectedView.kind === 'list'

  const loadViewData = useCallback(async (view: ViewState, mode: 'list' | 'board') => {
    if (view === 'today') {
      const result = await getTodayViewGrouped()
      if (result.success && result.data) {
        setTasks(result.data.today)
        setOverdueTasks(result.data.overdue)
      }
      return
    }

    if (typeof view === 'object' && view.kind === 'list' && mode === 'board') {
      const result = await getBoardForList(view.listId)
      if (result.success && result.data) {
        setBoardData(result.data)
      }
      return
    }

    const result = await getTasksForView(view)
    if (result.success && result.data) {
      setTasks(result.data)
      setOverdueTasks([])
    }
  }, [])

  const refreshTasks = useCallback(async () => {
    setIsLoadingTasks(true)
    try {
      await loadViewData(selectedView, viewMode)

      const listsResult = await getLists()
      if (listsResult.success && listsResult.data) {
        setLists(listsResult.data)
      }
    } finally {
      setIsLoadingTasks(false)
    }
  }, [selectedView, viewMode, loadViewData])

  const handleSelectView = useCallback(
    async (view: ViewState) => {
      setSelectedView(view)
      setSelectedTaskId(null)
      setIsDrawerOpen(false)
      setIsLoadingTasks(true)

      const nextMode: 'list' | 'board' =
        typeof view === 'object' && view.kind === 'list' && typeof window !== 'undefined'
          ? (window.localStorage.getItem(`${LIST_VIEW_STORAGE_PREFIX}${view.listId}`) as
              | 'list'
              | 'board'
              | null) || 'board'
          : 'list'
      setViewMode(nextMode)

      try {
        await loadViewData(view, nextMode)
      } finally {
        setIsLoadingTasks(false)
      }
    },
    [loadViewData]
  )

  const handleSwitchViewMode = useCallback(
    async (mode: 'list' | 'board') => {
      if (!isListView) return
      setViewMode(mode)
      const listId = (selectedView as { kind: 'list'; listId: number }).listId
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${LIST_VIEW_STORAGE_PREFIX}${listId}`, mode)
      }
      setIsLoadingTasks(true)
      try {
        await loadViewData(selectedView, mode)
      } finally {
        setIsLoadingTasks(false)
      }
    },
    [isListView, selectedView, loadViewData]
  )

  const handleToggleComplete = useCallback(
    async (taskId: number, completed: boolean) => {
      if (!ensureOnline()) return
      await toggleTaskComplete(taskId, completed)
      await refreshTasks()
    },
    [refreshTasks]
  )

  const handlePostpone = useCallback(
    async (taskId: number) => {
      if (!ensureOnline()) return
      await postponeTask(taskId)
      await refreshTasks()
    },
    [refreshTasks]
  )

  const handleAddTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newTaskTitle.trim()) return
      if (!ensureOnline()) return

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

  const selectedTask =
    viewMode === 'board'
      ? boardData.tasks.find((t) => t.id === selectedTaskId)
      : tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-950 relative">
      {/* 桌機側欄（可收合） */}
      {!isSidebarCollapsed && (
        <Sidebar
          lists={lists}
          tags={tags}
          selectedView={selectedView}
          onSelectView={handleSelectView}
          onRefresh={refreshTasks}
          className="hidden md:flex"
        />
      )}

      {/* 手機版抽屜側欄 */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <Sidebar
            lists={lists}
            tags={tags}
            selectedView={selectedView}
            onSelectView={handleSelectView}
            onRefresh={refreshTasks}
            className="relative flex w-72 max-w-[80vw] h-full shadow-xl"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="開啟清單側欄"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((v) => !v)}
            className="hidden md:block p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title={isSidebarCollapsed ? '展開側欄' : '收合側欄'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path strokeLinecap="round" d="M9 4v16" />
            </svg>
          </button>

          <form onSubmit={handleAddTask} className="flex-1 flex gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="新增任務到收集箱..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || isLoadingTasks}
              className="shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
            >
              新增
            </button>
          </form>

          {isListView && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-2">
              <button
                type="button"
                onClick={() => handleSwitchViewMode('list')}
                title="清單"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchViewMode('board')}
                title="看板"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'board' ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path strokeLinecap="round" d="M9 4v16M15 4v16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {isListView && viewMode === 'board' ? (
            <BoardView
              listId={(selectedView as { kind: 'list'; listId: number }).listId}
              groups={boardData.groups}
              tasks={boardData.tasks}
              onSelectTask={setSelectedTaskId}
              onToggleComplete={handleToggleComplete}
              onRefresh={refreshTasks}
            />
          ) : (
            <TaskListView
              tasks={tasks}
              overdueTasks={selectedView === 'today' ? overdueTasks : undefined}
              onSelectTask={setSelectedTaskId}
              onToggleComplete={handleToggleComplete}
              onPostpone={selectedView === 'today' ? handlePostpone : undefined}
            />
          )}

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
