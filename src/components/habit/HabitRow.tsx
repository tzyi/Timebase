'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HabitWithToday } from './HabitPage'

const DOT_COLOR_MAP: { [key: string]: string } = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#fbbf24',
  yellow: '#facc15',
  lime: '#84cc16',
  green: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#d1d5db',
}

interface HabitRowProps {
  habit: HabitWithToday
  isSelected: boolean
  onToggleLog: () => void
  onSelect: () => void
}

export default function HabitRow({ habit, isSelected, onToggleLog, onSelect }: HabitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: habit.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-2 mb-1 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950 ring-1 ring-blue-300 dark:ring-blue-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="拖曳排序"
        className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 select-none px-0.5"
      >
        ⠿
      </span>

      <span
        className="w-1.5 h-6 rounded-full flex-shrink-0"
        style={{ backgroundColor: DOT_COLOR_MAP[habit.color] || DOT_COLOR_MAP.blue }}
      />

      <span className="text-lg flex-shrink-0">{habit.emoji}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{habit.name}</p>
        {habit.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{habit.description}</p>
        )}
      </div>

      <input
        type="checkbox"
        checked={habit.completedToday}
        onChange={(e) => {
          e.stopPropagation()
          onToggleLog()
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-5 h-5 rounded cursor-pointer flex-shrink-0"
      />
    </div>
  )
}
