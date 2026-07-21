'use client'

import { List, Tag } from '@prisma/client'
import { useEffect, useState } from 'react'
import ListFormModal from './ListFormModal'
import TagFormModal from './TagFormModal'
import { deleteList } from '@/actions/lists'
import { deleteTag } from '@/actions/tags'
import { ensureOnline } from '@/lib/toast'

type ViewKind = 'today' | 'next7days' | 'inbox' | 'completed'

type ContextMenuState =
  | { type: 'list'; id: number; x: number; y: number }
  | { type: 'tag'; id: number; x: number; y: number }
  | null

interface SidebarProps {
  lists: (List & { uncompletedCount?: number })[]
  tags: (Tag & { taskCount?: number })[]
  selectedView: ViewKind | { kind: 'list'; listId: number } | { kind: 'tag'; tagId: number }
  onSelectView: (view: any) => void
  onRefresh: () => void
  className?: string
}

export default function Sidebar({
  lists,
  tags,
  selectedView,
  onSelectView,
  onRefresh,
  className = '',
}: SidebarProps) {
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    // 延遲到下一個事件循環再註冊，避免立即被「開啟選單」的同一個右鍵事件冒泡到 window 時馬上關閉
    const timer = window.setTimeout(() => {
      window.addEventListener('click', close)
      window.addEventListener('contextmenu', close)
      window.addEventListener('scroll', close, true)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [contextMenu])

  const isViewSelected = (view: any) => {
    if (typeof selectedView === 'string') {
      return selectedView === view
    }
    if (typeof view === 'string') {
      return false
    }
    return (
      'kind' in selectedView &&
      selectedView.kind === view.kind &&
      ('listId' in selectedView && selectedView.listId === view.listId)
    )
  }

  const handleListContextMenu = (e: React.MouseEvent, list: List) => {
    e.preventDefault()
    setContextMenu({ type: 'list', id: list.id, x: e.clientX, y: e.clientY })
  }

  const handleTagContextMenu = (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault()
    setContextMenu({ type: 'tag', id: tag.id, x: e.clientX, y: e.clientY })
  }

  const handleRename = () => {
    if (!contextMenu) return
    if (contextMenu.type === 'list') {
      const list = lists.find((l) => l.id === contextMenu.id)
      if (list) setEditingList(list)
    } else {
      const tag = tags.find((t) => t.id === contextMenu.id)
      if (tag) setEditingTag(tag)
    }
    setContextMenu(null)
  }

  const handleDelete = async () => {
    if (!contextMenu) return
    const { type, id } = contextMenu
    setContextMenu(null)

    if (type === 'list') {
      const list = lists.find((l) => l.id === id)
      if (!confirm(`確定刪除清單「${list?.name ?? ''}」？此清單中的任務將移至收集箱。`)) return
      if (!ensureOnline()) return
      await deleteList(id)
    } else {
      const tag = tags.find((t) => t.id === id)
      if (!confirm(`確定刪除標籤「${tag?.name ?? ''}」？`)) return
      if (!ensureOnline()) return
      await deleteTag(id)
    }
    onRefresh()
  }

  return (
    <div className={`w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto ${className}`}>
      {/* 智慧清單 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">智慧清單</h3>
        <nav className="space-y-2">
          {[
            { kind: 'today', label: '今天' },
            { kind: 'next7days', label: '最近 7 天' },
            { kind: 'inbox', label: '收集箱' },
            { kind: 'completed', label: '已完成' },
          ].map(({ kind, label }) => (
            <button
              key={kind}
              onClick={() => onSelectView(kind)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                isViewSelected(kind)
                  ? 'bg-blue-500 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* 清單 */}
      <div className="p-4 border-b border-gray-200 flex-1">
        <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">我的清單</h3>

        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelectView({ kind: 'list', listId: list.id })}
            onContextMenu={(e) => handleListContextMenu(e, list)}
            className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
              isViewSelected({ kind: 'list', listId: list.id })
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getColorValue(list.color) }}
            />
            <span className="flex-1">{list.name}</span>
            <span className="text-xs text-gray-500">{list.uncompletedCount || 0}</span>
          </button>
        ))}

        <button
          onClick={() => setIsListModalOpen(true)}
          className="w-full text-left px-2 py-1 mt-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          + 新增清單
        </button>
      </div>

      {/* 標籤 */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3">標籤</h3>
        <div className="space-y-1 mb-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onSelectView({ kind: 'tag', tagId: tag.id })}
              onContextMenu={(e) => handleTagContextMenu(e, tag)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
                isViewSelected({ kind: 'tag', tagId: tag.id })
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getColorValue(tag.color) }}
              />
              <span className="flex-1">{tag.name}</span>
              <span className="text-xs text-gray-500">{tag.taskCount || 0}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsTagModalOpen(true)}
          className="w-full text-left px-2 py-1 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          + 新增標籤
        </button>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRename}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            重新命名 / 顏色
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            刪除
          </button>
        </div>
      )}

      <ListFormModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSuccess={onRefresh}
      />

      <ListFormModal
        isOpen={!!editingList}
        list={editingList}
        onClose={() => setEditingList(null)}
        onSuccess={onRefresh}
      />

      <TagFormModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSuccess={onRefresh}
      />

      <TagFormModal
        isOpen={!!editingTag}
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onSuccess={onRefresh}
      />
    </div>
  )
}

function getColorValue(colorName: string): string {
  const colors: Record<string, string> = {
    gray: '#d1d5db',
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
  }
  return colors[colorName] || '#d1d5db'
}
