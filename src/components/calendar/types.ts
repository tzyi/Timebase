import { List, Tag, Task, Subtask } from '@prisma/client'

export type TaskWithRelations = Task & {
  list: List | null
  tags: Array<{ tag: Tag }>
  subtasks: Subtask[]
}

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarFiltersState {
  listIds: number[]
  tagIds: number[]
  priorities: string[]
}
