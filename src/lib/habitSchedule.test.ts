import {
  isScheduledOn,
  calculateStreak,
  calculateMonthStats,
  calculateTotalCheckins,
  isDayFullyCompleted,
} from './habitSchedule'

export function testIsScheduledOn() {
  console.log('Testing isScheduledOn...')

  const daily = { frequencyType: 'daily', weekDays: '', monthDays: '' }
  console.assert(isScheduledOn(daily, '2026-07-22') === true, 'daily 應每天排程')

  const weekly = { frequencyType: 'weekly', weekDays: '1,3,5', monthDays: '' }
  console.assert(isScheduledOn(weekly, '2026-07-20') === true, '2026-07-20 是星期一，應排程')
  console.assert(isScheduledOn(weekly, '2026-07-21') === false, '2026-07-21 是星期二，不應排程')

  const monthly = { frequencyType: 'monthly', weekDays: '', monthDays: '1,15' }
  console.assert(isScheduledOn(monthly, '2026-07-15') === true, '每月 15 號應排程')
  console.assert(isScheduledOn(monthly, '2026-07-16') === false, '每月 16 號不應排程')

  const malformed = { frequencyType: 'weekly', weekDays: 'abc', monthDays: '' }
  console.assert(isScheduledOn(malformed, '2026-07-20') === false, '格式錯誤應容錯回傳 false')

  console.log('✓ isScheduledOn tests passed')
}

export function testCalculateStreak() {
  console.log('Testing calculateStreak...')

  const weekly = { frequencyType: 'weekly', weekDays: '1,3,5', monthDays: '' }
  // 2026-07-20(一) 2026-07-22(三) 2026-07-24(五) 皆已完成，中間的二、四未排程應被跳過
  const logs = [
    { date: '2026-07-20' },
    { date: '2026-07-22' },
    { date: '2026-07-24' },
  ]
  console.assert(
    calculateStreak(weekly, logs, '2026-07-24') === 3,
    '非排程日不應打斷連續天數'
  )

  const logsWithGap = [{ date: '2026-07-24' }]
  console.assert(
    calculateStreak(weekly, logsWithGap, '2026-07-24') === 1,
    '排程但未完成的日子應中斷連續天數'
  )

  console.log('✓ calculateStreak tests passed')
}

export function testCalculateMonthStats() {
  console.log('Testing calculateMonthStats...')

  const weekly = { frequencyType: 'weekly', weekDays: '1,3,5', monthDays: '' }
  const logs = [{ date: '2026-07-01' }, { date: '2026-07-03' }]
  const stats = calculateMonthStats(weekly, logs, 2026, 6) // month 為 0-indexed，6 = 七月

  console.assert(stats.scheduledDays > 0, '該月排程日數應大於 0')
  console.assert(stats.checkedDays === 2, '已打卡排程日數應為 2')
  console.assert(
    Math.abs(stats.rate - stats.checkedDays / stats.scheduledDays) < 1e-9,
    '完成率應為已打卡數 / 排程日數'
  )

  console.log('✓ calculateMonthStats tests passed')
}

export function testCalculateTotalCheckins() {
  console.log('Testing calculateTotalCheckins...')

  console.assert(calculateTotalCheckins([]) === 0, '無記錄時總打卡應為 0')
  console.assert(
    calculateTotalCheckins([{ date: '2026-07-01' }, { date: '2026-07-02' }]) === 2,
    '總打卡應等於記錄數'
  )

  console.log('✓ calculateTotalCheckins tests passed')
}

export function testIsDayFullyCompleted() {
  console.log('Testing isDayFullyCompleted...')

  const habits = [
    { id: 1, frequencyType: 'daily', weekDays: '', monthDays: '' },
    { id: 2, frequencyType: 'weekly', weekDays: '1', monthDays: '' },
  ]

  const allDone = [
    { habitId: 1, date: '2026-07-20' },
    { habitId: 2, date: '2026-07-20' },
  ]
  console.assert(
    isDayFullyCompleted(habits, allDone, '2026-07-20') === true,
    '所有排程習慣皆完成時應回傳 true'
  )

  const partialDone = [{ habitId: 1, date: '2026-07-20' }]
  console.assert(
    isDayFullyCompleted(habits, partialDone, '2026-07-20') === false,
    '尚有未完成排程習慣時應回傳 false'
  )

  console.assert(
    isDayFullyCompleted([], [], '2026-07-20') === false,
    '當天無排程習慣時應回傳 false'
  )

  console.log('✓ isDayFullyCompleted tests passed')
}
