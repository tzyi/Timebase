# List Board View

## Purpose
定義清單的看板（Board）呈現方式，讓使用者能以自訂分組（TaskGroup）將特定清單內的任務分欄管理，並可在清單視圖與看板視圖之間自由切換。

## Requirements

### Requirement: Task Group Management
使用者 SHALL 能夠針對自己擁有的清單（List）建立、改名、刪除、排序自訂分組（TaskGroup）。分組僅屬於單一清單，不同清單的分組互相獨立。

#### Scenario: Create a task group
- **WHEN** 使用者在看板視圖中點選「+ 新分組」並輸入名稱
- **THEN** 系統在該清單底下建立一個新分組，排序為目前所有分組中最後一個

#### Scenario: Rename a task group
- **WHEN** 使用者透過分組欄位的「...」選單選擇改名並輸入新名稱
- **THEN** 系統更新該分組的名稱，欄位內任務不受影響

#### Scenario: Delete a task group moves tasks to ungrouped
- **WHEN** 使用者透過分組欄位的「...」選單刪除該分組
- **THEN** 系統刪除該分組，且原本屬於此分組的任務改為未分組（`groupId` 設為 null），任務本身不被刪除

#### Scenario: Reorder task groups
- **WHEN** 使用者拖曳調整分組欄位的顯示順序
- **THEN** 系統依新順序更新各分組的 sortOrder

#### Scenario: Deleting a list cascades its task groups
- **WHEN** 使用者刪除一個清單
- **THEN** 系統一併刪除該清單底下的所有分組，且原本屬於這些分組的任務依「清單刪除」既有規則移入收集箱

### Requirement: Ungrouped Column
每個清單的看板視圖 SHALL 提供一個固定的「未分組」欄位，用來顯示 `groupId` 為 null 的任務。此欄位不對應資料庫中的分組記錄，不可被改名或刪除，且永遠顯示在看板最左側。

#### Scenario: New task defaults to ungrouped
- **WHEN** 使用者在看板視圖或清單視圖中新增任務
- **THEN** 該任務的 `groupId` 預設為 null，顯示於「未分組」欄位

#### Scenario: Ungrouped column cannot be renamed or deleted
- **WHEN** 使用者檢視「未分組」欄位的操作選單
- **THEN** 系統不提供改名或刪除的選項

### Requirement: List/Board View Toggle
使用者在選中具體清單時，SHALL 能夠在清單視圖與看板視圖之間切換，系統 SHALL 記住使用者針對該清單上次選擇的視圖。此切換僅適用於選中具體清單的情境，智慧清單（今天、最近 7 天、標籤篩選、收集箱、已完成）不提供看板視圖。

#### Scenario: Switch to board view
- **WHEN** 使用者在選中清單時點選看板視圖切換按鈕
- **THEN** 主內容區改以看板呈現該清單的任務，並依分組分欄顯示

#### Scenario: View preference is remembered per list
- **WHEN** 使用者將某清單切換為看板視圖後，離開再重新選中同一清單
- **THEN** 系統顯示該清單上次選擇的視圖（看板）

#### Scenario: Smart lists do not offer board view
- **WHEN** 使用者檢視今天、最近 7 天、標籤篩選、收集箱或已完成等智慧清單
- **THEN** 系統不顯示清單/看板視圖切換按鈕，維持原本清單呈現

### Requirement: Move Task Between Groups
使用者 SHALL 能夠在看板視圖中透過拖曳，將任務移動到不同分組欄位，或調整同一分組欄位內的任務順序。

#### Scenario: Drag a card to another column
- **WHEN** 使用者將一張任務卡片拖曳到另一個分組欄位
- **THEN** 系統更新該任務的 `groupId` 為目標分組，並將其排序置於拖放位置

#### Scenario: Drag a card within the same column
- **WHEN** 使用者在同一分組欄位內拖曳調整卡片順序
- **THEN** 系統更新該欄位內任務的 sortOrder 以反映新順序

#### Scenario: Board view shows task count per column
- **WHEN** 使用者檢視看板視圖
- **THEN** 每個欄位標題旁 SHALL 顯示該欄位內的任務數量
