## ADDED Requirements

### Requirement: List Management
使用者 SHALL 能夠建立、編輯、刪除自己的清單（List），每個清單 SHALL 有名稱與顏色，並顯示其未完成任務數量。清單 SHALL 可選擇性歸屬於一個資料夾（ListFolder）。

#### Scenario: Create a list
- **WHEN** 使用者建立一個新清單並輸入名稱與顏色
- **THEN** 系統建立該清單並歸屬於當前使用者，初始未完成任務數量為 0

#### Scenario: Delete a list cascades tasks to inbox
- **WHEN** 使用者刪除一個清單
- **THEN** 系統刪除該清單，且該清單底下原有的任務改為未歸類（移入收集箱，`listId` 設為 null），任務本身不被刪除

#### Scenario: List shows incomplete task count
- **WHEN** 使用者檢視清單側欄
- **THEN** 每個清單旁 SHALL 顯示該清單中狀態為未完成（todo）的任務數量

### Requirement: List Folder Grouping
使用者 SHALL 能夠建立資料夾將多個清單分組顯示。

#### Scenario: Group lists under a folder
- **WHEN** 使用者建立資料夾並將多個清單指定給該資料夾
- **THEN** 側欄中這些清單 SHALL 顯示在該資料夾底下，且資料夾可摺疊/展開

### Requirement: Task Management
使用者 SHALL 能夠在自己的清單中建立、編輯、刪除任務，並將任務標記為完成或取消完成。任務 SHALL 具備標題、備註、到期日（可為空）、優先級旗標、所屬清單（可為空，代表收集箱）。

#### Scenario: Create a task
- **WHEN** 使用者在某清單（或收集箱）中新增任務並輸入標題
- **THEN** 系統建立該任務，狀態預設為 todo，其餘欄位可留空

#### Scenario: Complete a task
- **WHEN** 使用者勾選某任務為已完成
- **THEN** 系統將該任務狀態更新為 done，並記錄完成時間

#### Scenario: Reopen a completed task
- **WHEN** 使用者取消勾選一個已完成的任務
- **THEN** 系統將該任務狀態改回 todo，並清除完成時間

#### Scenario: Edit task fields
- **WHEN** 使用者修改任務的標題、備註、到期日或優先級
- **THEN** 系統儲存更新後的欄位值

#### Scenario: Delete a task
- **WHEN** 使用者刪除一個任務
- **THEN** 系統永久移除該任務及其標籤關聯

### Requirement: Tag Management
使用者 SHALL 能夠建立、編輯、刪除標籤，並將標籤指派給任務（多對多）。使用者 SHALL 能夠依標籤篩選任務清單。

#### Scenario: Create and assign a tag
- **WHEN** 使用者建立新標籤並將其指派給一個任務
- **THEN** 該任務顯示此標籤，且該標籤可被指派給其他任務

#### Scenario: Filter tasks by tag
- **WHEN** 使用者於側欄點選某個標籤
- **THEN** 主內容區只顯示帶有該標籤的任務

#### Scenario: Delete a tag removes associations
- **WHEN** 使用者刪除一個標籤
- **THEN** 系統移除該標籤與所有任務的關聯，任務本身不受影響

### Requirement: Smart Lists
系統 SHALL 提供以下依查詢條件動態產生的智慧清單，皆僅顯示當前登入使用者的任務：今天、最近 7 天、收集箱、已完成、已過期。

#### Scenario: Today smart list
- **WHEN** 使用者開啟「今天」智慧清單
- **THEN** 系統顯示所有 `dueDate` 為今天且狀態為 todo 的任務

#### Scenario: Next 7 days smart list
- **WHEN** 使用者開啟「最近 7 天」智慧清單
- **THEN** 系統顯示所有 `dueDate` 介於今天與today+6天（含）之間且狀態為 todo 的任務

#### Scenario: Inbox smart list
- **WHEN** 使用者開啟「收集箱」
- **THEN** 系統顯示所有 `listId` 為空且狀態為 todo 的任務

#### Scenario: Completed smart list
- **WHEN** 使用者開啟「已完成」
- **THEN** 系統顯示所有狀態為 done 的任務

#### Scenario: Overdue smart list
- **WHEN** 使用者開啟包含「已過期」分組的檢視
- **THEN** 系統顯示所有 `dueDate` 早於今天且狀態為 todo 的任務

### Requirement: Manual Task Postponement
使用者 SHALL 能夠對已過期的任務執行「順延」操作，將其到期日手動調整為今天。此操作為一次性手動更新，不建立任何重複規則。

#### Scenario: Postpone an overdue task
- **WHEN** 使用者對「已過期」分組中的任務點選「順延」
- **THEN** 系統將該任務的 `dueDate` 更新為今天，任務隨即從「已過期」分組移至「今天」智慧清單
