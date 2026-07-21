'use client'

import { useState } from 'react'
import { createList } from '@/actions/lists'

interface ListFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const colors = ['gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink']

export default function ListFormModal({ isOpen, onClose, onSuccess }: ListFormModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('blue')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createList(name, color)
      if (result.success) {
        setName('')
        setColor('blue')
        onClose()
        onSuccess()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">新增清單</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">清單名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：工作"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">顏色</label>
            <div className="grid grid-cols-7 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-gray-400 ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor:
                      c === 'gray' ? '#d1d5db' :
                      c === 'red' ? '#ef4444' :
                      c === 'orange' ? '#f97316' :
                      c === 'amber' ? '#fbbf24' :
                      c === 'yellow' ? '#facc15' :
                      c === 'lime' ? '#84cc16' :
                      c === 'green' ? '#22c55e' :
                      c === 'teal' ? '#14b8a6' :
                      c === 'cyan' ? '#06b6d4' :
                      c === 'blue' ? '#3b82f6' :
                      c === 'indigo' ? '#6366f1' :
                      c === 'purple' ? '#a855f7' :
                      c === 'pink' ? '#ec4899' :
                      '#d1d5db',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? '保存中...' : '新增'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
