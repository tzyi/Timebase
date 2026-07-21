## 0. 架構和資料庫

- [x] 0.1 更新 Prisma 架構：向 Task 模型新增 `endTime: String?` 欄位
- [x] 0.2 更新 Prisma 架構：向 Task 模型新增 `allDay: Boolean @default(false)` 欄位
- [x] 0.3 執行 `npx prisma migrate dev --name add_task_time_fields`
- [x] 0.4 驗證在 `prisma/migrations/` 中建立的遷移檔案

## 1. 實用程式庫

- [x] 1.1 使用日期實用函數建立 `src/lib/calendarHelpers.ts`：
  - `getMonthDays(year, month)` — 傳回 2D 日期陣列
  - `getWeekDays(date)` — 傳回 7 個日期的陣列 (Mon-Sun)
  - `getWeekNumber(date)` — 傳回 ISO 週數
  - `formatTime(time: string)` — 將「08:30」轉換為顯示格式
  - `timeToMinutes(time: string)` — 將「08:30」轉換為 510
- [x] 1.2 建立 `src/lib/taskTimeClassification.ts`：
  - `enum TaskTimeType { NO_TIME, ALL_DAY, TIMED }`
  - `classifyTaskTime(task)` — 傳回任務的時間類型
  - `sortDayTasks(tasks)` — 按以下方式排序：ALL_DAY → NO_TIME → TIMED（依時間）
- [x] 1.3 建立 `src/lib/taskLayout.ts`（針對週/日重疊）：
  - `calculateTaskLayout(tasks, dayStart, dayEnd)` — 傳回布局陣列
  - 每個布局包括：`{ taskId, column, columnCount, top, height, left }`
- [x] 1.4 使用範例資料進行單元測試實用程式

## 2. Server Actions

- [x] 2.1 更新 `src/actions/tasks.ts`：
  - 修改 `updateTask()` 簽名以接受 `endTime` 和 `allDay` 參數
  - 更新 Prisma 更新以設定這些欄位
- [x] 2.2 新增 `getMonthTasks()` Server Action：
  - 接受：年、月、過濾條件（listIds、tagIds、priorities）
  - 傳回：Map<date, Task[]> 或分組物件
  - 按 `userId`、`dueDate`（月份範圍）和已套用過濾條件進行篩選
- [x] 2.3 新增 `getWeekTasks()` Server Action：
  - 接受：startDate (Monday)、過濾條件
  - 傳回：7 天週 Map<date, Task[]>
- [x] 2.4 新增 `getDayTasks()` Server Action：
  - 接受：日期、過濾條件
  - 傳回：按 `sortDayTasks()` 邏輯排序的 Task[]
  - 包括所有任務詳細資訊（標籤、清單、子任務（如果需要））
- [x] 2.5 使用範例資料測試所有三個 Server Actions

## 3. 日曆頁面框架

- [x] 3.1 建立 `src/components/calendar/CalendarPage.tsx`：
  - 定義 `CalendarState` 類型：{ view, focusDate, filters, selectedTaskId }
  - 使用今天作為 focusDate 初始化狀態
  - 渲染：LeftPanel + RightPanel (Tab + MainView)
- [x] 3.2 建立 `src/components/calendar/FilterBar.tsx`：
  - 清單、標籤、優先級的下拉式清單（多選）
  - 狀態：過濾物件
  - 回呼：`onFilterChange(newFilters)`
- [x] 3.3 建立 `src/app/(app)/calendar/page.tsx`：
  - 呈現 CalendarPage 的伺服器元件
  - 傳遞使用者工作階段檢查（未驗證時重定向）
- [x] 3.4 建立選項卡切換使用者介面：
  - 三個按鈕：[Month] [Week] [Day]
  - 按一下按鈕會更新 `currentView` 狀態（無頁面重新載入）
- [x] 3.5 驗證頁面在 `/calendar` 載入

## 4. 月視圖

- [x] 4.1 建立 `src/components/calendar/MonthView.tsx`：
  - 顯示日曆網格（日期儲存格）
  - 每個儲存格顯示：日期數字 + 星期幾標籤
  - 儲存格樣式：週末著色、今天突顯
- [x] 4.2 擷取並在儲存格中顯示任務：
  - 使用過濾條件呼叫 `getMonthTasks()`
  - 每個儲存格顯示最多 4 個任務（按優先級排序）
  - 灰出已完成任務
  - 如果 > 4 個任務，顯示「+N 個更多」
- [x] 4.3 實現「+N 個更多」展開下拉式清單：
  - 按一下「+N 個更多」會在下拉式清單中顯示該日期的所有任務
  - 下拉式清單中的每個任務可點擊以開啟模式
- [x] 4.4 新增日期點擊處理程式：
  - 按一下日期儲存格會更新 `focusDate` 狀態
  - 側邊面板和日/週視圖應該回應
- [x] 4.5 使用 Tailwind CSS 新增樣式
- [x] 4.6 使用各種任務計數測試月視圖
- [x] 4.7 實現任務顏色和狀態視覺化：
  - 建立 `getTaskBackgroundColor()` 函數：
    - 已完成任務 → 灰色 (bg-gray-200)
    - 過期任務（dueDate 在過去）→ 灰色 (bg-gray-200)
    - 有清單的任務 → List.color 對應的顏色
    - 無清單（收集箱）→ 藍色 (bg-blue-100)
  - 已完成任務顯示打勾標記 (✓)
  - 在任務卡片中應用背景顏色
- [x] 4.8 實現月視圖拖曳互動：
  - 集成 DnD API 或 react-beautiful-dnd 庫
  - 拖曳時任務浮起 + 半透明 (opacity: 0.7)
  - 拖曳預覽：高亮目標日期
  - 拖曳放開時呼叫 `updateTask(taskId, { dueDate: newDate })`
  - 成功 → 任務移動到新位置
  - 失敗 → 任務回到原位置，顯示錯誤吐司通知
  - 禁止拖曳已完成的任務
  - 測試不同日期間的拖曳、邊界情況（月份邊界）
- [x] 4.9 實現滾動導航月份：
  - 在 MonthView 上監聽 wheel 事件
  - 向上滾動 → `previousMonth()`；向下滾動 → `nextMonth()`
  - 使用 throttle/debounce 避免快速多次切換
  - 月份切換時保持焦點日期（如果存在於新月份）
  - 邊界月份邏輯（如 1月31日 → 2月則切換到 2月最後一天）
  - 測試月份邊界、快速滾動
- [x] 4.10 實現週數顯示：
  - 建立 `getWeekNumber(date)` 實用函數（ISO 8601）
  - 在月視圖左邊添加週數列
  - 每週一行顯示該週的 ISO 週數
  - 週數與 7 天日期列對應
- [x] 4.11 在側邊面板任務項目應用相同的顏色方案：
  - 在 DayTasksList 中使用相同的 `getTaskBackgroundColor()` 邏輯
  - 側邊面板任務也顯示顏色背景和打勾（已完成）

## 5. 左側邊面板

- [x] 5.1 建立 `src/components/calendar/LeftPanel.tsx`：
  - 在頂部渲染 FilterBar
  - 在下方渲染 DayTasksList
- [x] 5.2 建立 `src/components/calendar/DayTasksList.tsx`：
  - 顯示標題：「焦點日期：[date]」
  - 透過 `getDayTasks(focusDate, filters)` 擷取任務
  - 使用 `sortDayTasks()` 邏輯排序任務
  - 呈現任務項目（全天部分、無時間部分、定時部分（含分隔符）
  - 應用顏色方案：
    - 已完成任務 → 灰色背景 + 打勾標記
    - 過期任務 → 灰色背景
    - 其他任務 → 基於清單顏色或藍色（收集箱）
  - 每個任務可點擊以開啟模式
- [x] 5.3 為任務屬性新增視覺指標：
  - 高優先級任務的優先級旗標
  - 標籤標籤
  - 時間顯示（針對定時任務：「08:30-09:30」）
  - 已完成任務的打勾標記（✓）
- [x] 5.4 測試點擊任務是否開啟模式
- [x] 5.5 測試顏色方案在側邊面板中的顯示

## 6. 任務詳細資訊模式

- [x] 6.1 建立 `src/components/calendar/TaskDetailModal.tsx`：
  - 模式容器（置中、深色疊加）
  - 關閉按鈕（右上角）
  - 呈現表單欄位：
    - [x] 核取方塊 + 標題 (textarea)
    - 附註 (textarea)
    - 截止日期（日期選擇器）
    - 開始時間（時間輸入，HH:MM）
    - 結束時間（時間輸入，HH:MM）
    - 全天開關（核取方塊）
    - 優先級下拉式清單
    - 清單下拉式清單
    - 標籤多選
  - 保存和取消按鈕
  - 刪除按鈕（含確認）
- [x] 6.2 實現表單狀態管理：
  - 為每個欄位使用 useState
  - 追蹤變化
- [x] 6.3 實現保存處理程式：
  - 使用已變更欄位呼叫 `updateTask()`
  - 呼叫 `revalidatePath('/calendar')` 以重新整理
  - 成功時關閉模式
  - 失敗時顯示錯誤快詞通知
- [x] 6.4 實現刪除處理程式：
  - 顯示確認對話框：「刪除此任務？」
  - 在確認時呼叫 `deleteTask()`
  - 關閉模式並重新整理頁面
- [x] 6.5 實現驗證：
  - 標題必填
  - EndTime >= StartTime（如果兩者都已設定）
  - 顯示錯誤訊息
- [x] 6.6 使用 Tailwind CSS 新增樣式
- [x] 6.7 測試模式開啟/關閉/保存/刪除

## 7. 週視圖

- [x] 7.1 建立 `src/components/calendar/WeekView.tsx`：
  - 呈現 7 天標題（Mon-Sun 及日期）
  - 呈現每小時時間軸（00:00 至 23:59，每小時 60px）
  - 為每一天顯示列
- [x] 7.2 擷取並定位定時任務：
  - 呼叫 `getWeekTasks(weekStart, filters)`
  - 使用 `calculateTaskLayout()` 計算重疊位置
  - 使用正確的 top、height、left、width 呈現任務塊
- [x] 7.3 顯示全天和無時間任務：
  - 時間軸上方的單獨列中的全天任務
  - 時間軸下方的部分中的無時間任務
- [x] 7.4 新增任務點擊以開啟模式
- [x] 7.5 實現上週/下週導航：
  - 箭頭按鈕會將 focusDate 變更為前/後一個星期一
  - 週視圖重新整理
- [x] 7.6 新增樣式（具有背景顏色、邊框的任務塊）
- [x] 7.7 使用範例資料測試重疊處理
- [x] 7.8 測試週之間的導航

## 8. 日視圖

- [x] 8.1 建立 `src/components/calendar/DayView.tsx`：
  - 顯示單一日期標題
  - 呈現每小時時間軸（與 WeekView 相同，但為單一列）
  - 頂部的全天任務
  - 時間軸上定位的定時任務
  - 下方部分的無時間任務
- [x] 8.2 擷取並定位焦點日期的任務：
  - 呼叫 `getDayTasks(focusDate, filters)`（已在側邊面板中擷取，可重複使用）
  - 在時間軸上定位定時任務
- [x] 8.3 新增任務點擊以開啟模式
- [x] 8.4 實現上一天/下一天導航：
  - 標有「上一天」和「下一天」的按鈕
  - 點擊時更新 focusDate
  - 時間軸更新
- [x] 8.5 新增「今天」按鈕：
  - 位於右上角
  - 按一下會將 focusDate 設定為今天
  - 所有視圖重新整理
- [x] 8.6 新增樣式
- [x] 8.7 測試導航和任務定位

## 9. 狀態同步

- [x] 9.1 確保視圖切換保持 focusDate：
  - Month → Week：顯示包含 focusDate 的週
  - Week → Day：顯示 focusDate
  - Day → Month：顯示包含 focusDate 的月份
- [x] 9.2 確保過濾狀態跨視圖保留
- [x] 9.3 確保模式更新立即反映：
  - 保存後，所有視圖顯示已更新的任務
  - 刪除後，任務從所有視圖消失

## 10. 整合和測試

- [x] 10.1 驗證 `/calendar` 頁面無誤地載入
- [x] 10.2 使用範例資料測試月視圖呈現
- [x] 10.3 使用重疊任務測試週視圖
- [x] 10.4 使用全天、無時間、定時任務測試日視圖
- [x] 10.5 測試側邊面板任務列表排序
- [x] 10.6 測試模式開啟/編輯/刪除流程
- [x] 10.7 測試視圖切換和狀態保留
- [x] 10.8 測試跨所有視圖的過濾
- [x] 10.9 測試導航（上一步/下一步、今天按鈕）
- [x] 10.10 在桌面上測試（1920x1080、1440x900、1024x768）
- [x] 10.11 驗證沒有主控台錯誤或警告
- [x] 10.12 測試正常的錯誤處理（網路錯誤、驗證失敗）

## 11. 文件

- [x] 11.1 使用日曆相關資訊更新 CLAUDE.md
- [x] 11.2 為複雜函數新增註解（重疊計算、排序邏輯）
- [x] 11.3 文件元件屬性類型和用法

## 12. 最終質量保證和拋光

- [x] 12.1 驗證所有使用者介面與設計模型相符（從探索階段）
- [x] 12.2 檢查可存取性（鍵盤導航、ARIA 標籤（如果需要））
- [x] 12.3 效能檢查（無不必要的重新呈現）
- [x] 12.4 使用真實任務資料測試（從現有任務匯入）
- [ ] 12.5 使用所有變更建立 git 提交
