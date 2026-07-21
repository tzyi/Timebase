## Why

Timebase 目前只有今日視圖，無法支援月度規劃、周計畫或精確的時間軸管理。用戶需要一個類似 TickTick 的日曆系統，能夠在月、周、日三個層次上可視化和管理任務，並支援精細的時間排程（開始時間、結束時間、整天任務）。

## What Changes

- **新增日曆頁面** (`/calendar`)，支援流暢的 Tab 切換（月 → 周 → 日）
- **擴展 Task 數據模型**：加入 `endTime` 和 `allDay` 字段，支援任務時長和整天任務
- **月視圖**：展示日期格子，每個格子顯示 4 個優先級排序的任務，支援「+N more」展開
- **周視圖**：7 天並排時間軸（每小時一行），重疊任務並排顯示
- **日視圖**：單日詳細時間軸，包含上一天/下一天導航
- **側邊任務列表**：焦點日期的任務列表（全天 → 無時間 → 定時排序）
- **任務詳情 Modal**：縮小版編輯面板，支援快速編輯（標題、備註、時間、優先級、清單、標籤、刪除）
- **多維過濾**：支援按清單、標籤、優先級的組合過濾
- **焦點日期管理**：初始化為今天，支援月視圖點擊、周視圖/日視圖導航同步更新

## Capabilities

### New Capabilities

- `calendar-system`: 完整的日曆視圖系統（月、周、日三層視圖）
- `task-time-management`: 精細的任務時間管理（開始時間、結束時間、整天任務）

### Modified Capabilities

- `task-model`: 擴展 Task 實體以支援時間欄位和整天任務標記

## Impact

**Schema 變更**：
- Prisma schema: `Task.endTime`, `Task.allDay`
- 新 migration

**Server API**：
- 新 Server Actions: `getMonthTasks()`, `getWeekTasks()`, `getDayTasks()`
- 更新 `updateTask()` 支援新欄位

**前端組件**：
- 新路由: `/calendar`
- 新組件庫: `CalendarPage`, `MonthView`, `WeekView`, `DayView`, `TaskDetailModal`, `LeftPanel`, `FilterBar`

**用戶介面**：
- 新頁面，需要樣式 (Tailwind CSS)
- 與現有 `/tasks` 頁面並行

**無破壞性改動** —— 現有 `/tasks` 頁面保持不變
