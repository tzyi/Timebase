'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('請填寫所有欄位')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('電子郵件或密碼不正確')
      } else if (result?.ok) {
        router.push('/app/tasks')
      }
    } catch (err) {
      setError('登入失敗，請稍後再試')
      console.error('登入錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="font-bold text-lg">Timebase</span>
        </div>
        <Link
          href="/register"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          還沒有賬戶？
        </Link>
      </div>

      {/* 主體內容 */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          {/* 標題 */}
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            登錄
          </h1>

          {/* 錯誤訊息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 郵箱欄位 */}
            <div>
              <input
                type="email"
                placeholder="郵箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>

            {/* 密碼欄位 */}
            <div>
              <input
                type="password"
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>

            {/* 忘記密碼 */}
            <div className="text-right">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                忘記密碼
              </button>
            </div>

            {/* 登錄按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {isLoading ? '登錄中...' : '登錄'}
            </button>
          </form>

          {/* 分割線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 社交登錄按鈕 */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google 登錄
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.05 13.5c-.91 0-1.74.35-2.36.92.63 1.91 1.48 3.66 2.52 5.12.72.01 1.4.21 2.01.58 1.14 1.01 1.87 2.5 1.87 4.18 0 .79-.15 1.54-.42 2.23.69.27 1.44.52 2.23.71.42-.65.66-1.44.66-2.29 0-2.55-1.56-4.75-3.8-5.72.46-1.23.74-2.55.74-3.94 0-4.41-3.59-8-8-8s-8 3.59-8 8 3.59 8 8 8z" />
              </svg>
              Apple 登錄
            </button>
          </div>

          {/* 註冊連結 */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              還沒有賬戶？{' '}
              <Link href="/register" className="text-blue-500 hover:text-blue-600 font-medium">
                註冊
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
