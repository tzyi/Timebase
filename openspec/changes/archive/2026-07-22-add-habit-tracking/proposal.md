## Why

Timebase 目前只有 tasks（清單）與 calendar（月曆）兩種視圖，都是針對「有期限的任務」設計。使用者需要另一種完全獨立的追蹤方式，用來記錄「每天／每週／每月要重複做的習慣」（例如早起、喝水、運動），並能一眼看到打卡狀況與連續天數。導覽列（AppRail / BottomNav）已經預留「習慣」入口並指向 `/habit`，但該頁目前只是佔位文字，尚無任何實際功能與資料模型。

## What Changes

- 新增 `Habit` 與 `HabitLog` 兩個 Prisma model，與既有 `Task`/`List` 完全獨立（不共用資料表，不出現在 tasks 或 calendar 頁面）
- 新增習慣的 CRUD：建立／編輯／封存／解除封存（不做硬刪除，封存後保留歷史紀錄）
- 習慣支援三種頻率設定：每天、每週選星期幾、每月選幾號；用以決定某天該習慣是否「排程」
- 每日打勾：使用者可對「今天」及「過去日期」補打勾／取消（非唯讀），以 `(habitId, date)` 唯一記錄完成狀態
- 習慣清單頁（`/habit`）：
  - 頂部一週日期橫向選擇條，當某天「當天排程的習慣」全部完成時自動打勾（系統推算，非手動）
  - 習慣列表：只顯示「當天有排程」的習慣，含 emoji、名稱、簡單說明、當天打勾框；支援手動拖曳排序（`sortOrder`）
  - 點選單一習慣顯示右側（或手機版另開頁面）詳細資料：統計卡（月打卡天數／總打卡天數／月完成率／目前連續天數）＋當月月曆打卡狀態
  - 連續天數與完成率的計算只計入「排程日」，跳過非排程日（不會被非排程日打斷，也不計入分母）
- 手機版採單欄：先顯示清單，點選習慣後才進入該習慣的詳細畫面
- 顏色沿用 List/Tag 現有的 13 色調色盤；emoji 由使用者自由輸入

## Capabilities

### New Capabilities
- `habit-tracking`：習慣的建立、編輯、封存/解除封存、頻率設定、每日打勾、連續天數與完成率統計、月曆檢視等完整能力

### Modified Capabilities
（無；不修改 task-management、calendar-system 等既有能力的需求，習慣資料與邏輯完全獨立）

## Impact

- **資料庫**：新增 `Habit`、`HabitLog` model 至 `prisma/schema.prisma`，需要一筆新的 migration
- **Server Actions**：新增 `src/actions/habits.ts`（habit CRUD、封存/解除封存）與 `src/actions/habitLogs.ts`（打勾/取消、統計查詢）
- **路由**：替換 `src/app/(app)/habit/page.tsx` 佔位內容為實際頁面（server component 抓取初始資料）
- **元件**：新增 `src/components/habit/` 目錄下的元件（清單、週選擇條、習慣列、詳細面板、統計卡、月曆、新增/編輯表單、封存清單）
- **不影響**：`src/actions/tasks.ts`、`src/components/tasks/`、`src/components/calendar/` 等既有任務/月曆相關程式碼
