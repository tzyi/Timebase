# Task Time Management

## Purpose
定義任務的時間範圍（開始/結束時間）、全天狀態、時間分類與排序、以及持續時間計算等行為規則，供日曆系統與任務清單共用。

## Requirements

### Requirement: Tasks Support Specific Start and End Times
系統 SHALL 允許任務有開始時間和結束時間，使使用者能夠以精確時間和定義的持續時間排程任務。

#### Scenario: Create task with a time range
- **WHEN** 使用者建立或編輯任務
- **THEN** 他們可以為任務開始設定 dueTime（HH:MM 格式）
- **AND** 他們可以為任務結束設定 endTime（HH:MM 格式）
- **AND** 這兩個欄位都是選擇性的

#### Scenario: Validate time input
- **WHEN** 使用者輸入時間值
- **THEN** 它必須採用 HH:MM 格式（00:00 - 23:59）
- **AND** endTime 必須大於或等於 dueTime

#### Scenario: Display time in views
- **WHEN** 任務有 dueTime 和 endTime
- **THEN** 日曆將其顯示為時間塊（例如「08:30-09:30」）
- **WHEN** 任務僅有 dueTime
- **THEN** 日曆將其顯示為時間點（例如「08:30」）

### Requirement: Tasks Support All-Day Status
系統 SHALL 允許將任務標記為全天事件，這些事件與定時任務分開顯示。

#### Scenario: Create an all-day task
- **WHEN** 使用者建立或編輯任務
- **THEN** 他們可以勾選「全天」核取方塊
- **AND** 勾選時，dueTime 和 endTime 欄位會被隱藏或停用

#### Scenario: Display all-day tasks
- **WHEN** 任務有 allDay = true
- **THEN** 它在日視圖的頂部顯示
- **AND** 它顯示為全寬列（不在每小時時間軸上定位）
- **WHEN** 在月視圖中
- **THEN** 全天任務用「全天」標籤標記

#### Scenario: Toggle between all-day and timed
- **WHEN** 使用者取消勾選「全天」核取方塊
- **THEN** dueTime 和 endTime 欄位變成可編輯
- **WHEN** 使用者勾選「全天」核取方塊
- **THEN** dueTime 和 endTime 被清除

### Requirement: Time Classification For Task Organization
系統 SHALL 根據時間資訊將任務分類為三種類型，啟用一致的排序和顯示。

#### Scenario: Classify no-time tasks
- **WHEN** 任務有 dueDate，但沒有 dueTime 和 endTime，且 allDay = false
- **THEN** 它被分類為「no_time」
- **AND** 它顯示沒有特定時間

#### Scenario: Classify all-day tasks
- **WHEN** 任務有 allDay = true
- **THEN** 它被分類為「all_day」
- **AND** 它在專用的全天部分顯示

#### Scenario: Classify timed tasks
- **WHEN** 任務有 dueTime 和 endTime 值
- **THEN** 它被分類為「timed」
- **AND** 它在每小時時間軸上定位

### Requirement: Task Sorting Respects Time Classification
系統 SHALL 根據其時間類型排序任務：全天優先、然後無時間、然後定時（按開始時間）。

#### Scenario: Sort tasks in side panel
- **WHEN** 在側邊面板中顯示一天的任務
- **THEN** 全天任務出現在頂部
- **AND** 無時間任務出現在中間（按優先級排序，然後按建立時間）
- **AND** 定時任務出現在底部（按 dueTime 升序排序）

#### Scenario: Sort tasks in week/day view
- **WHEN** 在每小時時間軸上顯示任務
- **THEN** 全天任務出現在時間軸上方
- **AND** 無時間任務出現在時間軸部分下方
- **AND** 定時任務在時間軸上按開始時間定位

### Requirement: Task Duration Calculation and Visualization
系統 SHALL 根據開始時間和結束時間計算任務持續時間，以便進行顯示和布局。

#### Scenario: Calculate block height from duration
- **WHEN** 在時間軸上呈現定時任務
- **THEN** 系統計算持續時間 = endTime - dueTime
- **AND** 塊高度與持續時間成正比（例如，每小時 60px）

#### Scenario: Handle zero-duration tasks
- **WHEN** dueTime 等於 endTime
- **THEN** 任務顯示為小指標（例如，高 30px）

#### Scenario: Handle tasks spanning midnight
- **WHEN** 任務 startTime 在一天，endTime 在下一天
- **THEN** 任務僅在開始日顯示
- **AND** 它延伸到一天的結束時間（23:59）
