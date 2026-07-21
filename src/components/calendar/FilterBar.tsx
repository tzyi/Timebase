'use client'

import { useState } from 'react'
import { List, Tag } from '@prisma/client'
import { CalendarFiltersState } from './types'

interface FilterBarProps {
  lists: List[]
  tags: Tag[]
  filters: CalendarFiltersState
  onFilterChange: (filters: CalendarFiltersState) => void
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
  { value: 'none', label: '無' },
]

export default function FilterBar({ lists, tags, filters, onFilterChange }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'list' | 'tag' | 'priority' | null>(null)

  const toggleDropdown = (key: 'list' | 'tag' | 'priority') => {
    setOpenDropdown((prev) => (prev === key ? null : key))
  }

  const toggleListId = (id: number) => {
    const next = filters.listIds.includes(id)
      ? filters.listIds.filter((v) => v !== id)
      : [...filters.listIds, id]
    onFilterChange({ ...filters, listIds: next })
  }

  const toggleTagId = (id: number) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((v) => v !== id)
      : [...filters.tagIds, id]
    onFilterChange({ ...filters, tagIds: next })
  }

  const togglePriority = (value: string) => {
    const next = filters.priorities.includes(value)
      ? filters.priorities.filter((v) => v !== value)
      : [...filters.priorities, value]
    onFilterChange({ ...filters, priorities: next })
  }

  const clearAll = () => {
    onFilterChange({ listIds: [], tagIds: [], priorities: [] })
  }

  const hasActiveFilters =
    filters.listIds.length > 0 || filters.tagIds.length > 0 || filters.priorities.length > 0

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2 flex items-center gap-2 flex-wrap">
      <FilterDropdown
        label="清單"
        isOpen={openDropdown === 'list'}
        onToggle={() => toggleDropdown('list')}
        count={filters.listIds.length}
      >
        {lists.map((list) => (
          <label
            key={list.id}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters.listIds.includes(list.id)}
              onChange={() => toggleListId(list.id)}
              className="w-4 h-4 rounded"
            />
            {list.name}
          </label>
        ))}
        {lists.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">無清單</p>}
      </FilterDropdown>

      <FilterDropdown
        label="標籤"
        isOpen={openDropdown === 'tag'}
        onToggle={() => toggleDropdown('tag')}
        count={filters.tagIds.length}
      >
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters.tagIds.includes(tag.id)}
              onChange={() => toggleTagId(tag.id)}
              className="w-4 h-4 rounded"
            />
            {tag.name}
          </label>
        ))}
        {tags.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">無標籤</p>}
      </FilterDropdown>

      <FilterDropdown
        label="優先級"
        isOpen={openDropdown === 'priority'}
        onToggle={() => toggleDropdown('priority')}
        count={filters.priorities.length}
      >
        {PRIORITY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters.priorities.includes(option.value)}
              onChange={() => togglePriority(option.value)}
              className="w-4 h-4 rounded"
            />
            {option.label}
          </label>
        ))}
      </FilterDropdown>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        >
          清除過濾器
        </button>
      )}
    </div>
  )
}

function FilterDropdown({
  label,
  isOpen,
  onToggle,
  count,
  children,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`px-3 py-1.5 text-sm rounded-lg border flex items-center gap-1 ${
          count > 0
            ? 'border-blue-400 text-blue-600 bg-blue-50'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {label}
        {count > 0 && <span className="text-xs">({count})</span>}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          {children}
        </div>
      )}
    </div>
  )
}
