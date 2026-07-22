'use client'

import { Task, List, Tag } from '@prisma/client'
import TaskRow from './TaskRow'

interface TaskListViewProps {
  tasks: Array<Task & { list: List | null; tags: Array<{ tag: Tag }> }>
  overdueTasks?: Array<Task & { list: List | null; tags: Array<{ tag: Tag }> }>
  onSelectTask: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
  onPostpone?: (taskId: number) => void
}

export default function TaskListView({
  tasks,
  overdueTasks,
  onSelectTask,
  onToggleComplete,
  onPostpone,
}: TaskListViewProps) {
  return (
    <div className="flex-1 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {overdueTasks && overdueTasks.length > 0 && (
        <div className="border-b-2 border-red-200 dark:border-red-900">
          <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-red-900 dark:text-red-200">已過期</h3>
              <span className="text-sm font-medium px-2 py-1 rounded bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200">
                {overdueTasks.length}
              </span>
            </div>
            {onPostpone && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (overdueTasks.length > 0) {
                    onPostpone(overdueTasks[0].id)
                  }
                }}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                順延
              </button>
            )}
          </div>
          <div>
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onSelectTask={onSelectTask}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && !overdueTasks?.length ? (
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <p>沒有任務</p>
        </div>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelectTask={onSelectTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
