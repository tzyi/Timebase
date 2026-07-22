import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getHabits } from '@/actions/habits'
import { dateToString, getToday } from '@/lib/calendarHelpers'
import HabitPage from '@/components/habit/HabitPage'

export default async function HabitRoutePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const todayStr = dateToString(getToday())
  const result = await getHabits(todayStr)
  const initialHabits = result.success && result.data ? result.data : []

  return <HabitPage initialHabits={initialHabits} initialDateStr={todayStr} />
}
