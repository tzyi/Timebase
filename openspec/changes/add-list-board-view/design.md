## Context

`/tasks` 頁面（`TasksApp.tsx`）目前只有一種呈現方式：選中一個 View（智慧清單或具體 List）後，`TaskListView` 以扁平直向列表顯示任務。資料模型中 `Task.status` 只用來表示 todo/done 完成狀態，沒有任何「分組/階段」概念。使用者希望在選中具體清單時，能像 TickTick 一樣切換成看板視圖，並自訂任意數量的分組欄位（如 TODO / In progress / Done），把任務拖曳到不同欄位管理工作階段，這與「打勾完成」是兩件互不影響的事。

## Goals / Non-Goals

**Goals:**
- 每個 List 可自訂一組分組（TaskGroup：新增/改名/刪除/排序）
- 選中具體清單時可切換清單／看板兩種視圖，並記住使用者上次選擇
- 看板中可將任務拖曳到不同分組欄位（跨欄），以及同欄內拖曳排序
- 刪除分組時任務安全地移回未分組，不遺失資料

**Non-Goals:**
- 不將分組套用到智慧清單（今天、最近 7 天、標籤、收集箱、已完成）——這些視圖橫跨多個 List，分組歸屬不明確
- 不改變 `Task.status`（todo/done）的既有語意，看板欄位與完成狀態無關
- 不做跨清單拖曳任務（把任務拖到別的 List）
- 不在第一版做行動裝置的看板橫向捲動優化以外的額外手勢（如長按選單）

## Decisions

### 1. 分組落地為獨立資料表 `TaskGroup`，而非借用 `status`
`status` 現有語意是 todo/done，若借用其值當分組 key 會讓「打勾完成」與「拖到 Done 欄」變成同一件事，但截圖顯示兩者其實是分開的（Done 欄可以有 0 筆，跟已完成清單無關）。獨立資料表可讓分組完全自訂命名、數量不限、且每個 List 互相獨立。

```prisma
model TaskGroup {
  id        Int      @id @default(autoincrement())
  listId    Int
  list      List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  name      String
  sortOrder Int      @default(0)
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([listId])
}
```

`Task` 新增：
```prisma
groupId Int?
group   TaskGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
```

`groupId = null` 在 UI 端視為固定的「未分組」虛擬欄位：不對應資料庫中的 TaskGroup row、不可刪除/改名、永遠排在最左側。新建任務預設 `groupId = null`，`createTask` 既有簽章與流程不變。

### 2. 看板視圖只在「選中具體清單」時可用
智慧清單（今天、最近 7 天、標籤篩選、收集箱、已完成）的任務可能橫跨多個 List，而分組是掛在單一 List 底下，若要在這些視圖顯示看板，任務的分組歸屬會定義不清（同一任務在不同清單間本來就至多屬於一個 List，但智慧清單混合了多個 List 的任務，勢必出現「這張卡片該歸哪個看板」的問題）。因此看板只在 `selectedView = { kind: 'list', listId }` 時提供切換選項，其餘視圖維持原本 `TaskListView`。

### 3. 視圖切換記憶：存在 List 上還是 localStorage？
選擇 **localStorage**（key 例如 `timebase:listView:<listId>`），理由：
- 不需要新增資料庫欄位／migration，切換視圖是純前端偏好，不需要跨裝置同步
- 讀寫在客戶端即時生效，不用額外 Server Action
- 若使用者清瀏覽器資料，退回預設「清單視圖」是可接受的行為

替代方案（存在 `List.defaultView` 欄位）需要 migration 且跨裝置同步的價值不高，故不採用。

### 4. 拖曳套件採用 `@dnd-kit`
專案目前無任何拖曳依賴。候選比較：

| 套件 | React 19 相容 | 維護狀態 | 備註 |
|---|---|---|---|
| `react-beautiful-dnd` | 否（已知與 StrictMode/React 18+ 有相容性問題） | 已停止維護 | 不採用 |
| `@dnd-kit/core` | 是 | 活躍維護 | 支援觸控、鍵盤操作、`sortable` 套件可組合出跨欄+欄內排序 |

採用 `@dnd-kit/core` + `@dnd-kit/sortable`。看板欄位（Column）用 `useDroppable`，卡片用 `useSortable`，跨欄移動時在 `onDragEnd` 判斷目標 container 是否變更，呼叫 `moveTaskToGroup`。

### 5. 刪除分組時任務移回未分組（不刪任務）
與清單刪除時任務移入收集箱（`listId = null`）的既有行為（`task-management` spec 的 `Delete a list cascades tasks to inbox` scenario）一致，維持「刪除容器不等於刪除內容」的原則，避免使用者誤刪資料。

### 6. Server Actions 介面
新增 `src/actions/taskGroups.ts`：
- `createTaskGroup(listId: number, name: string)` — 新分組預設 `sortOrder` 為目前最大值 + 1
- `renameTaskGroup(groupId: number, name: string)`
- `deleteTaskGroup(groupId: number)` — 交易內先將 `groupId` 指向該分組的任務更新為 `null`，再刪除分組（Prisma `onDelete: SetNull` 在直接刪除時已會處理，但為了明確性與可測試性，仍在 action 內顯式執行兩步驟）
- `reorderTaskGroups(listId: number, orderedGroupIds: number[])`

擴充 `src/actions/tasks.ts`：
- `moveTaskToGroup(taskId: number, groupId: number | null, targetIndex: number)` — 更新 `groupId` 並依 `targetIndex` 重新計算同欄任務的 `sortOrder`（沿用現有清單排序時的 sortOrder 重算模式）

所有 action 沿用既有的 `userId` 歸屬檢查模式（透過 `listId`/`taskId` 反查 `userId` 是否等於當前 session）。

### 7. 前端元件結構
```
TaskListView（清單視圖，既有）
BoardView（新）
├── BoardColumn（未分組固定一欄 + TaskGroup 動態欄）
│   ├── BoardColumnHeader（名稱、任務數、加任務、「...」選單）
│   └── BoardCard（沿用 TaskRow 的資料展示邏輯，改為卡片樣式）
└── AddGroupButton（"+ 新分組"，固定最右）
```
`TasksApp` 依 `selectedView.kind === 'list'` 決定是否顯示視圖切換按鈕；切換狀態存在 `TasksApp` 內的 local state，初始值讀 localStorage。

## Risks / Trade-offs

- **[風險] 新增第三方依賴 `@dnd-kit` 增加 bundle size 與維護面** → 只在看板元件動態載入（Next.js dynamic import），清單視圖使用者不受影響
- **[風險] 拖曳排序的 sortOrder 重算若併發操作可能產生競態** → 與現有清單/任務排序邏輯相同風險等級，沿用既有重算策略，不在此變更中額外處理分散式鎖
- **[風險] 刪除分組把任務移回未分組，使用者可能誤以為任務被刪除** → 刪除分組前彈出確認對話框，明確告知「內含 N 個任務將移回未分組」
- **[取捨] 看板視圖不支援跨清單拖曳** → 明確排除於 Non-Goals，避免任務的 `listId` 與 `groupId` 一致性問題複雜化第一版

## Migration Plan

1. 新增 Prisma migration：新增 `TaskGroup` 表、`Task.groupId` 欄位（nullable，無需 backfill）
2. 既有任務 `groupId` 全部為 `null`，自動落在「未分組」欄，不影響現有清單視圖顯示
3. 無需 feature flag：看板視圖為選中清單後的額外切換選項，預設仍顯示清單視圖，不影響既有使用流程
4. Rollback：若需回退，僅需回滾 migration（`TaskGroup` 表與 `groupId` 欄位皆可安全移除，不影響其餘資料）

## Open Questions

- 看板卡片要顯示哪些欄位（標題／到期日／優先級／標籤）？預設沿用 `TaskRow` 現有資訊密度，實作時再視畫面寬度微調
- 分組數量或名稱長度是否需要上限？先不加限制，視實際使用情況再補
