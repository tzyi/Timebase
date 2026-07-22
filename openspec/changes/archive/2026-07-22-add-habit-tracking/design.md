## Context

`/habit` 路由與導覽入口已存在，但頁面是佔位文字，資料庫完全沒有 Habit 相關 model。既有 Task 系統用 `dueDate: DateTime` + 獨立的 `dueTime`/`endTime` 字串欄位表示日期時間，`List`/`Tag` 用字串 `color`（13 色調色盤）分類。習慣需要一套獨立的資料模型與頻率／打卡判定邏輯，且不得與 Task/List 產生任何耦合。

## Goals / Non-Goals

**Goals:**
- 習慣的建立、編輯、封存/解除封存
- 三種頻率（每天／每週選星期幾／每月選幾號）決定「某天是否排程」
- 每日打勾（含過去日期補打勾），以排程日為基準計算連續天數與完成率
- 週打勾條的「當天全部完成」自動判定
- 桌面雙欄／手機單欄的清單＋詳細互動
- 手動拖曳排序

**Non-Goals:**
- 打卡日誌（文字備註）
- 習慣列的近 7 天迷你點陣圖
- 跨全部習慣的整體總覽儀表板（統計卡僅綁定單一選中習慣）
- 提醒通知／推播

## Decisions

### 1. HabitLog 用日期字串主鍵，不用 DateTime
沿用 Task 的 `dueTime`/`endTime` 已證明的字串慣例，`HabitLog.date` 存 `YYYY-MM-DD` 字串（非 `DateTime`），避免時區轉換造成「昨天/今天」判斷錯誤（`Date` 型別在 SQLite 存的是 UTC timestamp，日期加減容易踩時區陷阱）。`@@unique([habitId, date])` 作為打卡的唯一鍵，打勾＝ upsert `completed: true`（或直接 create/delete，見下方決策 3）。

### 2. Frequency 用三個欄位表示，不用 JSON blob
```prisma
model Habit {
  id            Int      @id @default(autoincrement())
  userId        Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String
  description   String   @default("")
  emoji         String   @default("✅")
  color         String   @default("blue")

  frequencyType String   @default("daily") // "daily" | "weekly" | "monthly"
  weekDays      String   @default("")      // frequencyType=weekly 時："1,3,5"（1=一...7=日）
  monthDays     String   @default("")      // frequencyType=monthly 時："1,15,28"

  archived      Boolean  @default(false)
  sortOrder     Int      @default(0)

  logs          HabitLog[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

model HabitLog {
  id        Int     @id @default(autoincrement())
  habitId   Int
  habit     Habit   @relation(fields: [habitId], references: [id], onDelete: Cascade)
  date      String  // YYYY-MM-DD
  completed Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([habitId, date])
  @@index([habitId])
}
```
**為什麼不用 JSON 欄位存頻率**：SQLite 沒有原生 JSON 型別查詢優勢，這裡的頻率規則只需要在應用層（`src/lib/habitSchedule.ts`）算「這天排不排程」，用逗號分隔字串足夠簡單且可讀（跟 `TaskTag` 多對多相比，頻率規則不需要關聯查詢，不必拆表）。`weekDays`/`monthDays` 只在對應 `frequencyType` 下有值，另一欄位保持空字串。

**替代方案考慮**：曾考慮建立 `HabitSchedule` 子表（一列一個排程日），但這對「每天」這種最常見情境是過度設計；字串欄位配合 `src/lib/habitSchedule.ts` 的純函式已足夠覆蓋三種情境。

### 3. 打勾用「有記錄=完成，無記錄=未完成」，不用 completed 布林切換
`HabitLog` 存在即代表當天完成；取消打勾＝刪除該筆記錄，而非把 `completed` 改成 `false`。這樣「連續天數」「月完成率」的查詢只需要 `COUNT` 記錄數，不必額外過濾 `completed = true`，語意更單純。`completed` 欄位保留是为了未來可能的「跳過」狀態擴充，但本次 change 不使用第三態，一律視為 `true`。

### 4. 排程判定與統計邏輯放在共用函式，前後端（Server Action）共用
新增 `src/lib/habitSchedule.ts`：
- `isScheduledOn(habit, dateStr): boolean`：依 `frequencyType`/`weekDays`/`monthDays` 判斷某天是否排程
- `calculateStreak(habit, logs, today): number`：從今天往回數，只檢查排程日是否有 log，遇到「排程但沒打卡」中斷；非排程日直接跳過（不查、不打斷）
- `calculateMonthStats(habit, logs, year, month): { checkedDays, scheduledDays, rate }`：月打卡天數 = 該月已打勾的排程日數；完成率 = 月打卡天數 / 該月排程天數（非整月天數）
- `calculateTotalCheckins(logs): number`：全部歷史打卡記錄數（總打卡）

這些是純函式（輸入 habit + logs 陣列，輸出數字），方便單元測試（比照現有 `calendarHelpers.test.ts` 的模式），且 Server Action 與未來若要在別處重用統計邏輯都能直接呼叫。

### 5. 週打勾條的「全部完成」是衍生計算，不落地存欄位
頂部 7 天日期條的打勾狀態不是資料庫欄位，而是頁面載入時用「當天所有排程中的 habit 是否都在 logs 裡有記錄」現算出來（`src/lib/habitSchedule.ts` 的 `isDayFullyCompleted(habits, logs, dateStr)`）。避免多一份需要同步的衍生狀態。

### 6. 封存不刪除資料，`archived: Boolean` 過濾
封存的習慣 `archived = true`，查詢每日清單時 `where: { archived: false }`；封存清單頁另外查 `archived: true`。解除封存只是把旗標改回 `false`，`HabitLog` 全程不受影響（歷史照舊存在）。這與 Task 目前的硬刪除模式（`onDelete: Cascade`）不同，因為使用者明確要求「保留歷史紀錄」。

### 7. Server Actions 拆分
- `src/actions/habits.ts`：`getHabits()`（依日期算當天排程清單）、`getArchivedHabits()`、`createHabit()`、`updateHabit()`、`archiveHabit()`、`unarchiveHabit()`、`reorderHabits()`
- `src/actions/habitLogs.ts`：`toggleHabitLog(habitId, date)`（有記錄則刪除、無記錄則新增，前端不需要分開呼叫 check/uncheck）、`getHabitLogs(habitId, fromDate, toDate)`（供月曆與統計使用）

### 8. 元件結構
```
src/components/habit/
├── HabitPage.tsx          # 頂層狀態容器（比照 CalendarPage 模式）：focusDate、selectedHabitId、habits/logs 快取
├── WeekStrip.tsx          # 頂部一週日期條
├── HabitList.tsx / HabitRow.tsx   # 清單與單列（含拖曳排序、打勾框）
├── HabitDetailPanel.tsx   # 右側/手機獨立頁：統計卡 + 月曆
├── HabitStatsCards.tsx
├── HabitCalendar.tsx
├── HabitFormModal.tsx     # 新增/編輯（emoji 輸入、顏色選擇沿用 ListFormModal 樣式、頻率設定 UI）
└── ArchivedHabitsModal.tsx
```
拖曳排序沿用專案現有拖曳套件/手法（需檢查 `TaskListView`/`BoardColumn` 目前用什麼庫，維持一致，不引入新依賴）。

### 9. 手機/桌面切版
比照 `CalendarPage` 的「單頁 + 內部狀態切換」模式，不開新路由。`HabitPage.tsx` 用 `selectedHabitId` 是否有值 + Tailwind 響應式 class（`md:` 斷點）控制：手機版 `selectedHabitId` 有值時清單隱藏、詳細頁全螢幕顯示並帶返回按鈕；桌面版兩欄永遠並排，右欄未選擇時顯示空狀態提示。

## Risks / Trade-offs

- [風險] `weekDays`/`monthDays` 用逗號分隔字串，型別不安全，寫入時若格式錯誤會讓排程判定整個失效 → 緩解：在 Server Action 層做嚴格驗證（只允許 1-7 或 1-31 的整數、逗號分隔），並在 `habitSchedule.ts` 做 parse 時容錯（parse 失敗視為未排程，不丟例外炸頁面）
- [風險] 「月完成率只算排程日」的邏輯較特殊，若未來新增其他頻率型態（例如「每 N 天」）需要同步修改 `habitSchedule.ts` 多處函式 → 緩解：所有排程/統計邏輯集中在單一檔案並附測試，降低散落風險
- [取捨] 週打勾條與「全部完成」現算而非落地存儲，頁面每次載入都要把當天所有 habit 的 logs 抓出來比對 → 習慣數量在個人使用情境下通常是幾十筆以內，效能可接受；先不做額外的彙總表

## Migration Plan

1. 於 `prisma/schema.prisma` 新增 `Habit`、`HabitLog` model
2. `npx prisma migrate dev --name add_habit_tracking` 產生 migration（新增資料表，不影響既有 Task/List 資料）
3. `npx prisma generate` 更新 Prisma Client
4. 無需資料回填（全新資料表，無既有資料需要遷移）
5. Rollback：新功能為獨立新增表，若需回滾直接 `prisma migrate resolve` 到前一版本即可，不影響既有功能

## Open Questions

（無待決問題；範圍與規則已在 explore 階段與使用者確認完畢）
