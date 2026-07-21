'use client'

import FilterBar from './FilterBar'
import DayTasksList from './DayTasksList'
import { TaskWithRelations } from './types'
import { CalendarFiltersState } from './types'
import { List, Tag } from '@prisma/client'

interface LeftPanelProps {
  focusDate: Date
  dayTasks: TaskWithRelations[]
  filters: CalendarFiltersState
  onFilterChange: (filters: CalendarFiltersState) => void
  onTaskClick: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
  lists: List[]
  tags: Tag[]
}

export default function LeftPanel({
  focusDate,
  dayTasks,
  filters,
  onFilterChange,
  onTaskClick,
  onToggleComplete,
  lists,
  tags,
}: LeftPanelProps) {
  return (
    <div className="hidden lg:flex w-72 flex-col border-r border-gray-200 bg-white">
      <FilterBar lists={lists} tags={tags} filters={filters} onFilterChange={onFilterChange} />
      <DayTasksList focusDate={focusDate} tasks={dayTasks} onTaskClick={onTaskClick} onToggleComplete={onToggleComplete} />
    </div>
  )
}
