'use client'

import { useState, useRef, useEffect } from 'react'
import { Task, List, Tag, TaskGroup } from '@prisma/client'
import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BoardCard from './BoardCard'

type TaskWithRelations = Task & { list: List | null; tags: Array<{ tag: Tag }> }

interface BoardColumnProps {
  group: TaskGroup | null // null = 未分組（固定虛擬欄，不可拖曳排序）
  tasks: TaskWithRelations[]
  onSelectTask: (taskId: number) => void
  onToggleComplete: (taskId: number, completed: boolean) => void
  onAddTask: (groupId: number | null, title: string) => void
  onRenameGroup?: (groupId: number, name: string) => void
  onDeleteGroup?: (groupId: number) => void
}

export default function BoardColumn({
  group,
  tasks,
  onSelectTask,
  onToggleComplete,
  onAddTask,
  onRenameGroup,
  onDeleteGroup,
}: BoardColumnProps) {
  const dropzoneId = group ? `dropzone-${group.id}` : 'dropzone-ungrouped'
  const columnSortId = group ? `column-${group.id}` : 'column-ungrouped'

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropzoneId,
    data: { type: 'column-dropzone', groupId: group?.id ?? null },
  })

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnSortId,
    disabled: !group,
    data: { type: 'column' },
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(group?.name || '')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !onRenameGroup) return
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== group.name) {
      onRenameGroup(group.id, trimmed)
    }
    setIsRenaming(false)
  }

  const handleDelete = () => {
    if (!group || !onDeleteGroup) return
    const count = tasks.length
    if (!confirm(`確定刪除分組「${group.name}」？內含 ${count} 個任務將移回未分組。`)) return
    onDeleteGroup(group.id)
    setMenuOpen(false)
  }

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    onAddTask(group?.id ?? null, trimmed)
    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex flex-col w-72 flex-shrink-0 bg-gray-50 rounded-lg h-full"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
        {group && (
          <span
            {...attributes}
            {...listeners}
            title="拖曳排序分組"
            className="cursor-grab active:cursor-grabbing text-gray-400 select-none"
          >
            ⠿
          </span>
        )}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleRenameSubmit}
              autoFocus
              className="w-full text-sm font-medium border border-blue-300 rounded px-1.5 py-0.5"
            />
          </form>
        ) : (
          <h3 className="text-sm font-medium text-gray-800 flex-1 truncate">
            {group ? group.name : '未分組'}
          </h3>
        )}
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{tasks.length}</span>
        <button
          type="button"
          onClick={() => setIsAddingTask(true)}
          title="新增任務"
          className="p-1 rounded hover:bg-gray-200 text-gray-500"
        >
          +
        </button>
        {group && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title="更多選項"
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded shadow-lg py-1 w-32">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenaming(true)
                    setMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  改名
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
                >
                  刪除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={setDropRef}
        className={`flex-1 min-h-[120px] overflow-y-auto p-2 rounded-b-lg transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BoardCard
              key={task.id}
              task={task}
              onSelectTask={onSelectTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </SortableContext>

        {isAddingTask ? (
          <form onSubmit={handleAddTaskSubmit} className="mt-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsAddingTask(false)
              }}
              placeholder="新增任務標題..."
              autoFocus
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTask(true)}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-600 px-2 py-1.5"
          >
            + 新增任務
          </button>
        )}
      </div>
    </div>
  )
}
