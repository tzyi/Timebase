'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { reorderHabits } from '@/actions/habits'
import { ensureOnline } from '@/lib/toast'
import HabitRow from './HabitRow'
import { HabitWithToday } from './HabitPage'

interface HabitListProps {
  habits: HabitWithToday[]
  selectedHabitId: number | null
  onToggleLog: (habitId: number) => void
  onSelectHabit: (habitId: number) => void
  onReorder: (orderedIds: number[]) => void
}

export default function HabitList({
  habits,
  selectedHabitId,
  onToggleLog,
  onSelectHabit,
  onReorder,
}: HabitListProps) {
  const [localHabits, setLocalHabits] = useState(habits)

  useEffect(() => {
    setLocalHabits(habits)
  }, [habits])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localHabits.findIndex((h) => h.id === active.id)
    const newIndex = localHabits.findIndex((h) => h.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localHabits, oldIndex, newIndex)
    setLocalHabits(reordered)
    onReorder(reordered.map((h) => h.id))

    if (!ensureOnline()) return
    await reorderHabits(reordered.map((h) => h.id))
  }

  if (localHabits.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
        今天沒有排程中的習慣
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localHabits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2">
          {localHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isSelected={selectedHabitId === habit.id}
              onToggleLog={() => onToggleLog(habit.id)}
              onSelect={() => onSelectHabit(habit.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
