'use client'

import { useEffect, useState } from 'react'

/** 每分鐘更新一次目前時間，供週／日視圖的「現在時間指示線」使用 */
export function useCurrentTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return now
}
