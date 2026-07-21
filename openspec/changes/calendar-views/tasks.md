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

- [ ] 3.1 建立 `src/components/calendar/CalendarPage.tsx`：
  - 定義 `CalendarState` 類型：{ view, focusDate, filters, selectedTaskId }
  - 使用今天作為 focusDate 初始化狀態
  - 渲染：LeftPanel + RightPanel (Tab + MainView)
- [ ] 3.2 建立 `src/components/calendar/FilterBar.tsx`：
  - 清單、標籤、優先級的下拉式清單（多選）
  - 狀態：過濾物件
  - 回呼：`onFilterChange(newFilters)`
- [ ] 3.3 建立 `src/app/(app)/calendar/page.tsx`：
  - 呈現 CalendarPage 的伺服器元件
  - 傳遞使用者工作階段檢查（未驗證時重定向）
- [ ] 3.4 建立選項卡切換使用者介面：
  - 三個按鈕：[Month] [Week] [Day]
  - 按一下按鈕會更新 `currentView` 狀態（無頁面重新載入）
- [ ] 3.5 驗證頁面在 `/calendar` 載入

## 4. 月視圖

- [ ] 4.1 建立 `src/components/calendar/MonthView.tsx`：
  - 顯示日曆網格（日期儲存格）
  - 每個儲存格顯示：日期數字 + 星期幾標籤
  - 儲存格樣式：週末著色、今天突顯
- [ ] 4.2 擷取並在儲存格中顯示任務：
  - 使用過濾條件呼叫 `getMonthTasks()`
  - 每個儲存格顯示最多 4 個任務（按優先級排序）
  - 灰出已完成任務
  - 如果 > 4 個任務，顯示「+N 個更多」
- [ ] 4.3 實現「+N 個更多」展開下拉式清單：
  - 按一下「+N 個更多」會在下拉式清單中顯示該日期的所有任務
  - 下拉式清單中的每個任務可點擊以開啟模式
- [ ] 4.4 新增日期點擊處理程式：
  - 按一下日期儲存格會更新 `focusDate` 狀態
  - 側邊面板和日/週視圖應該回應
- [ ] 4.5 使用 Tailwind CSS 新增樣式
- [ ] 4.6 使用各種任務計數測試月視圖

## 5. 左側邊面板

- [ ] 5.1 建立 `src/components/calendar/LeftPanel.tsx`：
  - 在頂部渲染 FilterBar
  - 在下方渲染 DayTasksList
- [ ] 5.2 建立 `src/components/calendar/DayTasksList.tsx`：
  - 顯示標題：「焦點日期：[date]」
  - 透過 `getDayTasks(focusDate, filters)` 擷取任務
  - 使用 `sortDayTasks()` 邏輯排序任務
  - 呈現任務項目（全天部分、無時間部分、定時部分（含分隔符）
  - 每個任務可點擊以開啟模式
- [ ] 5.3 為任務屬性新增視覺指標：
  - 高優先級任務的優先級旗標
  - 標籤標籤
  - 時間顯示（針對定時任務：「08:30-09:30」）
- [ ] 5.4 測試點擊任務是否開啟模式

## 6. 任務詳細資訊模式

- [ ] 6.1 建立 `src/components/calendar/TaskDetailModal.tsx`：
  - 模式容器（置中、深色疊加）
  - 關閉按鈕（右上角）
  - 呈現表單欄位：
    - [ ] 核取方塊 + 標題 (textarea)
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
- [ ] 6.2 實現表單狀態管理：
  - 為每個欄位使用 useState
  - 追蹤變化
- [ ] 6.3 實現保存處理程式：
  - 使用已變更欄位呼叫 `updateTask()`
  - 呼叫 `revalidatePath('/calendar')` 以重新整理
  - 成功時關閉模式
  - 失敗時顯示錯誤快詞通知
- [ ] 6.4 實現刪除處理程式：
  - 顯示確認對話框：「刪除此任務？」
  - 在確認時呼叫 `deleteTask()`
  - 關閉模式並重新整理頁面
- [ ] 6.5 實現驗證：
  - 標題必填
  - EndTime >= StartTime（如果兩者都已設定）
  - 顯示錯誤訊息
- [ ] 6.6 使用 Tailwind CSS 新增樣式
- [ ] 6.7 測試模式開啟/關閉/保存/刪除

## 7. 週視圖

- [ ] 7.1 建立 `src/components/calendar/WeekView.tsx`：
  - 呈現 7 天標題（Mon-Sun 及日期）
  - 呈現每小時時間軸（00:00 至 23:59，每小時 60px）
  - 為每一天顯示列
- [ ] 7.2 擷取並定位定時任務：
  - 呼叫 `getWeekTasks(weekStart, filters)`
  - 使用 `calculateTaskLayout()` 計算重疊位置
  - 使用正確的 top、height、left、width 呈現任務塊
- [ ] 7.3 顯示全天和無時間任務：
  - 時間軸上方的單獨列中的全天任務
  - 時間軸下方的部分中的無時間任務
- [ ] 7.4 新增任務點擊以開啟模式
- [ ] 7.5 實現上週/下週導航：
  - 箭頭按鈕會將 focusDate 變更為前/後一個星期一
  - 週視圖重新整理
- [ ] 7.6 新增樣式（具有背景顏色、邊框的任務塊）
- [ ] 7.7 使用範例資料測試重疊處理
- [ ] 7.8 測試週之間的導航

## 8. 日視圖

- [ ] 8.1 建立 `src/components/calendar/DayView.tsx`：
  - 顯示單一日期標題
  - 呈現每小時時間軸（與 WeekView 相同，但為單一列）
  - 頂部的全天任務
  - 時間軸上定位的定時任務
  - 下方部分的無時間任務
- [ ] 8.2 擷取並定位焦點日期的任務：
  - 呼叫 `getDayTasks(focusDate, filters)`（已在側邊面板中擷取，可重複使用）
  - 在時間軸上定位定時任務
- [ ] 8.3 新增任務點擊以開啟模式
- [ ] 8.4 實現上一天/下一天導航：
  - 標有「上一天」和「下一天」的按鈕
  - 點擊時更新 focusDate
  - 時間軸更新
- [ ] 8.5 新增「今天」按鈕：
  - 位於右上角
  - 按一下會將 focusDate 設定為今天
  - 所有視圖重新整理
- [ ] 8.6 新增樣式
- [ ] 8.7 測試導航和任務定位

## 9. 狀態同步

- [ ] 9.1 確保視圖切換保持 focusDate：
  - Month → Week：顯示包含 focusDate 的週
  - Week → Day：顯示 focusDate
  - Day → Month：顯示包含 focusDate 的月份
- [ ] 9.2 確保過濾狀態跨視圖保留
- [ ] 9.3 確保模式更新立即反映：
  - 保存後，所有視圖顯示已更新的任務
  - 刪除後，任務從所有視圖消失

## 10. 整合和測試

- [ ] 10.1 驗證 `/calendar` 頁面無誤地載入
- [ ] 10.2 使用範例資料測試月視圖呈現
- [ ] 10.3 使用重疊任務測試週視圖
- [ ] 10.4 使用全天、無時間、定時任務測試日視圖
- [ ] 10.5 測試側邊面板任務列表排序
- [ ] 10.6 測試模式開啟/編輯/刪除流程
- [ ] 10.7 測試視圖切換和狀態保留
- [ ] 10.8 測試跨所有視圖的過濾
- [ ] 10.9 測試導航（上一步/下一步、今天按鈕）
- [ ] 10.10 在桌面上測試（1920x1080、1440x900、1024x768）
- [ ] 10.11 驗證沒有主控台錯誤或警告
- [ ] 10.12 測試正常的錯誤處理（網路錯誤、驗證失敗）

## 11. 文件

- [ ] 11.1 使用日曆相關資訊更新 CLAUDE.md
- [ ] 11.2 為複雜函數新增註解（重疊計算、排序邏輯）
- [ ] 11.3 文件元件屬性類型和用法

## 12. 最終質量保證和拋光

- [ ] 12.1 驗證所有使用者介面與設計模型相符（從探索階段）
- [ ] 12.2 檢查可存取性（鍵盤導航、ARIA 標籤（如果需要））
- [ ] 12.3 效能檢查（無不必要的重新呈現）
- [ ] 12.4 使用真實任務資料測試（從現有任務匯入）
- [ ] 12.5 使用所有變更建立 git 提交
