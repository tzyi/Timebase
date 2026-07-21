'use client'

import { List, Tag } from '@prisma/client'
import { useState } from 'react'
import ListFormModal from './ListFormModal'
import TagFormModal from './TagFormModal'

type ViewKind = 'today' | 'next7days' | 'inbox' | 'completed'

interface SidebarProps {
  lists: (List & { uncompletedCount?: number })[]
  tags: (Tag & { taskCount?: number })[]
  selectedView: ViewKind | { kind: 'list'; listId: number } | { kind: 'tag'; tagId: number }
  onSelectView: (view: any) => void
  onRefresh: () => void
}

export default function Sidebar({
  lists,
  tags,
  selectedView,
  onSelectView,
  onRefresh,
}: SidebarProps) {
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)

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

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
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

      <ListFormModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSuccess={onRefresh}
      />

      <TagFormModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
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
