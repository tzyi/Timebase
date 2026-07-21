## 背景

Timebase 目前有一個任務頁面（`/tasks`），以逾期/今天的方式顯示今日視圖。日曆系統需要建立為新頁面（`/calendar`），與現有任務頁面共存，而不破壞任何現有功能。

**目前的技術棧：**
- Next.js 15 (App Router)
- React 19 + TypeScript
- Prisma ORM with SQLite
- NextAuth 認證
- Tailwind CSS 樣式設定
- Server Actions 進行更新

**目前的任務資料模型：**
```typescript
Task {
  id, userId, listId, title, note, dueDate, priority, status, completedAt, sortOrder
}
```

**所需的資料庫架構補充：**
- `Task.endTime`（String?，HH:MM 格式）
- `Task.allDay`（Boolean，預設為 false）
- Prisma 遷移以新增這些欄位

## 目標 / 非目標

**目標：**
1. 實現完整的三層日曆系統（月/週/日視圖），可透過 `/calendar` 存取
2. 支援精細的時間管理，包括開始時間、結束時間和整天任務的區分
3. 啟用流暢的基於選項卡的視圖切換，無須頁面重新載入
4. 支援多維過濾（清單、標籤、優先級）跨越所有視圖
5. 允許透過模式介面快速編輯任務，並立即保存
6. 在週/日視圖中使用基於列的布局顯示重疊的任務
7. 跨視圖切換時保持焦點日期狀態（初始化為今天）
8. 保持與現有 `/tasks` 頁面的向後相容性

**非目標：**
1. 重複性任務或事件範本
2. 拖放任務重新排程（僅靜態時間定位）
3. 從日曆進行子任務管理（留給 `/tasks` 頁面）
4. 即時協作或共享
5. 行動優先的回應式設計（優先最佳化桌面）
6. 日曆匯出/匯入（iCal 等）

## 決策

### 決策 1：單頁日曆元件與多頁架構
**選擇：** 單頁，具有內部選項卡狀態管理（React useState）

**理由：**
- 避免 URL 變動（每個互動多次路由切換）
- 無縫地跨視圖保持過濾狀態
- 更快速地在月/週/日之間切換（無須伺服器往返）
- TickTick 般的使用者體驗需要即時回饋

**考慮過的替代方案：** 基於 URL 的路由（`/calendar/month`、`/calendar/week`）
- 優點：瀏覽器歷史導航、深度連結
- 缺點：切換較慢、需要重設過濾狀態、過於複雜

### 決策 2：資料擷取的 Server Actions
**選擇：** 在 Server Actions 中使用 Prisma 查詢（`getMonthTasks()`、`getWeekTasks()`、`getDayTasks()`）

**理由：**
- 利用現有的 Server Action 模式（已在 `/tasks` 中使用）
- 簡化授權（在伺服器端檢查 `userId`）
- 減少客戶端狀態複雜性
- 查詢可能很複雜（過濾、排序）→ 在伺服器上更好

**實現模式：**
```typescript
export async function getMonthTasks(year, month, filters) {
  const user = await requireAuth()
  const tasks = await prisma.task.findMany({
    where: { userId: user.id, /* filters */ }
  })
  return grouped by date
}
```

### 決策 3：作為實用函數的任務時間分類
**選擇：** 使用 `classifyTaskTime()` 輔助函數將任務分類為 `NO_TIME | ALL_DAY | TIMED`

**理由：**
- 任務在架構中沒有 `type` 欄位；分類是計算出來的
- 跨視圖保持一致（月、週、日、側邊面板）
- 易於重複使用和測試

**實現：**
```typescript
function classifyTaskTime(task: Task): TaskTimeType {
  if (task.allDay) return 'ALL_DAY'
  if (!task.dueTime && !task.endTime) return 'NO_TIME'
  return 'TIMED'
}
```

### 決策 4：側邊面板始終顯示焦點日期任務
**選擇：** 左側邊面板顯示焦點日期任務的固定列表（按任務類型排序）

**理由：**
- 提供一致的使用者體驗（面板內容變化 = 焦點日期變化）
- 分離關注：日曆網格（月）對比任務列表（日詳細資訊）
- 按一下側邊面板中的任務即可開啟模式（不是內嵌編輯）

**流程：**
- 使用者在月視圖中按一下日期 → focusDate 狀態更新 → 側邊面板重新擷取 → 顯示任務

### 決策 5：任務編輯模式（縮小版本）
**選擇：** 置中模式（不是側邊抽屜）、簡化的使用者介面、手動保存/取消

**理由：**
- 專注編輯體驗（全螢幕，無干擾）
- 比完整的 TaskDetailPanel 輕巧（無子任務管理）
- 手動儲存符合模式使用者體驗預期
- 透過按鈕刪除並確認

**與 TaskDetailPanel 的差異：**
- 無子任務管理
- 包括新的時間欄位（dueTime、endTime、allDay）
- 保存/取消按鈕（不是模糊自動保存）

### 決策 6：透過 `revalidatePath()` 立即保存
**選擇：** 模式提交 → `updateTask()` → `revalidatePath('/calendar')` → 頁面重新擷取

**理由：**
- 簡單、確定性（無樂觀更新狀態）
- 伺服器是真實來源
- 對使用者的即時回饋（200ms 網路延遲可接受）
- 避免複雜的回復邏輯

**考慮過的替代方案：** 樂觀更新
- 優點：更快的感知使用者體驗
- 缺點：複雜性、錯誤處理、潛在不同步

### 決策 7：使用基於列的定位的時間重疊布局
**選擇：** 計算重疊的任務組、指派列索引、使用 CSS `left` 和 `width`

**理由：**
- 標準日曆應用程式模式（Google 日曆、Outlook）
- 可預測的布局（列索引 0,1,2,... 從左到右）
- 可擴展（處理任何數量的重疊）

**演算法：**
1. 按開始時間對任務進行排序
2. 掃描時間軸；尋找重疊間隔
3. 針對每個間隔，指派列（0、1、2...）
4. 列寬 = 100% / columnCount
5. 從時間偏移計算上/高度

### 決策 8：時間槽高度
**選擇：** 每小時固定 60px 的每小時網格

**理由：**
- 日曆應用程式的標準（可讀、可捲動）
- 簡單數學：top = (minutes / 60) * 60px

**考慮過的替代方案：** 30 分鐘插槽
- 優點：更精細的粒度
- 缺點：更多垂直捲動、更密集的使用者介面

### 決策 9：過濾使用者介面位置和行為
**選擇：** 日曆頂部的過濾列（清單/標籤/優先級的多選下拉式清單）

**理由：**
- 可見、可存取、非侵入式
- 可結合過濾（AND 邏輯）
- 過濾適用於所有視圖（月/週/日）

**實現：**
- DropdownFilter 元件（可重複使用）
- 過濾狀態儲存在 CalendarPage 元件中
- 透過查詢參數傳遞給擷取函數

### 決策 10：架構遷移方法
**選擇：** 建立含有 `endTime` 和 `allDay` 欄位的遷移檔案

**理由：**
- Prisma 自動處理架構版本控制
- 向後相容（新欄位為選擇性）
- git 中清晰的稽核軌跡

**遷移命令：**
```bash
npx prisma migrate dev --name add_task_time_fields
```

## 風險 / 權衡

### 風險 1：生產環境中的架構遷移
**緩解：**
- 在 git 中包括遷移、部署前進行審查
- 先在預備環境中進行測試
- SQLite 支援安全的使用預設值新增列

### 風險 2：複雜的時間重疊計算
**緩解：**
- 單獨對覆蓋演算法進行單元測試
- 從更簡單的情況開始（2-3 個重疊）；反覆擴展
- 周/日視圖中的視覺質量保證

### 風險 3：過濾狀態複雜性
**緩解：**
- 使用簡單物件作為過濾狀態：`{ listIds: [], tagIds: [], priorities: [] }`
- 不可變更新（避免變異錯誤）
- 在 CalendarPage 元件中集中

### 風險 4：大日期範圍的查詢速度緩慢
**緩解：**
- 月視圖查詢有界（最多 30-31 天）
- 週視圖查詢有界（7 天）
- 日視圖單一日期（非常快）
- 如果需要，在 `(userId, dueDate)` 上新增資料庫索引（第 2 階段）

### 風險 5：模式保存-刪除確認時序
**緩解：**
- 刪除前顯示確認對話框
- 防止意外刪除（需要 2 次點擊）

## 遷移計畫

### 第 0 階段：架構更新
1. 建立 Prisma 遷移：`npx prisma migrate dev --name add_task_time_fields`
2. 將 `endTime` 和 `allDay` 新增到 Task 架構
3. 更新 `updateTask()` 操作以接受新欄位

### 第 1 階段：Server Actions
1. 在 `src/actions/tasks.ts` 中實現 `getMonthTasks()`、`getWeekTasks()`、`getDayTasks()`
2. 在 `src/lib/calendarHelpers.ts` 中建立實用函數（分類、排序、日期數學）
3. 使用範例資料測試查詢

### 第 2 階段：頁面框架和月視圖
1. 使用狀態管理建立 `CalendarPage` 元件
2. 實現 `MonthView` 元件（網格、任務儲存格）
3. 連接選項卡切換
4. 新增 FilterBar 元件

### 第 3 階段：模式和側邊面板
1. 實現 `TaskDetailModal`（包括時間在內所有欄位的表單）
2. 實現 `LeftPanel`（具有排序的側邊任務列表）
3. 連接任務點擊時的模式開啟/關閉
4. 將模式儲存連接到 `updateTask()` 和 `revalidatePath()`

### 第 4 階段：週視圖和日視圖
1. 實現 `WeekView`（具有重疊處理的 7 列時間軸）
2. 實現 `DayView`（單日、水平時間軸）
3. 新增導航（上一天/下一天、週、「今天」按鈕）
4. 測試重疊布局

## 未解決的問題

1. **月視圖應該突顯目前日期嗎？** (是的，建議藍色圓圈)
2. **月視圖中焦點月份之外的任務應該顯示為灰色嗎？** (否，省略它們)
3. **日曆的預設縮放級別是什麼？** (首次載入時的月視圖)
4. **是否應該有鍵盤快捷鍵來切換視圖？** (MVP 的範圍外，稍後可以新增)
5. **已完成的任務應該隱藏在日曆中還是只顯示為灰色？** (灰色，按規範)
