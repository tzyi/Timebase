'use client'

import { useState } from 'react'
import { List } from '@prisma/client'
import { createTask } from '@/actions/tasks'
import { toDateInputValue, formatDueDate } from '@/lib/date'
import { ensureOnline } from '@/lib/toast'

interface NewTaskModalProps {
  initialDate: Date
  initialDueTime?: string
  initialEndTime?: string
  lists: (List & { uncompletedCount?: number })[]
  onClose: () => void
  onCreated: () => void
}

export default function NewTaskModal({
  initialDate,
  initialDueTime,
  initialEndTime,
  lists,
  onClose,
  onCreated,
}: NewTaskModalProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(toDateInputValue(initialDate))
  const [allDay, setAllDay] = useState(!initialDueTime)
  const [dueTime, setDueTime] = useState(initialDueTime || '')
  const [endTime, setEndTime] = useState(initialEndTime || '')
  const [listId, setListId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    if (!ensureOnline()) return
    if (isSaving) return

    setIsSaving(true)
    const result = await createTask(
      trimmed,
      listId ? parseInt(listId) : null,
      '',
      dueDate ? new Date(dueDate + 'T00:00:00') : undefined,
      'none',
      allDay ? null : dueTime || null,
      allDay ? null : endTime || null,
      allDay
    )
    setIsSaving(false)

    if (result.success) {
      onCreated()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-sm font-medium text-gray-500">
              新建任務・{formatDueDate(new Date(dueDate + 'T00:00:00'))}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="px-4 pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任務標題"
              autoFocus
              className="w-full text-lg font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0"
            />
          </div>

          <div className="px-4 pb-2 flex items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              全天
            </label>
          </div>

          {!allDay && (
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-500 mb-0.5">開始時間</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-1.5 py-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-500 mb-0.5">結束時間</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-1.5 py-1"
                />
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            <label className="block text-xs text-gray-500 mb-0.5">清單</label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="">收集箱</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSaving}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              建立
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
