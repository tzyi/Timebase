'use client'

import { useState, useEffect } from 'react'
import { TaskWithRelations } from './types'
import { deleteTask, updateTask, toggleTaskComplete } from '@/actions/tasks'
import { toDateInputValue } from '@/lib/date'
import { List, Tag } from '@prisma/client'

interface TaskDetailModalProps {
  task: TaskWithRelations | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  lists: List[]
  tags: Tag[]
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onSave,
  lists,
  tags,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [priority, setPriority] = useState('none')
  const [listId, setListId] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setNote(task.note || '')
      setDueDate(task.dueDate ? toDateInputValue(new Date(task.dueDate)) : '')
      setDueTime(task.dueTime || '')
      setEndTime(task.endTime || '')
      setAllDay(task.allDay || false)
      setPriority(task.priority || 'none')
      setListId(task.listId || null)
      setSelectedTags(task.tags?.map((t) => t.tag.id) || [])
      setIsCompleted(task.status === 'done' || !!task.completedAt)
      setError(null)
    }
  }, [task, isOpen])

  if (!isOpen || !task) return null

  const handleSave = async () => {
    if (!title.trim()) {
      setError('標題不能為空')
      return
    }

    if (dueTime && endTime && dueTime > endTime) {
      setError('結束時間不能早於開始時間')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateTask(task.id, {
        title: title.trim(),
        note,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
        dueTime: dueTime || null,
        endTime: endTime || null,
        allDay,
        priority,
        listId: listId || null,
      })

      const wasCompleted = task.status === 'done' || !!task.completedAt
      if (result.success && isCompleted !== wasCompleted) {
        const toggleResult = await toggleTaskComplete(task.id, isCompleted)
        if (!toggleResult.success) {
          setError(toggleResult.error || '保存失敗')
          setIsSaving(false)
          return
        }
      }

      if (result.success) {
        onSave?.()
        onClose()
      } else {
        setError(result.error || '保存失敗')
      }
    } catch (err) {
      setError('保存失敗，請重試')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    try {
      const result = await deleteTask(task.id)
      if (result.success) {
        onSave?.()
        onClose()
      } else {
        setError(result.error || '刪除失敗')
      }
    } catch (err) {
      setError('刪除失敗，請重試')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">編輯任務</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="mt-1"
            />
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任務標題"
              className="flex-1 p-2 border border-gray-300 rounded-md resize-none text-sm"
              rows={2}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="附註"
            className="w-full p-2 border border-gray-300 rounded-md resize-none text-sm"
            rows={3}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">開始時間</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={allDay}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">結束時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={allDay}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => {
                setAllDay(e.target.checked)
                if (e.target.checked) {
                  setDueTime('')
                  setEndTime('')
                }
              }}
              className="w-4 h-4"
            />
            <span>全天事件</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">優先級</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="none">無</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">清單</label>
            <select
              value={listId || ''}
              onChange={(e) => setListId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="">無（收集箱）</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">標籤</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tag.id])
                        } else {
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
          >
            刪除任務
          </button>

          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 mb-2">確定要刪除此任務嗎？</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-2 py-1 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isSaving ? '刪除中...' : '刪除'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
