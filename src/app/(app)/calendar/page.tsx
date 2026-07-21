import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLists } from '@/actions/lists'
import { getTags } from '@/actions/tags'
import { getMonthTasks } from '@/actions/tasks'
import CalendarPage from '@/components/calendar/CalendarPage'

export const dynamic = 'force-dynamic'

export default async function CalendarRoutePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const today = new Date()

  const [listsResult, tagsResult, monthTasksResult] = await Promise.all([
    getLists(),
    getTags(),
    getMonthTasks(today.getFullYear(), today.getMonth()),
  ])

  const lists = listsResult.success && listsResult.data ? listsResult.data : []
  const tags = tagsResult.success && tagsResult.data ? tagsResult.data : []
  const monthTasks = monthTasksResult.success && monthTasksResult.data ? monthTasksResult.data : {}

  return (
    <CalendarPage
      initialLists={lists}
      initialTags={tags}
      initialMonthTasks={monthTasks}
    />
  )
}
