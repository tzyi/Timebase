# Calendar System

## Purpose
Timebase 日曆系統提供月／週／日三層視圖，讓使用者以時間軸角度檢視與管理任務，並與任務清單系統共用資料，支援拖曳排程、多維過濾與焦點日期跨視圖保留。

## Requirements

### Requirement: Month View Displays All Tasks For a Given Month
系統 SHALL 顯示所請求月份的日曆網格，每個日期儲存格顯示最多 4 個按優先級排序的任務（高 → 中 → 低 → 無）。超過 4 個的任務 SHALL 使用「+N 個更多」指標摺疊。

#### Scenario: Display month grid
- **WHEN** 使用者在月視圖中導航到日曆頁面
- **THEN** 系統將當前月份顯示為網格（Sunday-Saturday 列、日期列）

#### Scenario: Display tasks in month cell
- **WHEN** 月份中的日期存在任務
- **THEN** 儲存格中顯示最多 4 個任務，按優先級排序（優先級高在前）
- **AND** 已完成的任務以灰色樣式顯示
- **AND** 如果存在超過 4 個任務，則顯示「+N 個更多」指標

#### Scenario: Expand task list from month cell
- **WHEN** 使用者按一下月儲存格上的「+N 個更多」
- **THEN** 月視圖保持可見
- **AND** 儲存格下方的下拉式清單顯示該日期的所有任務
- **AND** 按一下列表中的任務會開啟任務詳細資訊模式

#### Scenario: Task visual styling and colors
- **WHEN** 月視圖顯示任務
- **THEN** 任務底色根據所屬清單顏色呈現
- **AND** 收集箱（無清單）的任務預設藍色底色
- **AND** 已完成的任務顯示灰色底色並帶有打勾標記
- **AND** 截止日期在過去的任務顯示灰色底色
- **AND** 側邊面板的任務項目使用相同的顏色方案

#### Scenario: Drag task to reschedule
- **WHEN** 使用者在月視圖中按住任務
- **THEN** 任務浮起並變為半透明（opacity 約 0.7）
- **WHEN** 使用者拖曳任務
- **THEN** 預覽高亮目標日期
- **WHEN** 使用者放開任務在新日期
- **THEN** 系統更新該任務的截止日期（dueDate）
- **AND** 任務在日曆中移動到新位置
- **WHEN** 保存失敗（網路錯誤等）
- **THEN** 任務回到原位置，顯示錯誤提示
- **AND** 已完成的任務禁止拖曳

#### Scenario: Scroll navigation between months
- **WHEN** 使用者在月視圖中向上滾動
- **THEN** 系統顯示上個月的日曆
- **AND** 焦點日期保持在對應日期（如果新月份存在）
- **WHEN** 使用者在月視圖中向下滾動
- **THEN** 系統顯示下個月的日曆
- **AND** 焦點日期保持邏輯同上
- **AND** 每次滾動只切換一個月

#### Scenario: Display week numbers
- **WHEN** 月視圖顯示日期
- **THEN** 左邊的週數列顯示每週的 ISO 8601 週數
- **AND** 週數與 Monday-Sunday 的周期對應

### Requirement: Week View Displays Time-Aligned Tasks Across 7 Consecutive Days
系統 SHALL 顯示 7 天週視圖（Monday-Sunday），帶有每小時時間網格。具有時間的每個任務 SHALL 根據其開始時間定位，重疊任務並排顯示。

#### Scenario: Display week timeline
- **WHEN** 使用者切換到週視圖
- **AND** 顯示的週包含今天（初始狀態）
- **THEN** 系統在列中顯示所有 7 天
- **AND** 垂直時間軸顯示小時（00:00 - 23:00）
- **AND** 每個小時槽具有相等的高度

#### Scenario: Position timed tasks
- **WHEN** 任務同時具有 startTime 和 endTime
- **THEN** 任務從其開始時間繪製為塊到結束時間
- **AND** 塊的高度對應於任務持續時間

#### Scenario: Handle overlapping tasks
- **WHEN** 同一天在時間上兩個或多個任務重疊
- **THEN** 為每個重疊任務指派列位置（第 1、2 等）
- **AND** 計算每個任務的寬度以避免像素重疊
- **AND** 系統使用多列布局來顯示所有重疊任務

#### Scenario: Display all-day and no-time tasks
- **WHEN** 任務有 allDay = true
- **THEN** 它在每小時網格上方顯示為單獨的列
- **WHEN** 任務沒有 dueTime 和 endTime
- **THEN** 它在專用部分中的全天任務上方顯示

### Requirement: Day View Displays Detailed Hourly Timeline For a Single Date
系統 SHALL 顯示單一日期詳細視圖，帶有每小時時間軸，按順序顯示所有任務類型（全天、無時間、定時）。

#### Scenario: Display day timeline
- **WHEN** 使用者切換到日視圖
- **THEN** 系統顯示目前選定的日期（焦點日期）
- **AND** 垂直每小時時間軸佔據主要區域
- **AND** 側邊面板列出該天的所有任務（全天 → 無時間 → 定時順序）

#### Scenario: Display task details in day view
- **WHEN** 所選日期存在任務
- **THEN** 全天任務出現在頂部
- **AND** 無時間任務出現在全天任務下方
- **AND** 定時任務在每小時時間軸上定位

### Requirement: Tab-Based View Switching With State Preservation
系統 SHALL 透過標籤支援月、週和日視圖之間的無縫切換，跨切換保留焦點日期。

#### Scenario: Switch views without losing focus date
- **WHEN** 使用者在月視圖中並按一下日期
- **THEN** 該日期變成焦點日期
- **WHEN** 使用者切換到週視圖
- **THEN** 將顯示包含焦點日期的週
- **WHEN** 使用者切換到日視圖
- **THEN** 將顯示焦點日期

#### Scenario: Initialize to today
- **WHEN** 使用者導航到日曆頁面
- **THEN** 焦點日期設定為今天
- **AND** 月視圖顯示當前月份
- **AND** 週視圖顯示包含今天的週
- **AND** 日視圖顯示今天

### Requirement: Navigation Controls For Moving Between Day/Week/Month
系統 SHALL 提供導航控制以在月、週和日視圖中的時間段之間移動。

#### Scenario: Month view navigation
- **WHEN** 使用者在月視圖中按一下上一個/下一個箭頭
- **THEN** 日曆顯示上個月或下個月
- **AND** 焦點日期保持在對應日期（如果存在）

#### Scenario: Week view navigation
- **WHEN** 使用者在週視圖中按一下上一個/下一個箭頭
- **THEN** 日曆顯示上周或下周
- **AND** 焦點日期更新為新週的星期一

#### Scenario: Day view navigation
- **WHEN** 使用者在日視圖中按一下上一個/下一個按鈕
- **THEN** 焦點日期移動到上一天或下一天
- **AND** 時間軸更新以顯示新日期

#### Scenario: "Today" button
- **WHEN** 使用者按一下「今天」按鈕（右上角）
- **THEN** 焦點日期設定為今天
- **AND** 所有視圖更新以顯示今天

### Requirement: Multi-Dimensional Filtering (List, Tag, Priority)
系統 SHALL 允許按清單、標籤和優先級跨所有視圖過濾任務，並支援合併多個過濾器。

#### Scenario: Apply a single filter
- **WHEN** 使用者選擇過濾值（例如，list: "Work"）
- **THEN** 所有視圖僅顯示與該過濾器相符的任務
- **AND** 過濾狀態跨視圖切換保留

#### Scenario: Combine multiple filters
- **WHEN** 使用者選擇多個過濾值（例如，list: "Work" 和 tag: "urgent" 和 priority: "high"）
- **THEN** 僅顯示與所有選定條件相符的任務

#### Scenario: Clear filters
- **WHEN** 使用者清除所有過濾選項
- **THEN** 再次顯示所有任務

### Requirement: Side Panel Displays Tasks For Focus Date
系統 SHALL 在側邊面板中顯示目前選定日期的任務列表，按任務類型排序（全天 → 無時間 → 定時）。

#### Scenario: Display focus date tasks
- **WHEN** 使用者在日曆中選擇日期
- **THEN** 側邊面板更新以顯示該日期的所有任務
- **AND** 任務按以下方式排序：全天優先、然後無時間、然後定時（按開始時間）

#### Scenario: Click task to open modal
- **WHEN** 使用者在側邊面板中按一下任務
- **THEN** 任務詳細資訊模式會使用該任務的資訊開啟
