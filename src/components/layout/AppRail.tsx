'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AppRailProps {
  userLabel: string
}

const NAV_ITEMS = [
  {
    href: '/tasks',
    label: '任務',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    href: '/calendar',
    label: '月曆',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: '/habit',
    label: '習慣',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
]

export default function AppRail({ userLabel }: AppRailProps) {
  const pathname = usePathname()

  return (
    <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2 flex-shrink-0">
      <Link
        href="/account"
        title="帳號"
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors mb-2 ${
          pathname === '/account'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {userLabel}
      </Link>

      <div className="w-8 border-t border-gray-200 mb-2" />

      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = pathname?.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {icon}
            </svg>
          </Link>
        )
      })}
    </div>
  )
}
