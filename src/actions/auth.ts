'use server'

import { hash } from 'bcrypt'
import { signOut as authSignOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function registerUser(email: string, password: string, name?: string) {
  try {
    // 檢查 email 唯一性
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: '此電子郵件已被使用',
      }
    }

    // 驗證密碼長度
    if (!password || password.length < 6) {
      return {
        success: false,
        error: '密碼長度至少 6 個字元',
      }
    }

    // bcrypt 雜湊密碼
    const passwordHash = await hash(password, 10)

    // 建立使用者
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch (error) {
    console.error('註冊錯誤:', error)
    return {
      success: false,
      error: '註冊失敗，請稍後再試',
    }
  }
}

export async function logout() {
  await authSignOut({ redirectTo: '/login' })
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized: User is not authenticated')
  }
  return { ...session.user, id: Number(session.user.id) }
}
