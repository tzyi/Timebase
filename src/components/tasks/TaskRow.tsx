'use client'

import { Task, List, Tag } from '@prisma/client'
import { formatDueDate, isOverdue } from '@/lib/date'

interface TaskRowProps {
  task: Task & {
    list: List | null
    tags: Array<{ tag: Tag }>
  }
  onSelectTask: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
}

export default function TaskRow({ task, onSelectTask, onToggleComplete }: TaskRowProps) {
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onToggleComplete(task.id, e.target.checked)
  }

  const isCompleted = task.status === 'done'
  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false

  return (
    <div
      onClick={() => onSelectTask(task.id)}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleCheckbox}
        className="w-5 h-5 rounded cursor-pointer"
        style={{
          borderColor: isTaskOverdue && !isCompleted ? '#ef4444' : '#d1d5db',
        }}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {task.title}
        </p>
        {task.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {task.tags.slice(0, 2).map(({ tag }) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
              >
                {tag.name}
              </span>
            ))}
            {task.tags.length > 2 && <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>}
          </div>
        )}
      </div>

      {task.list && (
        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700 whitespace-nowrap">
          {task.list.name}
        </span>
      )}

      {task.dueDate && (
        <span
          className={`text-xs whitespace-nowrap ${isTaskOverdue && !isCompleted ? 'text-red-600 font-medium' : 'text-blue-600'}`}
        >
          {formatDueDate(task.dueDate)}
          {!task.allDay && task.dueTime ? ` ${task.dueTime}` : ''}
        </span>
      )}

      {task.priority !== 'none' && (
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              task.priority === 'high'
                ? '#ef4444'
                : task.priority === 'medium'
                  ? '#f97316'
                  : '#fbbf24',
          }}
        />
      )}
    </div>
  )
}
