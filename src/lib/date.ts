export function getTodayRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  return { start: today, end: todayEnd }
}

export function getNext7DaysEnd() {
  const end = new Date()
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDueDate(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) {
    return '今天'
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return '明天'
  } else {
    return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
  }
}

export function isToday(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  return dateOnly.getTime() === today.getTime()
}

export function isOverdue(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)
  return dateOnly.getTime() < today.getTime()
}
