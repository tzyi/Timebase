# Task Model

## Purpose
定義 Timebase 任務（Task）實體的資料結構，做為任務管理與日曆系統共用的基礎規格，確保任務的時間欄位在建立、更新與查詢時行為一致。

## Requirements

### Requirement: Task Entity Structure
任務實體 SHALL 包含用於管理任務詳細資訊的欄位。任務記錄由使用者擁有，可以屬於清單，並包含時間管理欄位：
- `id`：唯一識別碼
- `userId`：擁有者使用者 ID
- `listId`：選擇性的清單關聯
- `title`：任務名稱（必填）
- `note`：選擇性說明
- `dueDate`：選擇性截止日期（DateTime）
- `dueTime`：選擇性任務開始時間（HH:MM 格式）
- `endTime`：選擇性任務結束時間（HH:MM 格式）
- `allDay`：全天狀態的布林旗標（預設：false）
- `priority`：優先級（高、中、低、無）
- `status`：任務狀態（待做、完成）
- `completedAt`：標記完成時的時間戳
- `sortOrder`：手動排序順序
- `createdAt`：記錄建立時間戳
- `updatedAt`：記錄更新時間戳
- `tags`：與標籤的多對多關係
- `subtasks`：與子任務的一對多關係

#### Scenario: Create task with time fields
- **WHEN** 建立新任務
- **THEN** dueTime 和 endTime 可以選擇性設定
- **AND** allDay 預設為 false

#### Scenario: Update task time information
- **WHEN** 更新現有任務
- **THEN** dueTime、endTime 和 allDay 可以獨立修改
- **AND** 驗證確保 endTime >= dueTime

#### Scenario: Query tasks by date and time
- **WHEN** 擷取日曆視圖的任務
- **THEN** 任務可以按 dueDate 篩選
- **AND** 任務可以按 dueTime 排序
- **AND** 可以區分帶/不帶時間的任務

#### Scenario: Preserve backward compatibility
- **WHEN** 現有任務有 dueDate，但沒有 dueTime/endTime/allDay
- **THEN** 它們被視為無時間任務（僅顯示，沒有時間定位）
- **AND** 現有任務的 allDay 預設為 false
