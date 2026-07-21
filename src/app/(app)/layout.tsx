import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AppRail from '@/components/layout/AppRail'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const userLabel = (session.user?.name || session.user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AppRail userLabel={userLabel} />
      <div className="flex-1 min-w-0 h-screen overflow-hidden">{children}</div>
    </div>
  )
}
