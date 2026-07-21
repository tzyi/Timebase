'use client'

import { useToasts, dismissToast } from '@/lib/toast'

export default function Toaster() {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-sm text-center cursor-pointer"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
