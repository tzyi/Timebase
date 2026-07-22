'use client'

import { TaskWithRelations } from './types'
import { getTaskBackgroundColor, getTaskTextColor, formatTime } from '@/lib/calendarHelpers'
import { TaskTimeType, classifyTaskTime } from '@/lib/taskTimeClassification'

interface DayTasksListProps {
  focusDate: Date
  tasks: TaskWithRelations[]
  onTaskClick: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
}

export default function DayTasksList({ focusDate, tasks, onTaskClick, onToggleComplete }: DayTasksListProps) {
  const sortedTasks = tasks.sort((a, b) => {
    const aType = classifyTaskTime(a as any)
    const bType = classifyTaskTime(b as any)

    const typeOrder = {
      [TaskTimeType.ALL_DAY]: 0,
      [TaskTimeType.NO_TIME]: 1,
      [TaskTimeType.TIMED]: 2,
    }

    const typeA = typeOrder[aType] ?? 3
    const typeB = typeOrder[bType] ?? 3

    if (typeA !== typeB) return typeA - typeB

    if (aType === TaskTimeType.TIMED) {
      return (a.dueTime || '').localeCompare(b.dueTime || '')
    }

    return 0
  })

  const allDayTasks = sortedTasks.filter((t) => classifyTaskTime(t as any) === TaskTimeType.ALL_DAY)
  const noTimeTasks = sortedTasks.filter((t) => classifyTaskTime(t as any) === TaskTimeType.NO_TIME)
  const timedTasks = sortedTasks.filter((t) => classifyTaskTime(t as any) === TaskTimeType.TIMED)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">焦點日期</p>
        <p className="text-lg text-gray-900 dark:text-gray-100 mt-1">
          {focusDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {allDayTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">全天</p>
            <div className="space-y-1">
              {allDayTasks.map((task) => {
                const bgColor = getTaskBackgroundColor(task)
                const textColor = getTaskTextColor(task)
                const isCompleted = task.status === 'done' || !!task.completedAt
                return (
                  <div
                    key={task.id}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                      isCompleted ? 'line-through opacity-70' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 w-4 h-4 rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onTaskClick(task.id)}
                      className="flex-1 min-w-0 text-left truncate"
                    >
                      {task.title}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {noTimeTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">無時間</p>
            <div className="space-y-1">
              {noTimeTasks.map((task) => {
                const bgColor = getTaskBackgroundColor(task)
                const textColor = getTaskTextColor(task)
                const isCompleted = task.status === 'done' || !!task.completedAt
                return (
                  <div
                    key={task.id}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                      isCompleted ? 'line-through opacity-70' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 w-4 h-4 rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onTaskClick(task.id)}
                      className="flex-1 min-w-0 flex items-center gap-2 text-left"
                    >
                      {task.priority === 'high' && <span className="shrink-0 text-red-500">🚩</span>}
                      <span className="truncate">{task.title}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {timedTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">定時</p>
            <div className="space-y-1">
              {timedTasks.map((task) => {
                const bgColor = getTaskBackgroundColor(task)
                const textColor = getTaskTextColor(task)
                const isCompleted = task.status === 'done' || !!task.completedAt
                const timeDisplay = task.dueTime ? formatTime(task.dueTime) : ''
                return (
                  <div
                    key={task.id}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:opacity-90 ${bgColor} ${textColor} ${
                      isCompleted ? 'line-through opacity-70' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 w-4 h-4 rounded cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onTaskClick(task.id)}
                      className="flex-1 min-w-0 flex items-center gap-2 text-left"
                    >
                      {task.priority === 'high' && <span className="shrink-0 text-red-500">🚩</span>}
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{timeDisplay}</span>
                      <span className="truncate">{task.title}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">此日期無任務</p>
        )}
      </div>
    </div>
  )
}
