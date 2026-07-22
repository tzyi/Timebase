'use client'

import { useEffect, useState } from 'react'
import { Habit } from '@prisma/client'
import { createHabit, updateHabit } from '@/actions/habits'
import { ensureOnline } from '@/lib/toast'

interface HabitFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  habit?: Habit | null
}

const colors = ['gray', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink']
const colorHex: { [key: string]: string } = {
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
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function parseDays(value: string): number[] {
  return value
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n))
}

export default function HabitFormModal({ isOpen, onClose, onSuccess, habit = null }: HabitFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [color, setColor] = useState('blue')
  const [frequencyType, setFrequencyType] = useState('daily')
  const [weekDays, setWeekDays] = useState<number[]>([])
  const [monthDays, setMonthDays] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!habit

  useEffect(() => {
    if (!isOpen) return
    setName(habit?.name ?? '')
    setDescription(habit?.description ?? '')
    setEmoji(habit?.emoji ?? '✅')
    setColor(habit?.color ?? 'blue')
    setFrequencyType(habit?.frequencyType ?? 'daily')
    setWeekDays(habit ? parseDays(habit.weekDays) : [])
    setMonthDays(habit ? parseDays(habit.monthDays) : [])
  }, [isOpen, habit])

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const toggleMonthDay = (day: number) => {
    setMonthDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ensureOnline()) return
    setIsLoading(true)

    try {
      const input = {
        name,
        description,
        emoji,
        color,
        frequencyType,
        weekDays: frequencyType === 'weekly' ? weekDays : undefined,
        monthDays: frequencyType === 'monthly' ? monthDays : undefined,
      }
      const result = isEditing ? await updateHabit(habit!.id, input) : await createHabit(input)
      if (result.success) {
        onClose()
        onSuccess()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const canSubmit =
    name.trim().length > 0 &&
    (frequencyType !== 'weekly' || weekDays.length > 0) &&
    (frequencyType !== 'monthly' || monthDays.length > 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {isEditing ? '編輯習慣' : '新增習慣'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-full px-2 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名稱</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：早起"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">說明</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="簡單說明（選填）"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">顏色</label>
            <div className="grid grid-cols-7 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c
                      ? 'border-gray-400 dark:border-gray-500 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ backgroundColor: colorHex[c] }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">頻率</label>
            <div className="flex gap-2">
              {[
                { value: 'daily', label: '每天' },
                { value: 'weekly', label: '每週' },
                { value: 'monthly', label: '每月' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequencyType(value)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    frequencyType === value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {frequencyType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">選擇星期</label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label, i) => {
                  const day = i + 1
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekDay(day)}
                      className={`py-1.5 text-xs rounded-lg border transition-colors ${
                        weekDays.includes(day)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {frequencyType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">選擇日期</label>
              <div className="grid grid-cols-7 gap-1">
                {MONTH_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleMonthDay(day)}
                    className={`py-1.5 text-xs rounded-lg border transition-colors ${
                      monthDays.includes(day)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? '保存中...' : isEditing ? '儲存' : '新增'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
