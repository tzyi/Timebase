import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLists } from '@/actions/lists'
import { getTags } from '@/actions/tags'
import { getTodayViewGrouped } from '@/actions/tasks'
import TasksApp from '@/components/tasks/TasksApp'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const [listsResult, tagsResult, tasksResult] = await Promise.all([
    getLists(),
    getTags(),
    getTodayViewGrouped(),
  ])

  const lists = listsResult.success && listsResult.data ? listsResult.data : []
  const tags = tagsResult.success && tagsResult.data ? tagsResult.data : []
  const { overdue: overdueTasks = [], today: todayTasks = [] } = tasksResult.success && tasksResult.data
    ? tasksResult.data
    : { overdue: [], today: [] }

  return (
    <TasksApp
      initialLists={lists}
      initialTags={tags}
      initialView="today"
      initialTasks={todayTasks}
      initialOverdueTasks={overdueTasks}
    />
  )
}
