## Why

目前 `/tasks` 頁面選中某個清單時，只能以單一直向列表呈現任務，無法依工作階段（例如 TODO / In progress / Done）分組檢視與管理。使用者需要類似看板（Kanban）的方式，在清單內自訂分組欄位並用拖曳調整任務所屬階段，以更貼近實際工作流程。

## What Changes

- 新增 `TaskGroup` 資料表：每個 `List` 可擁有自己的一組分組（名稱、排序），分組可新增、改名、刪除、排序
- `Task` 新增可為 null 的 `groupId` 欄位；`groupId = null` 代表「未分組」，為固定虛擬欄位（不可刪除/改名，永遠排最左），新任務預設落於此
- 清單標題列新增「清單／看板」視圖切換，僅在選中具體清單時可用（智慧清單如今天、最近 7 天、標籤篩選、收集箱維持原本清單呈現）
- 新增看板視圖元件：每欄顯示分組名稱、任務數、加任務按鈕、`...` 選單（改名／刪除分組），最右側固定「+ 新分組」按鈕
- 支援卡片拖曳跨欄移動（改變任務所屬分組）與欄內拖曳排序，採用 `@dnd-kit`（新增第三方依賴，相容 React 19）
- 刪除分組時，該分組底下的任務全部移回「未分組」，任務本身不被刪除

## Capabilities

### New Capabilities
- `list-board-view`：清單看板視圖，涵蓋分組（TaskGroup）管理、看板欄位渲染、清單/看板視圖切換、卡片跨欄與欄內拖曳排序

### Modified Capabilities
- `task-model`：`Task` 實體新增 `groupId` 欄位（選擇性關聯至 `TaskGroup`，刪除分組時設為 null）

## Impact

- **資料庫**：新增 Prisma model `TaskGroup`，`Task` 新增欄位 `groupId`，需新增 migration
- **Server Actions**：新增 `src/actions/taskGroups.ts`（create/rename/delete/reorder），擴充 `src/actions/tasks.ts`（移動任務所屬分組與排序）
- **前端元件**：`src/components/tasks/` 新增看板相關元件（BoardView、BoardColumn、BoardCard 等），`TaskListView` 上方新增視圖切換 UI
- **依賴**：新增 `@dnd-kit/core`（及相關套件）作為拖曳功能的第三方依賴
