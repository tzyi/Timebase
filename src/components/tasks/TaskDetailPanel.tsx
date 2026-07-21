'use client'

import { Task, List, Tag } from '@prisma/client'
import { useState } from 'react'
import { updateTask, deleteTask } from '@/actions/tasks'
import { assignTagToTask, removeTagFromTask } from '@/actions/tags'

interface TaskDetailPanelProps {
  task: Task & {
    list: List | null
    tags: Array<{ tag: Tag }>
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
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
  const [priority, setPriority] = useState(task.priority)
  const [listId, setListId] = useState(task.listId?.toString() || '')
  const [assignedTagIds, setAssignedTagIds] = useState(new Set(task.tags.map((t) => t.tag.id)))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const newDueDate = dueDate ? new Date(dueDate + 'T00:00:00') : null

      await updateTask(task.id, {
        title: title.trim(),
        note,
        dueDate: newDueDate,
        priority,
        listId: listId ? parseInt(listId) : null,
      })

      // 同步標籤
      const oldTagIds = new Set(task.tags.map((t) => t.tag.id))
      for (const tagId of oldTagIds) {
        if (!assignedTagIds.has(tagId)) {
          await removeTagFromTask(task.id, tagId)
        }
      }
      for (const tagId of assignedTagIds) {
        if (!oldTagIds.has(tagId)) {
          await assignTagToTask(task.id, tagId)
        }
      }

      onUpdate()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('確定刪除此任務？')) return
    setIsSaving(true)
    try {
      await deleteTask(task.id)
      onUpdate()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleTagToggle = (tagId: number) => {
    const newTags = new Set(assignedTagIds)
    if (newTags.has(tagId)) {
      newTags.delete(tagId)
    } else {
      newTags.add(tagId)
    }
    setAssignedTagIds(newTags)
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">詳情</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">標題</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">備註</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">到期日</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">優先級</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">收集箱</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">標籤</label>
          <div className="space-y-2">
            {allTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedTagIds.has(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="w-full px-3 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          刪除任務
        </button>
      </div>
    </div>
  )
}
