import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'

export default async function AccountPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { name, email } = session.user ?? {}

  return (
    <div className="h-full overflow-y-auto bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">帳號詳情</h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-semibold">
            {(name || email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{name || '未設定名稱'}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
          >
            登出帳號
          </button>
        </form>
      </div>
    </div>
  )
}
