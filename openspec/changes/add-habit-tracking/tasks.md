## 1. 資料模型

- [x] 1.1 於 `prisma/schema.prisma` 新增 `Habit` model（userId, name, description, emoji, color, frequencyType, weekDays, monthDays, archived, sortOrder, timestamps）
- [x] 1.2 於 `prisma/schema.prisma` 新增 `HabitLog` model（habitId, date, completed, timestamps，`@@unique([habitId, date])`）
- [x] 1.3 執行 `npx prisma migrate dev --name add_habit_tracking` 產生 migration
- [x] 1.4 執行 `npx prisma generate` 更新 Prisma Client

## 2. 共用邏輯（純函式）

- [x] 2.1 新增 `src/lib/habitSchedule.ts`：`isScheduledOn(habit, dateStr)` 依 frequencyType/weekDays/monthDays 判斷排程日，parse 失敗時容錯回傳 false
- [x] 2.2 於 `habitSchedule.ts` 新增 `calculateStreak(habit, logs, todayStr)`：從今天往回數排程日，遇未完成排程日中斷，非排程日跳過
- [x] 2.3 於 `habitSchedule.ts` 新增 `calculateMonthStats(habit, logs, year, month)`：回傳該月已打卡排程日數、該月排程日總數、完成率
- [x] 2.4 於 `habitSchedule.ts` 新增 `calculateTotalCheckins(logs)`：計算總打卡天數
- [x] 2.5 於 `habitSchedule.ts` 新增 `isDayFullyCompleted(habits, logs, dateStr)`：判斷某天所有排程中的習慣是否全部完成（供週打勾條使用）
- [x] 2.6 新增 `src/lib/habitSchedule.test.ts`，涵蓋每天/每週/每月排程判定、跳過非排程日的連續天數計算、完成率計算等情境

## 3. Server Actions

- [x] 3.1 新增 `src/actions/habits.ts`：`getHabits(dateStr)`（回傳當天排程中的未封存習慣，含當天是否完成）
- [x] 3.2 於 `habits.ts` 新增 `getHabitById(id)`、`getArchivedHabits()`
- [x] 3.3 於 `habits.ts` 新增 `createHabit(input)`、`updateHabit(id, input)`（含頻率欄位驗證：weekDays 限 1-7、monthDays 限 1-31）
- [x] 3.4 於 `habits.ts` 新增 `archiveHabit(id)`、`unarchiveHabit(id)`
- [x] 3.5 於 `habits.ts` 新增 `reorderHabits(orderedIds)` 更新 sortOrder
- [x] 3.6 新增 `src/actions/habitLogs.ts`：`toggleHabitLog(habitId, dateStr)`（無記錄則新增、有記錄則刪除）
- [x] 3.7 於 `habitLogs.ts` 新增 `getHabitLogsInRange(habitId, fromDateStr, toDateStr)`（供月曆與統計使用）
- [x] 3.8 於 `habitLogs.ts` 新增 `getLogsForHabitsOnDate(habitIds, dateStr)`（供週打勾條計算全部完成使用）
- [x] 3.9 所有 action 比照現有 `src/actions/tasks.ts` 模式做 userId 隔離與 session 驗證

## 4. 頁面與狀態容器

- [x] 4.1 新增 `src/components/habit/HabitPage.tsx`：頂層狀態（focusDate 週範圍、selectedHabitId、habits/logs 快取），比照 `CalendarPage.tsx` 模式
- [x] 4.2 改寫 `src/app/(app)/habit/page.tsx`：server component 驗證 session、抓取初始一週習慣清單，渲染 `HabitPage`
- [x] 4.3 於 `HabitPage.tsx` 實作響應式切版邏輯：手機版依 `selectedHabitId` 是否有值切換清單/詳細畫面；桌面版兩欄並排

## 5. 清單與週打勾條元件

- [x] 5.1 新增 `src/components/habit/WeekStrip.tsx`：顯示最近一週日期，依 `isDayFullyCompleted` 顯示自動打勾狀態
- [x] 5.2 新增 `src/components/habit/HabitList.tsx`：渲染當天排程中的習慣列表
- [x] 5.3 新增 `src/components/habit/HabitRow.tsx`：單一習慣列（emoji、名稱、說明、打勾框），點擊打勾框呼叫 `toggleHabitLog`
- [x] 5.4 為 `HabitList` 加入拖曳排序（沿用專案既有拖曳套件/手法，比照 `TaskListView`/`BoardColumn` 的做法），拖曳結束呼叫 `reorderHabits`
- [x] 5.5 點選 `HabitRow` 觸發 `selectedHabitId` 更新，載入右欄/手機詳細畫面

## 6. 習慣詳細面板

- [x] 6.1 新增 `src/components/habit/HabitDetailPanel.tsx`：容器，組合統計卡與月曆，手機版含返回按鈕
- [x] 6.2 新增 `src/components/habit/HabitStatsCards.tsx`：顯示月打卡天數／總打卡天數／月完成率／目前連續天數（呼叫 `habitSchedule.ts` 純函式計算）
- [x] 6.3 新增 `src/components/habit/HabitCalendar.tsx`：當月月曆，標示排程日的完成狀態，點擊過去排程日可補打勾/取消（呼叫 `toggleHabitLog`）
- [x] 6.4 月曆與統計卡在切換月份時重新呼叫 `getHabitLogsInRange`

## 7. 新增/編輯與封存管理

- [x] 7.1 新增 `src/components/habit/HabitFormModal.tsx`：名稱、說明、emoji 輸入、顏色選擇（沿用 `ListFormModal.tsx` 的 13 色 UI）、頻率設定（daily/weekly 複選星期/monthly 複選日期）
- [x] 7.2 表單送出呼叫 `createHabit`/`updateHabit`，成功後刷新清單
- [x] 7.3 新增 `src/components/habit/ArchivedHabitsModal.tsx`：列出封存習慣，提供解除封存操作
- [x] 7.4 於 `HabitList`/`HabitPage` 加入封存習慣的入口按鈕與封存操作（於 `HabitRow` 或詳細面板提供「封存」按鈕）

## 8. 驗證

- [x] 8.1 執行 `npm run lint` 確認無新增 lint 錯誤
- [x] 8.2 執行 `npx prisma migrate dev` 確認 migration 可正常套用於本地資料庫
- [ ] 8.3 執行 `npm run dev`，手動驗證：建立三種頻率的習慣、當日打勾、週打勾條自動完成、過去日期補打勾、封存/解除封存、拖曳排序、桌面雙欄與手機單欄切版
- [x] 8.4 確認 `/tasks` 與 `/calendar` 頁面行為與畫面未受影響（未修改相關檔案；`npm run dev` 記錄顯示 `/tasks` 正常編譯並回傳 200）
