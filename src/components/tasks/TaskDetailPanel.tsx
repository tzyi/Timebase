'use client'

import { Task, List, Tag, Subtask } from '@prisma/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { updateTask, deleteTask } from '@/actions/tasks'
import { assignTagToTask, removeTagFromTask } from '@/actions/tags'
import { createSubtask, updateSubtask, deleteSubtask } from '@/actions/subtasks'
import { toDateInputValue, formatDueDate } from '@/lib/date'
import { ensureOnline } from '@/lib/toast'

const DEFAULT_WIDTH = 384
const MIN_WIDTH = 280
const MAX_WIDTH = 720

const PRIORITY_COLORS: Record<string, string> = {
  none: '#9ca3af',
  low: '#fbbf24',
  medium: '#f97316',
  high: '#ef4444',
}

const PRIORITY_ORDER = ['none', 'low', 'medium', 'high']

const PRIORITY_LABELS: Record<string, string> = {
  none: '無優先級',
  low: '低優先級',
  medium: '中優先級',
  high: '高優先級',
}

interface TaskDetailPanelProps {
  task: Task & {
    list: List | null
    tags: Array<{ tag: Tag }>
    subtasks: Subtask[]
  }
  lists: (List & { uncompletedCount?: number })[]
  allTags: (Tag & { taskCount?: number })[]
  onClose: () => void
  onUpdate: () => void
}

export default function TaskDetailPanel({
  task,
  lists,
  allTags,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note)
  const [dueDate, setDueDate] = useState(task.dueDate ? toDateInputValue(new Date(task.dueDate)) : '')
  const [priority, setPriority] = useState(task.priority)
  const [listId, setListId] = useState(task.listId?.toString() || '')
  const [assignedTagIds, setAssignedTagIds] = useState(new Set(task.tags.map((t) => t.tag.id)))
  const [subtasks, setSubtasks] = useState(task.subtasks)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showListPicker, setShowListPicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const isResizingRef = useRef(false)
  const listPickerRef = useRef<HTMLDivElement>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const tagPickerRef = useRef<HTMLDivElement>(null)
  const priorityPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitle(task.title)
    setNote(task.note)
    setDueDate(task.dueDate ? toDateInputValue(new Date(task.dueDate)) : '')
    setPriority(task.priority)
    setListId(task.listId?.toString() || '')
    setAssignedTagIds(new Set(task.tags.map((t) => t.tag.id)))
    setSubtasks(task.subtasks)
  }, [task])

  const handleResizeStart = useCallback(() => {
    isResizingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      const newWidth = window.innerWidth - e.clientX
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)))
    }
    const handleMouseUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (listPickerRef.current && !listPickerRef.current.contains(target)) {
        setShowListPicker(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(target)) {
        setShowDatePicker(false)
      }
      if (tagPickerRef.current && !tagPickerRef.current.contains(target)) {
        setShowTagPicker(false)
      }
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(target)) {
        setShowPriorityPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveTitle = async () => {
    if (title.trim() === task.title) return
    if (!ensureOnline()) return
    await updateTask(task.id, { title: title.trim() })
    onUpdate()
  }

  const saveNote = async () => {
    if (note === task.note) return
    if (!ensureOnline()) return
    await updateTask(task.id, { note })
    onUpdate()
  }

  const handleDueDateChange = async (value: string) => {
    if (!ensureOnline()) return
    setDueDate(value)
    const newDueDate = value ? new Date(value + 'T00:00:00') : null
    await updateTask(task.id, { dueDate: newDueDate })
    onUpdate()
  }

  const handlePriorityChange = async (nextPriority: string) => {
    if (!ensureOnline()) return
    setPriority(nextPriority)
    setShowPriorityPicker(false)
    await updateTask(task.id, { priority: nextPriority })
    onUpdate()
  }

  const handleListChange = async (value: string) => {
    if (!ensureOnline()) return
    setListId(value)
    setShowListPicker(false)
    await updateTask(task.id, { listId: value ? parseInt(value) : null })
    onUpdate()
  }

  const handleTagToggle = async (tagId: number) => {
    if (!ensureOnline()) return
    const isAssigned = assignedTagIds.has(tagId)
    const newTags = new Set(assignedTagIds)
    if (isAssigned) {
      newTags.delete(tagId)
      await removeTagFromTask(task.id, tagId)
    } else {
      newTags.add(tagId)
      await assignTagToTask(task.id, tagId)
    }
    setAssignedTagIds(newTags)
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm('確定刪除此任務？')) return
    if (!ensureOnline()) return
    await deleteTask(task.id)
    onUpdate()
    onClose()
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSubtaskTitle.trim()
    if (!trimmed) return
    if (!ensureOnline()) return
    const result = await createSubtask(task.id, trimmed)
    if (result.success && result.data) {
      setSubtasks((prev) => [...prev, result.data!])
      setNewSubtaskTitle('')
      onUpdate()
    }
  }

  const handleToggleSubtask = async (subtaskId: number, completed: boolean) => {
    if (!ensureOnline()) return
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed } : s))
    )
    await updateSubtask(subtaskId, { completed })
    onUpdate()
  }

  const handleRenameSubtask = async (subtaskId: number, title: string) => {
    const original = task.subtasks.find((s) => s.id === subtaskId)
    if (original && original.title === title) return
    if (!ensureOnline()) return
    await updateSubtask(subtaskId, { title })
    onUpdate()
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!ensureOnline()) return
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
    await deleteSubtask(subtaskId)
    onUpdate()
  }

  const currentList = lists.find((l) => l.id.toString() === listId)

  return (
    <div
      className="fixed inset-0 z-50 md:z-auto md:relative md:inset-auto w-full md:w-[var(--detail-width)] bg-white md:border-l border-gray-200 flex flex-col overflow-y-auto flex-shrink-0"
      style={{ ['--detail-width' as string]: `${width}px` }}
    >
      <div
        onMouseDown={handleResizeStart}
        className="hidden md:block absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
        style={{ marginLeft: '-2px' }}
      />

      {/* 頂部圖示列：到期日 / 優先級 / 關閉 */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          title="返回"
          className="md:hidden flex items-center gap-1 p-1.5 -ml-1.5 mr-1 rounded hover:bg-gray-100 text-gray-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            title="設定到期日"
            className={`flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100 text-sm ${dueDate ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
            {dueDate ? formatDueDate(new Date(dueDate + 'T00:00:00')) : '到期日'}
          </button>
          {showDatePicker && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded shadow-lg p-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                autoFocus
              />
              {dueDate && (
                <button
                  onClick={() => {
                    handleDueDateChange('')
                    setShowDatePicker(false)
                  }}
                  className="w-full mt-1 text-xs text-red-500 hover:text-red-600"
                >
                  清除日期
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="relative" ref={priorityPickerRef}>
          <button
            onClick={() => setShowPriorityPicker((v) => !v)}
            title={PRIORITY_LABELS[priority]}
            className="p-1.5 rounded hover:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={PRIORITY_COLORS[priority]} stroke={PRIORITY_COLORS[priority]} strokeWidth="2">
              <path d="M5 3v18M5 4h13l-3 4 3 4H5" fill={priority === 'none' ? 'none' : PRIORITY_COLORS[priority]} />
            </svg>
          </button>
          {showPriorityPicker && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[130px]">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${priority === p ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={PRIORITY_COLORS[p]} stroke={PRIORITY_COLORS[p]} strokeWidth="2">
                    <path d="M5 3v18M5 4h13l-3 4 3 4H5" fill={p === 'none' ? 'none' : PRIORITY_COLORS[p]} />
                  </svg>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          title="關閉"
          className="hidden md:block p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 px-4 pb-4">
        {/* 標題 */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          rows={1}
          placeholder="任務標題"
          className="w-full resize-none text-xl font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0 mb-2"
        />

        {/* 備註 */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          rows={2}
          placeholder="新增備註..."
          className="w-full resize-none text-sm text-gray-500 border-none outline-none focus:ring-0 p-0 mb-4"
        />

        {/* 子任務 */}
        <div className="mt-2">
          {subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              onToggle={handleToggleSubtask}
              onRename={handleRenameSubtask}
              onDelete={handleDeleteSubtask}
            />
          ))}

          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 py-2 border-b border-gray-100">
            <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="新增子任務"
              className="flex-1 text-sm text-gray-700 border-none outline-none focus:ring-0 p-0 placeholder:text-gray-400"
            />
          </form>
        </div>
      </div>

      {/* 底部工具列 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
        <div className="relative" ref={listPickerRef}>
          <button
            onClick={() => setShowListPicker((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7l3-3h5l2 2h8v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            {currentList ? currentList.name : '收集箱'}
          </button>
          {showListPicker && (
            <div className="absolute left-0 bottom-full mb-1 z-10 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[140px]">
              <button
                onClick={() => handleListChange('')}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${!listId ? 'font-medium text-blue-600' : 'text-gray-700'}`}
              >
                收集箱
              </button>
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleListChange(l.id.toString())}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${listId === l.id.toString() ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative" ref={tagPickerRef}>
            <button
              onClick={() => setShowTagPicker((v) => !v)}
              title="標籤"
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41L11 3.83A2 2 0 009.59 3.24L4 3a1 1 0 00-1 1l.24 5.59a2 2 0 00.58 1.41l9.59 9.58a2 2 0 002.83 0l5.35-5.35a2 2 0 000-2.82z" />
                <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
              </svg>
            </button>
            {showTagPicker && (
              <div className="absolute right-0 bottom-full mb-1 z-10 bg-white border border-gray-200 rounded shadow-lg p-2 min-w-[160px]">
                {allTags.length === 0 && (
                  <p className="text-xs text-gray-400 px-1 py-1">尚無標籤</p>
                )}
                {allTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer px-1 py-1 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={assignedTagIds.has(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleDelete}
            title="刪除任務"
            className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function SubtaskRow({
  subtask,
  onToggle,
  onRename,
  onDelete,
}: {
  subtask: Subtask
  onToggle: (id: number, completed: boolean) => void
  onRename: (id: number, title: string) => void
  onDelete: (id: number) => void
}) {
  const [title, setTitle] = useState(subtask.title)

  useEffect(() => {
    setTitle(subtask.title)
  }, [subtask.title])

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 group">
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={(e) => onToggle(subtask.id, e.target.checked)}
        className="w-4 h-4 rounded flex-shrink-0 cursor-pointer"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => onRename(subtask.id, title.trim())}
        className={`flex-1 text-sm border-none outline-none focus:ring-0 p-0 bg-transparent ${
          subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
        }`}
      />
      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-xs px-1"
      >
        ✕
      </button>
    </div>
  )
}
