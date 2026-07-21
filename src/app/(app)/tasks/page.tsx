import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getLists, getFolders } from '@/actions/lists'
import { getTags } from '@/actions/tags'
import { getTodayViewGrouped } from '@/actions/tasks'
import TasksApp from '@/components/tasks/TasksApp'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const [listsResult, foldersResult, tagsResult, tasksResult] = await Promise.all([
    getLists(),
    getFolders(),
    getTags(),
    getTodayViewGrouped(),
  ])

  const lists = listsResult.success && listsResult.data ? listsResult.data : []
  const folders = foldersResult.success && foldersResult.data ? foldersResult.data : []
  const tags = tagsResult.success && tagsResult.data ? tagsResult.data : []
  const { overdue: overdueTasks = [], today: todayTasks = [] } = tasksResult.success && tasksResult.data
    ? tasksResult.data
    : { overdue: [], today: [] }

  return (
    <TasksApp
      initialLists={lists}
      initialFolders={folders}
      initialTags={tags}
      initialView="today"
      initialTasks={todayTasks}
      initialOverdueTasks={overdueTasks}
    />
  )
}
