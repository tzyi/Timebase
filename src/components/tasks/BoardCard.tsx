'use client'

import { Task, List, Tag } from '@prisma/client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDueDate, isOverdue } from '@/lib/date'

interface BoardCardProps {
  task: Task & {
    list: List | null
    tags: Array<{ tag: Tag }>
  }
  onSelectTask: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
}

export default function BoardCard({ task, onSelectTask, onToggleComplete }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'card', groupId: task.groupId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isCompleted = task.status === 'done'
  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onToggleComplete(task.id, e.target.checked)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelectTask(task.id)}
      className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleCheckbox}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-4 h-4 mt-0.5 rounded cursor-pointer flex-shrink-0"
          style={{
            borderColor: isTaskOverdue && !isCompleted ? '#ef4444' : '#d1d5db',
          }}
        />
        <p
          className={`text-sm flex-1 min-w-0 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {task.title}
        </p>
        {task.priority !== 'none' && (
          <div
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
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

      {(task.tags.length > 0 || task.dueDate) && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {task.tags.slice(0, 2).map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
            >
              {tag.name}
            </span>
          ))}
          {task.tags.length > 2 && <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>}
          {task.dueDate && (
            <span
              className={`text-xs whitespace-nowrap ${isTaskOverdue && !isCompleted ? 'text-red-600 font-medium' : 'text-blue-600'}`}
            >
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
